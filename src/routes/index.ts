import { Router } from 'express';
import appointmentsRoutes from './appointments.routes';
import patientsRoutes from './patients.routes';
import illnessesRoutes from './illnesses.routes';
import doctorsRoutes from './doctors.routes';
import usersRoutes from './users.routes';

const router = Router();

router.use('/patients', patientsRoutes);
router.use('/doctors', doctorsRoutes);
router.use('/illnesses', illnessesRoutes);
router.use('/users', usersRoutes);
router.use('/appointments', appointmentsRoutes);

export default router;
