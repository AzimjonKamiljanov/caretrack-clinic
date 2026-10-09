import { Router } from 'express';
import { getDoctors, createDoctorForm, createDoctor, getDoctorById, editDoctorForm, updateDoctor, deleteDoctor } from '../controllers/doctors.controller';
import { isAuth, roleCheck } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { doctorSchema } from '../validators/doctor.validator';

const router = Router();

router.use(isAuth);

router.get('/', getDoctors);
router.get('/create', roleCheck(['admin']), createDoctorForm);
router.post('/', roleCheck(['admin']), validate(doctorSchema), createDoctor);
router.get('/:id', getDoctorById);
router.get('/:id/edit', roleCheck(['admin']), editDoctorForm);
router.post('/:id', roleCheck(['admin']), validate(doctorSchema), updateDoctor);
router.post('/:id/delete', roleCheck(['admin']), deleteDoctor);

export default router;
