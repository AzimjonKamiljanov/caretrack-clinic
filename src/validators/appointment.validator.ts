import { z } from 'zod';

export const appointmentSchema = z.object({
  patient_id: z.coerce.number().positive(),
  doctor_id: z.coerce.number().positive(),
  appointment_date: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "Invalid date format",
  }),
  status: z.enum(['Scheduled', 'Completed', 'Cancelled']).optional().default('Scheduled'),
  reason: z.string().optional(),
});
