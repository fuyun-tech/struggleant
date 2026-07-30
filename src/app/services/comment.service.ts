import { Injectable } from '@angular/core';
import { BehaviorSubject, map, Observable } from 'rxjs';
import { ApiUrl } from '../config/api-url';
import { URL_AVATAR_API } from '../config/common.constant';
import { Comment, CommentDto } from '../interfaces/comment';
import { ResultList } from '../interfaces/common';
import { HttpResponseEntity } from '../interfaces/http-response';
import { format } from '../utils/helper';
import { ApiService } from './api.service';
import { IpService } from './ip.service';

@Injectable({
  providedIn: 'root'
})
export class CommentService {
  private targetId: BehaviorSubject<string> = new BehaviorSubject<string>('');
  public targetId$: Observable<string> = this.targetId.asObservable();

  constructor(
    private readonly apiService: ApiService,
    private readonly ipService: IpService
  ) {}

  updateTargetId(targetId: string) {
    this.targetId.next(targetId);
  }

  getCommentsByPostId(param: { postId: string; page: number; size: number }): Observable<ResultList<Comment>> {
    const { postId, page, size } = param;

    return this.apiService
      .httpGet(ApiUrl.COMMENTS, {
        targetId: postId,
        page,
        size
      })
      .pipe(map((res) => res?.data || {}));
  }

  saveComment(comment: CommentDto): Observable<HttpResponseEntity> {
    return this.apiService.httpPost(ApiUrl.COMMENT, comment, true);
  }

  transformComments(comments: Comment[], avatarType: string): Comment[] {
    return comments.map((item) => {
      return {
        ...item,
        idHash: item.id.substring(4, 10),
        userName: item.user?.nickname || item.userName,
        userAvatar:
          item.user?.avatarUrl || format(URL_AVATAR_API, item.user?.emailHash || item.userEmailHash, avatarType),
        userLocation: this.ipService.getIPLocation({
          country: item.ipCountry,
          province: item.ipProvince,
          city: item.ipCity,
          isp: item.ipIsp
        }),
        depth: 1,
        isLeaf: true,
        parent: item.parent
          ? {
              ...item.parent,
              idHash: item.parent.id.substring(4, 10),
              userName: item.parent.user?.nickname || item.parent.userName || '匿名用户'
            }
          : undefined,
        children: []
      };
    });
  }

  initCommentTree(comments: Comment[]) {
    const map = new Map<string, Comment>();

    comments.forEach((item) => {
      map.set(item.id, item);
    });

    const roots: Comment[] = [];

    comments.forEach((item) => {
      const node = map.get(item.id)!;
      const parent = item.parentId ? map.get(item.parentId) : null;

      if (!parent) {
        roots.push(node);
      } else {
        parent.children.push(node);
      }
    });

    return roots;
  }

  flattenChildComments(node: Comment, depth: number) {
    const result: Comment[] = [];
    const walk = (n: Comment) => {
      if (n.children.length < 1) {
        return;
      }
      for (const child of n.children) {
        result.push({
          ...child,
          children: [],
          depth,
          isLeaf: true
        });
        walk(child);
      }
    };

    walk(node);

    return result.sort((a, b) => {
      return a.createdAt > b.createdAt ? 1 : -1;
    });
  }

  buildCommentTree(params: { comments: Comment[]; depth: number; avatarType: string }) {
    const { comments, depth, avatarType } = params;
    const tree = this.initCommentTree(this.transformComments(comments, avatarType));
    const transform = (nodes: Comment[], curDepth: number) => {
      for (const node of nodes) {
        node.depth = curDepth;
        if (node.children.length) {
          if (curDepth < depth - 1) {
            node.children = transform(node.children, curDepth + 1);
          } else {
            node.children = this.flattenChildComments(node, depth);
          }
          node.isLeaf = node.children.length < 1;
        }
      }

      return nodes.sort((a, b) => {
        return a.createdAt > b.createdAt ? 1 : -1;
      });
    };

    for (const node of tree) {
      node.children = transform(node.children, 2);
      node.isLeaf = node.children.length < 1;
    }

    return tree;
  }
}
