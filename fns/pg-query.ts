import RDS from 'aws-sdk/clients/rds';
import { Client, QueryResult } from 'pg';

export const handler = async (): Promise<QueryResult> => {
  if (!process.env.DB_HOSTNAME) {
    throw new Error('Missing DB_HOSTNAME!');
  }
  const iamUser = process.env.IAM_USER;
  const signer = new RDS.Signer();

  const client = new Client({
    database: process.env.IAM_DB,
    host: process.env.DB_HOSTNAME,
    password: signer.getAuthToken({
      hostname: process.env.DB_HOSTNAME,
      port: 5432,
      region: process.env.AWS_REGION,
      username: iamUser,
    }),
    ssl: true,
    user: iamUser,
  });

  await client.connect();

  return await client.query('SELECT * FROM users;');
};
