export const queryPromiseResponse = jest.fn().mockResolvedValue(true);

export class Client {
  connect = (): Promise<void> => Promise.resolve();
  query = queryPromiseResponse;
}
