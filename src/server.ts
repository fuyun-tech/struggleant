import { HttpStatusCode } from '@angular/common/http';
import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse
} from '@angular/ssr/node';
import { Feed } from '@fuyun/feed';
import { environment } from 'env/environment';
import express, { Request, Response } from 'express';
import { uniq } from 'lodash';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { EnumChangefreq, SitemapItemLoose, SitemapStream, streamToPromise } from 'sitemap';
import { Readable } from 'stream';
import { ApiUrl } from './app/config/api-url';
import { Message } from './app/config/message.enum';
import { PostType } from './app/enums/post';
import { Post } from './app/interfaces/post';
import { SitemapData } from './app/interfaces/sitemap';

const serverDistFolder = dirname(fileURLToPath(import.meta.url));
const browserDistFolder = resolve(serverDistFolder, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();

const request = async (url: string, param: Record<string, any> = {}) => {
  const reqParam = Object.entries(param)
    .map((item) => `${item[0]}=${item[1]}`)
    .join('&');
  const urlParam = `?appId=${environment.appId}${reqParam ? '&' + reqParam : ''}`;
  const response = await fetch(environment.apiBase + url + urlParam, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(Message.ERROR_500);
  }
  return response.json();
};

app.get('/rss.xml', async (req: Request, res: Response) => {
  try {
    const { page, size, detail } = req.query;
    const showDetail = detail === '1';
    const { data: appInfo } = await request(ApiUrl.TENANT_APP);
    const { data: options } = await request(ApiUrl.OPTION_FRONTEND);
    const { data: postList } = await request(ApiUrl.POST_RSS, {
      page: Number(page) || 1,
      pageSize: Math.min(Number(size) || 10, 100),
      detail: showDetail ? 1 : 0,
      sticky: 0
    });
    const posts: Post[] = postList.list || [];
    const feed = new Feed({
      title: appInfo.appName,
      description: appInfo.appDescription,
      language: 'zh-cn',
      dcExtension: true,
      id: appInfo.appUrl,
      link: appInfo.appUrl,
      image: appInfo.appLogoUrl,
      favicon: appInfo.appFaviconUrl,
      copyright: `2014-${new Date().getFullYear()} ${appInfo.appDomain}`,
      updated: new Date(),
      generator: appInfo.appDomain,
      feedLinks: {
        rss: `${appInfo.appUrl}/rss.xml`
      },
      webMaster: options['site_author']
    });

    posts.forEach((item) => {
      const post = item.post;
      feed.addItem({
        title: post.postTitle,
        id: post.postId,
        link: appInfo.appUrl + post.postGuid,
        description: post.postExcerpt,
        content: showDetail ? post.postContent : post.postExcerpt,
        creator: item.meta['post_author'] || post.owner.userNickname,
        category: item.categories.map((category) => ({ name: category.taxonomySlug })),
        date: new Date(post.postDate),
        image: post.cover
      });
    });

    res.type('application/rss+xml').send(feed.rss2());
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e: any) {
    res.status(HttpStatusCode.InternalServerError).send(Message.ERROR_500);
  }
});
app.get('/sitemap.xml', async (req: Request, res: Response) => {
  try {
    const { data: appInfo } = await request(ApiUrl.TENANT_APP);
    const sitemap: SitemapData = (await request(ApiUrl.SITEMAP)).data;
    const sitemapStream = new SitemapStream({
      hostname: appInfo.appUrl
    });

    const links: SitemapItemLoose[] = [
      {
        url: appInfo.appUrl,
        changefreq: EnumChangefreq.ALWAYS,
        priority: 1
      },
      {
        url: appInfo.appUrl + '/post',
        changefreq: EnumChangefreq.ALWAYS,
        priority: 1
      },
      {
        url: appInfo.appUrl + '/post/archive',
        changefreq: EnumChangefreq.ALWAYS,
        priority: 0.8
      }
    ];
    const pages: SitemapItemLoose[] = sitemap.posts
      .filter((item) => item.postType === PostType.PAGE)
      .map((item) => ({
        url: appInfo.appUrl + item.postGuid,
        changefreq: EnumChangefreq.DAILY,
        priority: 1,
        lastmod: new Date(item.postModified).toString()
      }));
    const posts: SitemapItemLoose[] = sitemap.posts
      .filter((item) => item.postType === PostType.POST)
      .map((item) => ({
        url: appInfo.appUrl + item.postGuid,
        changefreq: EnumChangefreq.ALWAYS,
        priority: 0.9,
        lastmod: new Date(item.postModified).toString()
      }));
    const postArchivesByMonth: SitemapItemLoose[] = sitemap.postArchives.map((item) => ({
      url: `${appInfo.appUrl}/post/archive/${item.dateValue}`,
      changefreq: EnumChangefreq.DAILY,
      priority: 0.7
    }));
    const postArchivesByYear: SitemapItemLoose[] = uniq(
      sitemap.postArchives.map((item) => item.dateValue.split('/')[0])
    ).map((item) => ({
      url: `${appInfo.appUrl}/post/archive/${item}`,
      changefreq: EnumChangefreq.DAILY,
      priority: 0.7
    }));
    const taxonomies: SitemapItemLoose[] = sitemap.taxonomies.map((item) => ({
      url: `${appInfo.appUrl}/post/category/${item.taxonomySlug}`,
      changefreq: EnumChangefreq.DAILY,
      priority: 0.7
    }));
    const tags: SitemapItemLoose[] = sitemap.tags.map((item) => ({
      url: `${appInfo.appUrl}/post/tag/${item.tagName}`,
      changefreq: EnumChangefreq.DAILY,
      priority: 0.7
    }));

    streamToPromise(
      <Readable>(
        Readable.from(
          links.concat(
            pages,
            posts,
            taxonomies,
            tags,
            postArchivesByYear,
            postArchivesByMonth
          )
        ).pipe(sitemapStream)
      )
    ).then((data) => res.type('application/xml').send(data.toString()));
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e: any) {
    res.status(HttpStatusCode.InternalServerError).send(Message.ERROR_500);
  }
});

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false
  })
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use('/**', (req, res, next) => {
  angularApp
    .handle(req)
    .then((response) => (response ? writeResponseToNodeResponse(response, res) : next()))
    .catch(next);
});

/**
 * Start the server if this module is the main entry point.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 *
 * pm2 环境下 isMainModule(import.meta.url) 始终为 false，因此需要额外判断路径
 */
if (isMainModule(import.meta.url) || !import.meta.url.includes('/.angular/')) {
  const port = environment.port || 4000;
  app.listen(port, () => {
    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * The request handler used by the Angular CLI (dev-server and during build).
 */
export const reqHandler = createNodeRequestHandler(app);
