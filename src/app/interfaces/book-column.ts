import { ColumnStatus } from 'src/app/enums/book-column';

export interface BookColumnEntity {
  bookColumnId: string;
  bookMetaId: string;
  bookColumnName: string;
  bookColumnSlug: string;
  bookColumnDescription: string;
  bookColumnStatus: ColumnStatus;
  bookColumnOrder: number;
}
