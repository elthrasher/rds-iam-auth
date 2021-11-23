import { awsSdkPromiseResponse } from '../__mocks__/aws-sdk/promiseResponse';
import { queryPromiseResponse } from '../__mocks__/mysql2/promise';
import { handler } from './mysql-ddl';

const event = {
  LogicalResourceId: '',
  RequestId: '999',
  ResourceProperties: { ServiceToken: 'foo' },
  ResourceType: '',
  ResponseURL: '',
  ServiceToken: 'foo',
  StackId: '123',
};

const PhysicalResourceId = 'mysql-ddl';

describe('Set up MySQL database', () => {
  afterEach(awsSdkPromiseResponse.mockReset);
  test('should require a SECRET_ARN', async () => {
    const response = await handler({
      ...event,
      RequestType: 'Create',
    });
    expect(response).toMatchObject({
      ...event,
      PhysicalResourceId,
      Reason: 'SECRET_ARN variable missing!',
      Status: 'FAILED',
    });
  });
  test('Create flow', async () => {
    process.env.SECRET_ARN = 'bar';
    awsSdkPromiseResponse.mockReturnValueOnce({ SecretString: JSON.stringify({}) });
    const response = await handler({
      ...event,
      RequestType: 'Create',
    });

    expect(response).toMatchObject({ ...event, PhysicalResourceId, Status: 'SUCCESS' });
  });
  test('Delete flow', async () => {
    const response = await handler({
      ...event,
      PhysicalResourceId,
      RequestType: 'Delete',
    });
    expect(response).toMatchObject({ ...event, PhysicalResourceId, Status: 'SUCCESS' });
  });
  test('Fail to get a secret', async () => {
    awsSdkPromiseResponse.mockReturnValueOnce({});
    const response = await handler({
      ...event,
      RequestType: 'Create',
    });

    expect(response).toMatchObject({
      ...event,
      PhysicalResourceId,
      Reason: 'Unable to fetch secret!',
      Status: 'FAILED',
    });
  });
  test('Failed query', async () => {
    awsSdkPromiseResponse.mockReturnValueOnce({ SecretString: JSON.stringify({}) });
    queryPromiseResponse.mockReturnValueOnce(Promise.reject('Failed!'));
    const response = await handler({
      ...event,
      RequestType: 'Create',
    });

    expect(response).toMatchObject({ ...event, PhysicalResourceId, Reason: 'Failed!', Status: 'FAILED' });
  });
});
