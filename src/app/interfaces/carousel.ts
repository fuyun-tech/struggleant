import { LinkTarget } from 'src/app/enums/link';

export interface Carousel {
  id: string;
  title: string;
  caption: string;
  url: string;
  link?: string;
  target: LinkTarget;
  order: number;
}

export interface CarouselOptions {
  type: 'album' | 'wallpaper';
  orderBy?: 'hottest' | 'newest' | 'oldest' | 'random';
  size?: number;
}
