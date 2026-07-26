import { TagStatus } from '../enums/tag';

export interface TagVo {
  id: string;
  name: string;
  status: TagStatus;
  objectCount?: number;
}
