import { z } from 'zod';

export const userSchema = z.object({
  username: z.string().min(1, 'Username is required').trim(),
  password: z.string().min(6, 'Password must be at least 6 characters').optional().or(z.literal('')),
  full_name: z.string().min(1, 'Full name is required').trim(),
  role: z.enum(['admin', 'clinician', 'receptionist']),
});

export const createUserSchema = z.object({
  username: z.string().min(1, 'Username is required').trim(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  full_name: z.string().min(1, 'Full name is required').trim(),
  role: z.enum(['admin', 'clinician', 'receptionist']),
});
