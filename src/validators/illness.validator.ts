import { z } from 'zod';

export const illnessSchema = z.object({
  patient_id: z.coerce.number().positive(),
  doctor_id: z.coerce.number().positive(),
  diagnosis: z.string().min(1, 'Diagnosis is required').trim(),
  description: z.string().optional().nullable(),
  prescribed_meds: z.string().optional().nullable(),
  status: z.enum(['Faol', 'Davolanmoqda', 'Tuzalgan']).optional().default('Faol'),
  diagnosed_date: z.string().optional().nullable(),
});
