import { environment } from 'env/environment';

export const APP_ID = environment.appId;

export const REGEXP_ID = /^[0-9a-zA-Z]{16}$/i;

export const ADMIN_URL_PARAM = 'token=$0&appId=$1';
export const URL_AVATAR_API = 'https://cravatar.cn/avatar/$0.png?d=$1';

export const COOKIE_KEY_THEME = 'theme';
export const COOKIE_KEY_UV_ID = 'faid';
export const COOKIE_KEY_USER_ID = 'uid';
export const COOKIE_KEY_USER_NAME = 'user';
export const COOKIE_KEY_USER_TOKEN = 'token';

export const MEDIA_QUERY_THEME_DARK = '(prefers-color-scheme: dark)';
export const MEDIA_QUERY_THEME_LIGHT = '(prefers-color-scheme: light)';
