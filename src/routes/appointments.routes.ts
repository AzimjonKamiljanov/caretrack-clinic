import { Router } from 'express';
import { getAppointments, createAppointmentForm, createAppointment, editAppointmentForm, updateAppointment, deleteAppointment } from '../controllers/appointments.controller';
import { isAuth, roleCheck } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { appointmentSchema } from '../validators/appointment.validator';

const router = Router();

router.use(isAuth);

router.get('/', getAppointments);
router.get('/create', roleCheck(['admin', 'receptionist']), createAppointmentForm);
router.post('/', roleCheck(['admin', 'receptionist']), validate(appointmentSchema), createAppointment);
router.get('/:id/edit', roleCheck(['admin', 'receptionist']), editAppointmentForm);
router.post('/:id', roleCheck(['admin', 'receptionist']), validate(appointmentSchema), updateAppointment);
router.post('/:id/delete', roleCheck(['admin']), deleteAppointment);

export default router;
