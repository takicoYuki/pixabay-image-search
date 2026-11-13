// Pixabay API の呼び出し。画面（React）から切り離してあるので単体でテストできる。
// API の仕様: https://pixabay.com/api/docs/

export const API_ENDPOINT = 'https://pixabay.com/api/';
export const PER_PAGE = 20;
// Pixabay の利用条件で、同じ検索結果は 24 時間キャッシュするよう求められている
export const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

export const IMAGE_TYPES = [
  { value: 'all', label: 'すべて' },
  { value: 'photo', label: '写真' },
  { value: 'illustration', label: 'イラスト' },
  { value: 'vector', label: 'ベクター' },
];

export class PixabayError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'PixabayError';
    this.status = status;
  }
}

export function buildSearchUrl({ apiKey, query, imageType = 'all', page = 1, perPage = PER_PAGE }) {
  const url = new URL(API_ENDPOINT);
  url.search = new URLSearchParams({
    key: apiKey,
    q: query.trim(),
    image_type: imageType,
    page: String(page),
    per_page: String(perPage),
    safesearch: 'true',
    lang: 'ja',
  }).toString();
  return url.toString();
}

function errorMessage(status) {
  if (status === 400) return 'API キーが正しくないか、検索条件が不正です。';
  if (status === 429) return 'リクエストが多すぎます。しばらく待ってからもう一度お試しください。';
  return `画像を取得できませんでした（HTTP ${status}）。`;
}

/** API のレスポンスから、画面で使う項目だけを取り出す */
function toImage(hit) {
  return {
    id: hit.id,
    tags: hit.tags,
    previewURL: hit.previewURL,
    webformatURL: hit.webformatURL,
    largeImageURL: hit.largeImageURL,
    pageURL: hit.pageURL,
    user: hit.user,
    width: hit.imageWidth,
    height: hit.imageHeight,
  };
}

/**
 * 検索用のクライアントを作る。
 * fetcher と now を差し替えられるようにして、テストで通信や時刻を偽装できるようにしている。
 */
export function createPixabayClient({ apiKey, fetcher = (...args) => fetch(...args), now = () => Date.now() }) {
  const cache = new Map();

  async function search({ query, imageType = 'all', page = 1, signal } = {}) {
    if (!apiKey) throw new PixabayError('API キーが設定されていません。', 0);
    const url = buildSearchUrl({ apiKey, query, imageType, page });

    const cached = cache.get(url);
    if (cached && now() - cached.at < CACHE_TTL_MS) return cached.result;

    let res;
    try {
      res = await fetcher(url, { signal });
    } catch (e) {
      if (e.name === 'AbortError') throw e;
      throw new PixabayError('通信に失敗しました。ネットワークを確認してください。', 0);
    }
    if (!res.ok) throw new PixabayError(errorMessage(res.status), res.status);

    const data = await res.json();
    const result = { totalHits: data.totalHits, images: data.hits.map(toImage) };
    cache.set(url, { at: now(), result });
    return result;
  }

  return { search };
}
