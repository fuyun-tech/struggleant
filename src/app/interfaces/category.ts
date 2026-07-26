import { CategoryStatus, CategoryType } from '../enums/category';

export interface CategoryVo {
  id: string;
  type: CategoryType;
  name: string;
  slug: string;
  description: string;
  icon: string;
  parentId?: string;
  status: CategoryStatus;
  sort: number;
  objectCount?: number;
}

export interface CategoryNode extends CategoryVo {
  children?: CategoryNode[];
  isLeaf?: boolean;
}
