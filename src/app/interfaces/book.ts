import { BookType } from 'src/app/enums/book';

export interface BookMetaVo {
  id: string;
  name: string;
  author: string;
  translator: string;
  type: BookType;
}

export interface BookVo {
  id: string;
  issue: string;
  issueTotal: number;
  bookMeta: BookMetaVo;
}
