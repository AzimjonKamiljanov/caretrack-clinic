import { Router } from 'express';
import { getUsers, createUserForm, createUser, editUserForm, updateUser, deleteUser } from '../controllers/users.controller';
import { isAuth, roleCheck } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { userSchema, createUserSchema } from '../validators/user.validator';

const router = Router();

router.use(isAuth, roleCheck(['admin']));

router.get('/', getUsers);
router.get('/create', createUserForm);
router.post('/', validate(createUserSchema), createUser);
router.get('/:id/edit', editUserForm);
router.post('/:id', validate(userSchema), updateUser);
router.post('/:id/delete', deleteUser);

export default router;
