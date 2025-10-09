export enum ApiUrl {
  // search
  SEARCH_POSTS = '/search/posts',
  // option
  OPTION = '/options/option',
  OPTION_FRONTEND = '/options/frontend',
  OPTION_CAROUSELS = '/options/carousels',
  // util
  SITEMAP_POST = '/posts/post-sitemap',
  SITEMAP_PAGE = '/posts/page-sitemap',
  // post
  POSTS = '/posts',
  POST = '/posts/post',
  POST_HOT = '/posts/hot',
  POST_RANDOM = '/posts/random',
  POST_RELATED = '/posts/related',
  POST_LIST_BY_BOOK = '/posts/list-by-book',
  POST_LIST_WITH_COLUMN = '/posts/list-with-column',
  POST_LIST_FOR_RSS = '/posts/list-for-rss',
  POST_PREV_AND_NEXT = '/posts/prev-and-next',
  POST_ARCHIVES = '/posts/archives',
  // taxonomy
  TAXONOMY_TREE = '/taxonomies/taxonomy-tree',
  // book
  BOOK = '/books/book',
  // link
  LINK_FOOTER = '/links/footer',
  LINK_FRIEND = '/links/friend',
  LINK_FAVORITE = '/links/favorites',
  // comment
  COMMENTS = '/comments',
  COMMENT = '/comments/comment',
  // vote
  VOTE = '/votes/vote',
  // auth
  AUTH_LOGIN = '/auth/login',
  AUTH_LOGOUT = '/auth/logout',
  AUTH_SIGNUP = '/auth/signup',
  AUTH_SEND_CODE = '/auth/send-code',
  AUTH_VERIFY = '/auth/verify',
  AUTH_THIRD_LOGIN = '/auth/third-login',
  AUTH_RESET_PASSWORD = '/auth/reset-password',
  // user
  USER_LOGIN_INFO = '/users/login-user',
  USER_SIGNUP_INFO = '/users/signup-user',
  // favorite
  FAVORITE = '/favorites/favorite',
  // log
  ACCESS_LOG = '/access-logs/access',
  ACCESS_LOG_LEAVE = '/access-logs/leave',
  ACCESS_LOG_CHECK_LIMIT = '/access-logs/check-limit',
  ACCESS_LOG_PLUGIN = '/access-logs/plugin',
  ACTION_LOG = '/action-logs/action',
  // wallpaper
  WALLPAPERS = '/wallpapers',
  WALLPAPER_HOT = '/wallpapers/hot',
  WALLPAPER_RANDOM = '/wallpapers/random',
  // conversation
  CONVERSATION = '/conversations/conversation',
  CONVERSATION_ASK_AI = '/conversations/ask-ai',
  // message
  BOT_MESSAGES = '/messages',
  BOT_MESSAGE_VOTE = '/messages/vote',
  BOT_MESSAGE_USAGE = '/messages/usage',
  // chat
  CHAT_STREAM = '/chat/stream',
  CHAT_MESSAGE = '/chat/message',
  CHAT_POST_ASK = '/chat/post-ask',
  // app
  TENANT_APP = '/apps/app'
}
