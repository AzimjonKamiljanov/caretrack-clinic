import { z } from 'zod';

export const doctorSchema = z.object({
  full_name: z.string().min(1, 'Full name is required').trim(),
  specialty: z.string().min(1, 'Specialty is required').trim(),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  experience_years: z.coerce.number().min(0).optional().default(0),
  bio: z.string().optional().nullable(),
});
