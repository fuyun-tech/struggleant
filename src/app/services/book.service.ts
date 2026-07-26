import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ApiUrl } from 'src/app/config/api-url';
import { ApiService } from 'src/app/services/api.service';
import { BookType } from '../enums/book';
import { BookVo } from '../interfaces/book';

@Injectable({
  providedIn: 'root'
})
export class BookService {
  constructor(private readonly apiService: ApiService) {}

  getBookById(id: string): Observable<BookVo> {
    return this.apiService.httpGet(ApiUrl.BOOK, { id }).pipe(map((res) => res?.data || {}));
  }

  getBookName(book?: BookVo | null, withMark = true) {
    let shortName = '';
    let fullName = '';

    if (!book) {
      return {
        shortName,
        fullName
      };
    }
    if ([BookType.BOOK, BookType.OTHER].includes(book.bookMeta.type)) {
      shortName = fullName = withMark ? `《${book.bookMeta.name}》` : book.bookMeta.name;
    }
    if (withMark) {
      fullName = `《${book.bookMeta.name}》${book.issue ? '（' + book.issue + '）' : ''}`;
    } else {
      fullName = `${book.bookMeta.name}${book.issue ? '（' + book.issue + '）' : ''}`;
    }
    shortName = book.issue || book.bookMeta.name;

    return {
      shortName,
      fullName
    };
  }
}
