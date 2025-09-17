import { createDatabase } from './config';

export const db = createDatabase({
  connectionString: process.env.DATABASE_URL!
});
