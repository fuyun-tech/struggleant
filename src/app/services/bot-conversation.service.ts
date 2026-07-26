import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiUrl } from 'src/app/config/api-url';
import { BotConversationModel } from 'src/app/interfaces/bot-conversation';
import { ApiService } from 'src/app/services/api.service';

@Injectable({
  providedIn: 'root'
})
export class BotConversationService {
  constructor(private apiService: ApiService) {}

  getConversation(id: string, targetId?: string): Observable<BotConversationModel> {
    return this.apiService
      .httpGet(ApiUrl.CONVERSATION, {
        id,
        targetId
      })
      .pipe(map((res) => res?.data || {}));
  }

  askAI(targetId: string): Observable<{ conversationId: string }> {
    return this.apiService
      .httpPost(ApiUrl.CONVERSATION_ASK_AI, {
        targetId,
        targetType: 'post'
      })
      .pipe(map((res) => res?.data || {}));
  }
}
