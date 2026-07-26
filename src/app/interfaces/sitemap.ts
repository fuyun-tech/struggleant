import { CategoryVo } from './category';
import { ArchiveData } from './common';
import { PostModel } from './post';
import { TagVo } from './tag';

export interface SitemapData {
  posts: PostModel[];
  postArchives: ArchiveData[];
  categories: CategoryVo[];
  tags: TagVo[];
}
