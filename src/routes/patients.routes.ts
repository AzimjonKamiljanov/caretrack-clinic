import { Router } from 'express';
import { getPatients, createPatientForm, createPatient, getPatientById, editPatientForm, updatePatient, deletePatient } from '../controllers/patients.controller';
import { isAuth, roleCheck } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { patientSchema } from '../validators/patient.validator';

const router = Router();

router.use(isAuth);

router.get('/', getPatients);
router.get('/create', createPatientForm);
router.post('/', validate(patientSchema), createPatient);
router.get('/:id', getPatientById);
router.get('/:id/edit', roleCheck(['admin', 'clinician']), editPatientForm);
router.post('/:id', roleCheck(['admin', 'clinician']), validate(patientSchema), updatePatient);
router.post('/:id/delete', roleCheck(['admin']), deletePatient);

export default router;
