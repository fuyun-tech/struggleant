import { HttpStatusCode } from '@angular/common/http';
import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse
} from '@angular/ssr/node';
import { Feed } from '@fuyun/feed';
import { environment } from 'env/environment';
import express from 'express';
import { uniq } from 'lodash';
import { join } from 'node:path';
import { EnumChangefreq, SitemapItemLoose, SitemapStream, streamToPromise } from 'sitemap';
import { ApiUrl } from 'src/app/config/api-url';
import { Message } from 'src/app/config/message.enum';
import { PostVo } from 'src/app/interfaces/post';
import { SitemapData } from 'src/app/interfaces/sitemap';
import { simpleRequest } from 'src/app/utils/helper';
import { Readable } from 'stream';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine({
  allowedHosts: environment.allowedHosts,
  trustProxyHeaders: environment.trustProxies
});

app.get('/rss.xml', async (req, res) => {
  try {
    const { page, size, detail } = req.query;
    const { data: appInfo } = await simpleRequest({
      url: ApiUrl.TENANT_APP,
      appId: environment.appId,
      apiBase: environment.apiBase
    });
    const { data: options } = await simpleRequest({
      url: ApiUrl.OPTION_FRONTEND,
      appId: environment.appId,
      apiBase: environment.apiBase
    });
    const showDetail = detail === '1';
    const { data: postList } = await simpleRequest({
      url: ApiUrl.POST_LIST_FOR_RSS,
      param: {
        page: Number(page) || 1,
        size: Math.min(Number(size) || 10, 100),
        detail: showDetail ? 1 : 0,
        isPinned: 0
      },
      appId: environment.appId,
      apiBase: environment.apiBase
    });
    const posts: PostVo[] = postList.list || [];
    const feed = new Feed({
      title: appInfo.name,
      description: appInfo.description,
      language: 'zh-cn',
      dcExtension: true,
      id: environment.appUrl,
      link: environment.appUrl,
      image: appInfo.logoUrl,
      favicon: appInfo.faviconUrl,
      copyright: `2024-${new Date().getFullYear()} ${appInfo.domain}`,
      updated: new Date(),
      generator: appInfo.domain,
      feedLinks: {
        rss: `${environment.appUrl}/rss.xml`
      },
      webMaster: options['site_author']
    });

    posts.forEach((post) => {
      feed.addItem({
        title: post.title,
        id: post.id,
        link: environment.appUrl + post.url,
        description: post.summary,
        content: showDetail ? post.content : post.summary,
        creator: post.author || post.creator.nickname,
        category: post.categories.map((category) => ({ name: category.category.slug })),
        date: new Date(post.publishedAt),
        image: post.coverUrl
      });
    });

    res.type('application/rss+xml').send(feed.rss2());
  } catch {
    res.status(HttpStatusCode.InternalServerError).send(Message.ERROR_500);
  }
});
app.get('/sitemap.xml', async (req, res) => {
  try {
    const postList: SitemapData = (
      await simpleRequest({
        url: ApiUrl.SITEMAP_POST,
        appId: environment.appId,
        apiBase: environment.apiBase
      })
    ).data;
    const pageList: SitemapData = (
      await simpleRequest({
        url: ApiUrl.SITEMAP_PAGE,
        appId: environment.appId,
        apiBase: environment.apiBase
      })
    ).data;
    const sitemapStream = new SitemapStream({
      hostname: environment.appUrl
    });

    const links: SitemapItemLoose[] = [
      {
        url: environment.appUrl,
        changefreq: EnumChangefreq.ALWAYS,
        priority: 1
      },
      {
        url: environment.appUrl + '/posts',
        changefreq: EnumChangefreq.ALWAYS,
        priority: 1
      },
      {
        url: environment.appUrl + '/archive',
        changefreq: EnumChangefreq.ALWAYS,
        priority: 0.8
      }
    ];
    const posts: SitemapItemLoose[] = postList.posts.map((item) => ({
      url: environment.appUrl + item.url,
      changefreq: EnumChangefreq.ALWAYS,
      priority: 1,
      lastmod: new Date(item.updatedAt).toString()
    }));
    const postArchivesByMonth: SitemapItemLoose[] = postList.postArchives.map((item) => ({
      url: `${environment.appUrl}/archive/${item.dateValue}`,
      changefreq: EnumChangefreq.DAILY,
      priority: 0.7
    }));
    const postArchivesByYear: SitemapItemLoose[] = uniq(
      postList.postArchives.map((item) => item.dateValue.split('/')[0])
    ).map((item) => ({
      url: `${environment.appUrl}/archive/${item}`,
      changefreq: EnumChangefreq.DAILY,
      priority: 0.7
    }));
    const categories: SitemapItemLoose[] = postList.categories.map((item) => ({
      url: `${environment.appUrl}/category/${item.slug}`,
      changefreq: EnumChangefreq.DAILY,
      priority: 0.7
    }));
    const tags: SitemapItemLoose[] = postList.tags.map((item) => ({
      url: `${environment.appUrl}/tag/${item.name}`,
      changefreq: EnumChangefreq.DAILY,
      priority: 0.7
    }));
    const pages: SitemapItemLoose[] = pageList.posts.map((item) => ({
      url: environment.appUrl + item.url,
      changefreq: EnumChangefreq.DAILY,
      priority: 1,
      lastmod: new Date(item.updatedAt).toString()
    }));

    streamToPromise(
      <Readable>(
        Readable.from(links.concat(pages, posts, categories, tags, postArchivesByYear, postArchivesByMonth)).pipe(
          sitemapStream
        )
      )
    ).then((data) => res.type('application/xml').send(data.toString()));
  } catch {
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
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) => (response ? writeResponseToNodeResponse(response, res) : next()))
    .catch(next);
});

/**
 * Start the server if this module is the main entry point, or it is ran via PM2.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = environment.port || 4000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }

    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * The request handler used by the Angular CLI (dev-server and during build).
 */
export const reqHandler = createNodeRequestHandler(app);
