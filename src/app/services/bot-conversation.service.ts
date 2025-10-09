import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiUrl } from 'src/app/config/api-url';
import { AskAIParam, BotConversationModel } from 'src/app/interfaces/bot-conversation';
import { ApiService } from 'src/app/services/api.service';

@Injectable({
  providedIn: 'root'
})
export class BotConversationService {
  constructor(private apiService: ApiService) {}

  getConversation(conversationId: string, objectId?: string): Observable<BotConversationModel> {
    return this.apiService
      .httpGet(ApiUrl.CONVERSATION, {
        conversationId,
        objectId
      })
      .pipe(map((res) => res?.data || {}));
  }

  askAI(param: AskAIParam): Observable<{ conversationId: string }> {
    return this.apiService.httpPost(ApiUrl.CONVERSATION_ASK_AI, param).pipe(map((res) => res?.data || {}));
  }
}
