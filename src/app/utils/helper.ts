import murmurhash from 'murmurhash';

/**
 * 生成随机ID字符串：10位36进制时间戳+6位36进制随机数
 * @return {string} ID
 */
export function generateId(): string {
  const idLen = 16;
  const randomLen = 6;
  const radix = 36;
  const id = Date.now().toString(radix);
  let randomStr = '';

  for (let idx = 0; idx < randomLen; idx += 1) {
    randomStr += Math.floor(Math.random() * radix).toString(radix);
  }
  let prefix = '';
  for (let idx = 0; idx < idLen - randomLen - id.length; idx += 1) {
    prefix += '0';
  }

  return prefix + id + randomStr;
}

export function generateUid(ua: string) {
  let randomStr = '';
  for (let i = 0; i < 3; i += 1) {
    randomStr += ((Math.random() * 36) | 0).toString(36);
  }

  return `FA1.${murmurhash(ua, 20160124)}.${(Date.now() / 1000) | 0}.${randomStr}`;
}

/**
 * 格式化字符串
 * e.g. input: format('Hello $0, $1.', 'World', 'Fuyun')
 *      output: Hello World, Fuyun.
 *   or input: format('Hello $0, $1.', ['World', 'Fuyun'])
 *      output the same: Hello World, Fuyun.
 * Notice:
 *     When replacement is not supplied or is undefined,
 *     it will be replaced with empty string('')
 * @param {string} str source string
 * @param {(string | number)[]} params replacements
 * @return {string} output string
 */
export function format(str: string, ...params: (string | number)[]): string {
  if (Array.isArray(params[0])) {
    params = params[0];
  }
  return str.replace(/\$(\d+)/gi, (matched, index) => (params[index] && params[index].toString()) || '');
}

export async function simpleRequest(payload: {
  url: string;
  param?: Record<string, any>;
  appId: string;
  apiBase: string;
}) {
  const { url, param, appId, apiBase } = payload;
  const reqParam = Object.entries(param || {})
    .map((item) => `${item[0]}=${item[1]}`)
    .join('&');
  const urlParam = `?appId=${appId}${reqParam ? '&' + reqParam : ''}`;
  const response = await fetch(apiBase + url + urlParam, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error('Sorry, there is an error on server.');
  }
  return response.json();
}
