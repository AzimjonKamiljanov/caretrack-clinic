import { z } from 'zod';

export const patientSchema = z.object({
  full_name: z.string().min(1, 'Patient name is required').trim(),
  date_of_birth: z.string().optional().nullable(),
  gender: z.enum(['Erkak', 'Ayol']).optional().nullable(),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  blood_type: z.string().optional().nullable(),
  emergency_contact: z.string().optional().nullable(),
  doctor_id: z.coerce.number().optional().nullable(),
});
