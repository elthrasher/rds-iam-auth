export interface User {
  // to work with mysql2 types
  constructor: {
    name: 'RowDataPacket';
  };
  id: number;
  name: string;
}
