import { ConversationStatus } from 'src/app/enums/bot-conversation';
import { UserModel } from 'src/app/interfaces/user';
import { Bot } from './bot';

export interface BotConversationEntity {
  id: string;
  title: string;
  botId: string;
}

export interface BotConversationModel extends BotConversationEntity {
  userId: string;
  status: ConversationStatus;
  createdAt?: number;
  updatedAt?: number;
  bot?: Bot;
  user?: UserModel;
  messageCount?: number;
}
