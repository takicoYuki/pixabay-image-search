import { describe, expect, it, vi } from 'vitest';
import { buildSearchUrl, CACHE_TTL_MS, createPixabayClient, PixabayError } from '../api.js';
import { fakeFetcher, jsonResponse } from './fixtures.js';

describe('buildSearchUrl', () => {
  it('検索条件をクエリ文字列にする（日本語はエンコードし、前後の空白は除く）', () => {
    const url = new URL(buildSearchUrl({ apiKey: 'KEY', query: '  富士山 ', imageType: 'photo', page: 2 }));

    expect(url.origin + url.pathname).toBe('https://pixabay.com/api/');
    expect(Object.fromEntries(url.searchParams)).toEqual({
      key: 'KEY', q: '富士山', image_type: 'photo', page: '2', per_page: '20', safesearch: 'true', lang: 'ja',
    });
  });
});

describe('createPixabayClient', () => {
  it('レスポンスから画面で使う項目だけを取り出す', async () => {
    const client = createPixabayClient({ apiKey: 'KEY', fetcher: fakeFetcher(3) });
    const { totalHits, images } = await client.search({ query: '猫' });

    expect(totalHits).toBe(3);
    expect(images[0]).toEqual({
      id: 1,
      tags: '猫, 動物, 1',
      previewURL: 'https://cdn.example/preview/1.jpg',
      webformatURL: 'https://cdn.example/web/1.jpg',
      largeImageURL: 'https://cdn.example/large/1.jpg',
      pageURL: 'https://pixabay.com/photos/1/',
      user: 'user1',
      width: 1920,
      height: 1280,
    });
  });

  it('同じ検索は 24 時間キャッシュし、期限が過ぎたら取り直す', async () => {
    const fetcher = fakeFetcher(3);
    let now = 0;
    const client = createPixabayClient({ apiKey: 'KEY', fetcher, now: () => now });

    await client.search({ query: '猫' });
    await client.search({ query: '猫' });
    expect(fetcher).toHaveBeenCalledTimes(1);

    await client.search({ query: '犬' });
    expect(fetcher).toHaveBeenCalledTimes(2);

    now = CACHE_TTL_MS;
    await client.search({ query: '猫' });
    expect(fetcher).toHaveBeenCalledTimes(3);
  });

  it.each([
    [400, 'API キーが正しくない'],
    [429, 'リクエストが多すぎます'],
    [500, 'HTTP 500'],
  ])('HTTP %i はわかりやすいメッセージの PixabayError にする', async (status, message) => {
    const client = createPixabayClient({ apiKey: 'KEY', fetcher: async () => jsonResponse({}, status) });
    const error = await client.search({ query: '猫' }).catch((e) => e);

    expect(error).toBeInstanceOf(PixabayError);
    expect(error.status).toBe(status);
    expect(error.message).toContain(message);
  });

  it('通信エラーは PixabayError に、中断（AbortError）はそのまま投げる', async () => {
    const offline = createPixabayClient({ apiKey: 'KEY', fetcher: async () => { throw new TypeError('Failed to fetch'); } });
    await expect(offline.search({ query: '猫' })).rejects.toThrow('通信に失敗しました');

    const abortError = Object.assign(new Error('aborted'), { name: 'AbortError' });
    const aborted = createPixabayClient({ apiKey: 'KEY', fetcher: async () => { throw abortError; } });
    await expect(aborted.search({ query: '猫' })).rejects.toBe(abortError);
  });

  it('API キーがなければ通信せずにエラーにする', async () => {
    const fetcher = vi.fn();
    await expect(createPixabayClient({ apiKey: '', fetcher }).search({ query: '猫' })).rejects.toThrow('API キー');
    expect(fetcher).not.toHaveBeenCalled();
  });
});
