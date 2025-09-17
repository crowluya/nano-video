import { orders as ordersSchema } from '@/lib/db/schema';

export type OrderWithUser = typeof ordersSchema.$inferSelect & {
  users: {
    email: string;
    name: string | null;
  } | null;
}; 