import { Router } from 'express';
import { userController } from '../controllers';
import { createUser, updateUser, deleteUser, getUsers, addFamilyMemberSchema, updateFamilyMemberSchema, deleteFamilyMemberSchema, validateRequest, validateParams, validateQuery } from '../validation';

const router = Router();

// User CRUD
router.post('/add', validateRequest(createUser), userController.createUser);
router.put('/update', validateRequest(updateUser), userController.updateUser);
router.delete('/:id', validateParams(deleteUser), userController.deleteUser);
router.get('/all', validateQuery(getUsers), userController.getUsers);

// Family member management
router.post('/:id/family', validateRequest(addFamilyMemberSchema), userController.addFamilyMember);
router.put('/:id/family/:memberId', validateRequest(updateFamilyMemberSchema), userController.updateFamilyMember);
router.delete('/:id/family/:memberId', validateRequest(deleteFamilyMemberSchema), userController.deleteFamilyMember);

export const userRouter = router;
