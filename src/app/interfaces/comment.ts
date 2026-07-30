import { CommentStatus, CommentTargetType } from '../enums/comment';
import { UserModel } from './user';

export interface CommentDto {
  targetId: string;
  targetType: CommentTargetType;
  parentId?: string;
  topId?: string;
  userName?: string;
  userEmail?: string;
  content: string;
}

export interface CommentModel extends CommentDto {
  id: string;
  floor: number;
  status: CommentStatus;
  createdAt: Date;
  updatedAt: Date;
  userEmailHash: string;
  userHomepage: string;
  userIp: string;
  ipCountry: string;
  ipProvince: string;
  ipCity: string;
  ipIsp: string;
  userAgent: string;
  parentId: string;
  userId: string;
  likes: number;
  dislikes: number;
  user?: UserModel;
  userLocation: string;
  liked?: boolean;
  disliked?: boolean;
  idHash: string;
  userAvatar: string;
}

export interface Comment extends CommentModel {
  children: Comment[];
  parent?: Comment;
  depth?: number;
  isLeaf: boolean;
}
