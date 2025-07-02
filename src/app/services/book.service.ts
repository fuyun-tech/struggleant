import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ApiUrl } from 'src/app/config/api-url';
import { APP_ID } from 'src/app/config/common.constant';
import { ApiService } from 'src/app/services/api.service';
import { BookType } from '../enums/book';
import { BookEntity } from '../interfaces/book';

@Injectable({
  providedIn: 'root'
})
export class BookService {
  constructor(private readonly apiService: ApiService) {}

  getBookById(bookId: string): Observable<BookEntity> {
    return this.apiService
      .httpGet(ApiUrl.BOOK, {
        bookId,
        appId: APP_ID
      })
      .pipe(map((res) => res?.data || {}));
  }

  getBookName(book?: BookEntity, withMark = true) {
    let shortName = '';
    let fullName = '';

    if (!book) {
      return {
        shortName,
        fullName
      };
    }
    if ([BookType.BOOK, BookType.OTHER].includes(book.bookType)) {
      shortName = fullName = withMark ? `《${book.bookName}》` : book.bookName;
    }
    if (withMark) {
      fullName = `《${book.bookName}》${book.bookIssue ? '（' + book.bookIssue + '）' : ''}`;
    } else {
      fullName = `${book.bookName}${book.bookIssue ? '（' + book.bookIssue + '）' : ''}`;
    }
    shortName = book.bookIssue || book.bookName;

    return {
      shortName,
      fullName
    };
  }
}
