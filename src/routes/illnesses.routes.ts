import { Router } from 'express';
import { getIllnesses, createIllnessForm, createIllness, editIllnessForm, updateIllness, deleteIllness } from '../controllers/illnesses.controller';
import { isAuth, roleCheck } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { illnessSchema } from '../validators/illness.validator';

const router = Router();

router.use(isAuth);

router.get('/', getIllnesses);
router.get('/create', roleCheck(['admin', 'clinician']), createIllnessForm);
router.post('/', roleCheck(['admin', 'clinician']), validate(illnessSchema), createIllness);
router.get('/:id/edit', roleCheck(['admin', 'clinician']), editIllnessForm);
router.post('/:id', roleCheck(['admin', 'clinician']), validate(illnessSchema), updateIllness);
router.post('/:id/delete', roleCheck(['admin']), deleteIllness);

export default router;
