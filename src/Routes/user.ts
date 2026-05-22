import { Router } from 'express';
import { userController } from '../controllers';
import { createUser, updateUser, deleteUser, getUsers, addFamilyMemberSchema, updateFamilyMemberSchema, deleteFamilyMemberSchema, validateRequest, validateParams, validateQuery, getUserById } from '../validation';

const router = Router();

// User CRUD
router.post('/add', validateRequest(createUser), userController.createUser);
router.put('/update', validateRequest(updateUser), userController.updateUser);
router.delete('/:id', validateParams(deleteUser), userController.deleteUser);
router.get('/all', validateQuery(getUsers), userController.getUsers);
router.get('/:id', validateParams(getUserById), userController.getUserById);

// Family member management
router.post('/family', validateRequest(addFamilyMemberSchema), userController.addFamilyMember);
router.put('/family', validateRequest(updateFamilyMemberSchema), userController.updateFamilyMember);
router.delete('/family', validateRequest(deleteFamilyMemberSchema), userController.deleteFamilyMember);

export const userRouter = router;
