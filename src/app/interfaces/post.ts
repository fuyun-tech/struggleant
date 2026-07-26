import { BookColumnStatus } from 'src/app/enums/book-column';
import { SwitchValue } from '../enums/common';
import { ContentForm, ContentType, PostCommentStatus, PostLicense, PostStatus, PostVisibility } from '../enums/post';
import { BookVo } from './book';
import { BookColumnEntity } from './book-column';
import { BreadcrumbEntity } from './breadcrumb';
import { CategoryVo } from './category';
import { QueryParam, ResultList } from './common';
import { TagVo } from './tag';
import { UserDto } from './user';

export interface PostEntity {
  id: string;
  title: string;
  slug?: string;
  url: string;
  content: string;
  summary?: string;
  contentType: ContentType;
  contentForm?: ContentForm;
  coverImageUrl?: string;
  coverWallpaperId?: string;
  isOriginal: SwitchValue;
  author?: string;
  translator?: string;
  source?: string;
  sourceUrl?: string;
  bookId?: string;
  bookColumnId?: string;
  isPaid?: SwitchValue;
  price?: number;
  trialPercent?: number;
  license: PostLicense;
  visibility: PostVisibility;
  viewPassword?: string;
  commentStatus?: PostCommentStatus;
  status: PostStatus;
  isPinned?: SwitchValue;
  pinnedAt?: number;
  publishedAt: number;
  parentId?: string;
}

export interface PostStatVo {
  viewCount: number;
  likeCount: number;
  commentCount: number;
  favoriteCount: number;
}

export interface PostModel extends PostEntity {
  url: string;
  creatorId?: string;
  creator: UserDto;
  createdAt: number;
  updatedAt: number;
  postStat: PostStatVo;
  coverUrl: string;
}

export interface PostCategoryVo {
  postId: string;
  sort: number;
  category: CategoryVo;
}

export interface PostTagVo {
  postId: string;
  sort: number;
  tag: TagVo;
}

export interface PostVo extends PostModel {
  metadata: Record<string, string>;
  categories: PostCategoryVo[];
  tags: PostTagVo[];
  book?: BookVo;
  bookColumn?: BookColumnEntity;
  breadcrumbs?: BreadcrumbEntity[];
  isFavorite: boolean;
  isVoted: boolean;
}

export interface PostQueryParam extends QueryParam {
  category?: string;
  tag?: string;
  bookId?: string;
  columnSlug?: string;
  columnId?: string;
  year?: string;
  month?: string;
  isPinned?: 0 | 1;
  simple?: 0 | 1;
}

export interface PostList {
  posts: ResultList<PostVo>;
  book?: BookVo;
  bookColumn?: BookColumnEntity;
  breadcrumbs?: BreadcrumbEntity[];
}

export interface PostSearchItem {
  postId: string;
  title: string;
  url: string;
  coverUrl: string;
  score: number;
}

export interface PostCatalog {
  id: string;
  name: string;
  slug: string;
  sort: number;
  posts: Array<{
    id: string;
    title: string;
    url: string;
    createdAt: number;
  }>;
}
