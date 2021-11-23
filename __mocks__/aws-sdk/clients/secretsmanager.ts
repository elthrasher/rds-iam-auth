import { awsSdkPromiseResponse } from '../promiseResponse';

const mockGetSecretValue = jest.fn().mockImplementation(() => ({ promise: awsSdkPromiseResponse }));

export default class SecretsManager {
  getSecretValue = mockGetSecretValue;
}
