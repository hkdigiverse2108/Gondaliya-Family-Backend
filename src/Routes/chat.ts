import { Router } from 'express';
import { chatController } from '../controllers';
import { sendChatMessage, deleteChatMessage, blockChatMessage, getChatMessages, validateRequest, validateParams, validateQuery } from '../validation';

const router = Router();

router.post('/add', validateRequest(sendChatMessage), chatController.sendMessage);
router.get('/all', validateQuery(getChatMessages), chatController.getChats);
router.delete('/:id', validateParams(deleteChatMessage), chatController.deleteChat);
router.put('/block', validateRequest(blockChatMessage), chatController.blockChat);

export const chatRouter = router;
