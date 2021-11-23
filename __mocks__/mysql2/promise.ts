import { Connection, ConnectionOptions } from 'mysql2';

export const queryPromiseResponse = jest.fn().mockReturnValue(new Promise((resolve) => resolve(true)));

export const createConnection = async (config?: ConnectionOptions): Promise<Connection> => {
  if (typeof config?.authPlugins?.mysql_clear_password === 'function') {
    (config?.authPlugins?.mysql_clear_password({ connection: {} as Connection, command: 'plug' }) as () => string)();
  }

  return {
    query: queryPromiseResponse,
  } as unknown as Connection;
};
