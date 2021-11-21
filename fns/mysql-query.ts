import RDS from 'aws-sdk/clients/rds';
import { createConnection, OkPacket, ResultSetHeader, RowDataPacket } from 'mysql2/promise';

/**
 * Execute a simple query. RDS Signer is used to generate a temporary token to connect.
 * This connection is over ssl.
 */
export const handler = async (): Promise<
  RowDataPacket[] | RowDataPacket[][] | OkPacket | OkPacket[] | ResultSetHeader
> => {
  if (!process.env.DB_HOSTNAME) {
    throw new Error('Missing env vars!');
  }
  const iamUser = process.env.IAM_USER;
  const signer = new RDS.Signer();

  const connection = await createConnection({
    authPlugins: {
      mysql_clear_password: () => (): string => {
        return signer.getAuthToken({
          hostname: process.env.DB_HOSTNAME,
          region: process.env.AWS_REGION,
          username: iamUser,
        });
      },
    },
    database: process.env.IAM_DB,
    host: process.env.DB_HOSTNAME,
    ssl: 'Amazon RDS',
    user: iamUser,
  });

  const [rows] = await connection.query('SELECT * FROM users;');
  return rows;
};
