import { BookColumnStatus } from 'src/app/enums/book-column';

export interface BookColumnEntity {
  id: string;
  bookMetaId: string;
  name: string;
  slug: string;
  description: string;
  status: BookColumnStatus;
  sort: number;
}
