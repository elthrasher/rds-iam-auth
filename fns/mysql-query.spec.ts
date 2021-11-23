import { awsSdkPromiseResponse } from '../__mocks__/aws-sdk/promiseResponse';
import { queryPromiseResponse } from '../__mocks__/mysql2/promise';
import { handler } from './mysql-query';

const rows = [{ id: 1, name: 'Matt' }];

describe('Query using IAM Authentication', () => {
  afterEach(awsSdkPromiseResponse.mockReset);

  test('should require a DB_HOSTNAME', async () => {
    expect.assertions(1);
    try {
      await handler();
    } catch (e) {
      expect((e as Error).message).toBe('Missing DB_HOSTNAME!');
    }
  });

  test('Query users table', async () => {
    process.env.DB_HOSTNAME = 'my.fake.host';
    awsSdkPromiseResponse.mockReturnValueOnce(Promise.resolve({ SecretString: JSON.stringify({}) }));
    queryPromiseResponse.mockReturnValueOnce([rows]);
    const response = await handler();

    expect(response).toMatchObject(rows);
  });
});
