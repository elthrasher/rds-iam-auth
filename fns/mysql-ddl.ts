import {
  CloudFormationCustomResourceEvent,
  CloudFormationCustomResourceFailedResponse,
  CloudFormationCustomResourceSuccessResponse,
} from 'aws-lambda';
import SecretsManager from 'aws-sdk/clients/secretsmanager';
import { Connection, createConnection } from 'mysql2/promise';

const sm = new SecretsManager({ region: process.env.AWS_REGION });

const PhysicalResourceId = 'mysql-ddl';

// Fetch the master secret from Secrets Manager and use that to set up the database.
const getConnection = async (): Promise<Connection> => {
  if (!process.env.SECRET_ARN) {
    throw new Error('SECRET_ARN variable missing!');
  }
  try {
    const { SecretString } = await sm.getSecretValue({ SecretId: process.env.SECRET_ARN }).promise();
    if (!SecretString) {
      throw new Error('Unable to fetch secret!');
    }
    const { password, dbname: database, host, username: user } = JSON.parse(SecretString);

    return createConnection({ database, host, multipleStatements: true, password, user });
  } catch (e) {
    console.error('An error occurred while creating a db connection: ', (e as Error).message);
    throw e;
  }
};

// Custom resources have Create, Update an Delete lifecycles. In this case we only care about Create.
export const handler = async (
  event: CloudFormationCustomResourceEvent,
): Promise<CloudFormationCustomResourceSuccessResponse | CloudFormationCustomResourceFailedResponse> => {
  const iamDb = process.env.IAM_DB;
  const iamUser = process.env.IAM_USER;
  switch (event.RequestType) {
    case 'Create':
      try {
        const connection = await getConnection();

        const statements = [
          `CREATE TABLE users (id int(10) UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY, name VARCHAR(50));`,
          `CREATE USER ${iamUser} IDENTIFIED WITH AWSAuthenticationPlugin AS 'RDS';`,
          `INSERT INTO users (name) VALUES ('Matt');`,
          `GRANT SELECT ON ${iamDb}.users TO ${iamUser};`,
          `FLUSH PRIVILEGES;`,
        ];

        for (const stmt of statements) {
          try {
            await connection.query(stmt);
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
