import { UserAiStatus, UserStatus } from 'src/app/enums/user';

export interface UserDto {
  id?: string;
  nickname: string;
  email?: string;
  password?: string;
  createdAt?: number;
  status?: UserStatus;
  appId: string;
}

export interface UserModel extends UserDto {
  name?: string;
  emailHash?: string;
  avatarUrl?: string;
  aiStatus: UserAiStatus;
  aiModels: string[];
  aiExpiresAt: number;
  aiLimit: number;
  isAdmin?: boolean;
  metadata?: Record<string, string>;
  permissions: string[];
}
