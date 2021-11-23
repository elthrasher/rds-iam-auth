import { awsSdkPromiseResponse } from '../__mocks__/aws-sdk/promiseResponse';
import { queryPromiseResponse } from '../__mocks__/pg';
import { handler } from './pg-ddl';

import('./pg-ddl').then;

const event = {
  LogicalResourceId: '',
  RequestId: '999',
  ResourceProperties: { ServiceToken: 'foo' },
  ResourceType: '',
  ResponseURL: '',
  ServiceToken: 'foo',
  StackId: '123',
};

const PhysicalResourceId = 'pg-ddl';

describe('Set up Postgres database', () => {
  afterEach(() => {
    awsSdkPromiseResponse.mockReset();
    jest.resetModules();
  });
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
  test('Fail to get a secret', async () => {
    process.env.SECRET_ARN = 'bar';
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
  test('Create flow', async () => {
    awsSdkPromiseResponse.mockReturnValue({ SecretString: JSON.stringify({}) });
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
  test('Failed query', async () => {
    queryPromiseResponse.mockRejectedValueOnce('Failed!');
    const response = await handler({
      ...event,
      RequestType: 'Create',
    });

    expect(response).toMatchObject({ ...event, PhysicalResourceId, Reason: 'Failed!', Status: 'FAILED' });
  });
});
