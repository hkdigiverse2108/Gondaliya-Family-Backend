import { Router } from 'express';
import { privateChatController } from '../controllers';
import { startConversationSchema, getPrivateMessagesQuerySchema, conversationIdParamSchema, validateRequest, validateParams, validateQuery } from '../validation';

const router = Router();

router.post('/start', validateRequest(startConversationSchema), privateChatController.startConversation);
router.get('/conversations', privateChatController.getConversations);
router.get('/:conversationId/messages', validateParams(conversationIdParamSchema), validateQuery(getPrivateMessagesQuerySchema), privateChatController.getMessages);
router.put('/:conversationId/read', validateParams(conversationIdParamSchema), privateChatController.markAsRead);
router.delete('/:conversationId', validateParams(conversationIdParamSchema), privateChatController.deleteConversation);

export const privateChatRouter = router;
