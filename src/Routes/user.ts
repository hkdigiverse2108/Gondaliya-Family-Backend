import { Router } from 'express';
import { userController } from '../controllers';
import { createUser, updateUser, deleteUser, getUsers, validateRequest } from '../validation';

const router = Router();

router.post('/add', validateRequest(createUser), userController.createUser);
router.put('/update', validateRequest(updateUser), userController.updateUser);
router.delete('/:id', validateRequest(deleteUser), userController.deleteUser);
router.get('/', validateRequest(getUsers), userController.getUsers);

export const userRouter = router;
