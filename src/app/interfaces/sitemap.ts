import { ArchiveData } from './common';
import { PostEntity } from './post';
import { TagEntity } from './tag';
import { TaxonomyEntity } from './taxonomy';

export interface SitemapData {
  posts: PostEntity[];
  postArchives: ArchiveData[];
  taxonomies: TaxonomyEntity[];
  tags: TagEntity[];
}
