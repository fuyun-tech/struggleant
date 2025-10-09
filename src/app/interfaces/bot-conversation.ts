import { ConversationStatus } from 'src/app/enums/bot-conversation';
import { UserModel } from 'src/app/interfaces/user';
import { Bot } from './bot';

export interface BotConversationEntity {
  conversationId: string;
  conversationTitle: string;
  botId: string;
}

export interface BotConversationModel extends BotConversationEntity {
  userId: string;
  conversationStatus: ConversationStatus;
  conversationCreated?: number;
  conversationModified?: number;
  bot?: Bot;
  user?: UserModel;
  messageCount?: number;
}

export interface AskAIParam {
  objectId: string;
  objectType: 'post' | 'wallpaper';
}
