import { Routes } from '@angular/router';
import { LoginCallbackComponent } from './pages/auth/login-callback/login-callback.component';
import { LoginComponent } from './pages/auth/login/login.component';
import { SignupConfirmComponent } from './pages/auth/signup-confirm/signup-confirm.component';
import { SignupComponent } from './pages/auth/signup/signup.component';
import { ForbiddenComponent } from './pages/error/forbidden/forbidden.component';
import { NotFoundComponent } from './pages/error/not-found/not-found.component';
import { ServerErrorComponent } from './pages/error/server-error/server-error.component';
import { HomeComponent } from './pages/home/home.component';
import { AuthLayoutComponent } from './pages/layout/auth-layout/auth-layout.component';
import { ContentLayoutComponent } from './pages/layout/content-layout/content-layout.component';
import { PageComponent } from './pages/page/page.component';
import { PostArchiveComponent } from './pages/post-archive/post-archive.component';
import { PostListComponent } from './pages/post-list/post-list.component';
import { PostComponent } from './pages/post/post.component';
import { SearchComponent } from './pages/search/search.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', component: HomeComponent },
  {
    path: 'post',
    component: ContentLayoutComponent,
    children: [
      { path: ':slug', component: PostComponent }
    ]
  },
  {
    path: 'post-list',
    component: ContentLayoutComponent,
    children: [
      { path: '', pathMatch: 'full', component: PostListComponent }
    ]
  },
  {
    path: 'category',
    component: ContentLayoutComponent,
    children: [
      { path: ':category', component: PostListComponent }
    ]
  },
  {
    path: 'tag',
    component: ContentLayoutComponent,
    children: [
      { path: ':tag', component: PostListComponent }
    ]
  },
  {
    path: 'archive',
    component: ContentLayoutComponent,
    children: [
      { path: '', pathMatch: 'full', component: PostArchiveComponent },
      { path: ':year', component: PostListComponent },
      { path: ':year/:month', component: PostListComponent }
    ]
  },
  {
    path: 'search',
    component: ContentLayoutComponent,
    children: [{ path: '', pathMatch: 'full', component: SearchComponent }]
  },
  {
    path: 'user',
    component: AuthLayoutComponent,
    children: [
      { path: 'login', component: LoginComponent },
      { path: 'login/callback', component: LoginCallbackComponent, data: { bg: false } },
      { path: 'signup', component: SignupComponent },
      { path: 'confirm', component: SignupConfirmComponent }
    ],
    data: {
      centered: true
    }
  },
  {
    path: ':slug',
    component: ContentLayoutComponent,
    children: [{ path: '', pathMatch: 'full', component: PageComponent }]
  },
  {
    path: 'error',
    children: [
      { path: '403', component: ForbiddenComponent },
      { path: '404', component: NotFoundComponent },
      { path: '500', component: ServerErrorComponent }
    ]
  },
  { path: '**', redirectTo: '/error/404' }
];
