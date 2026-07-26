import { PostVo } from './post';

export interface SearchParam {
  keyword: string;
  page?: number;
  size?: number;
}

export interface SearchResponse extends PostVo {
  score: number;
}
