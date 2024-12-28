import { SearchType } from '../enums/search';
import { Post } from './post';

export interface SearchParam {
  keyword: string;
  page?: number;
  size?: number;
}

export interface SearchResponse {
  type: SearchType;
  data: Post;
  score: number;
}
