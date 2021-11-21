import {
  CloudFormationCustomResourceEvent,
  CloudFormationCustomResourceFailedResponse,
  CloudFormationCustomResourceSuccessResponse,
} from 'aws-lambda';
import SecretsManager from 'aws-sdk/clients/secretsmanager';
import { Client } from 'pg';

const sm = new SecretsManager({ region: process.env.AWS_REGION });

const PhysicalResourceId = 'pg-ddl';

let client: Client;

const getConnection = async (): Promise<Client> => {
  if (client) {
    return client;
  }
  if (!process.env.SECRET_ARN) {
    throw new Error('SECRET_ARN variable missing!');
  }
  try {
    const { SecretString } = await sm.getSecretValue({ SecretId: process.env.SECRET_ARN }).promise();
    if (!SecretString) {
      throw new Error('Unable to fetch secret!');
    }
    const { password, dbname: database, host, username: user } = JSON.parse(SecretString);

    client = new Client({
      database,
      host,
      password,
      port: 5432,
      ssl: true,
      user,
    });

    await client.connect();
    return client;
  } catch (e) {
    console.error('An error occurred while creating a db connection: ', (e as Error).message);
    throw e;
  }
};

export const handler = async (
  event: CloudFormationCustomResourceEvent,
): Promise<CloudFormationCustomResourceSuccessResponse | CloudFormationCustomResourceFailedResponse> => {
  const iamUser = process.env.IAM_USER;
  switch (event.RequestType) {
    case 'Create':
      try {
        const connection = await getConnection();

        const statements = [
          `CREATE TABLE users (id SERIAL PRIMARY KEY, name TEXT);`,
          `CREATE USER ${iamUser}`,
          `GRANT rds_iam TO ${iamUser}`,
          `INSERT INTO users (name) VALUES ('Matt');`,
          `GRANT SELECT ON users TO ${iamUser};`,
        ];

        for (const stmt of statements) {
          try {
            console.log('executing', stmt);
            await connection.query(stmt);
            console.log('ran', stmt);
          } catch (e) {
            console.error('failed sql: ', stmt);
            console.error(e);
          }
        }

        return { ...event, PhysicalResourceId, Status: 'SUCCESS' };
      } catch (e) {
        console.error(`ddl initialization failed!`, e);
        return { ...event, PhysicalResourceId, Reason: (e as Error).message, Status: 'FAILED' };
      }
    default:
      console.error('No op for', event.RequestType);
      return { ...event, PhysicalResourceId, Status: 'SUCCESS' };
  }
};
