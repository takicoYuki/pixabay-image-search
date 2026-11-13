import { vi } from 'vitest';

export function makeHit(id) {
  return {
    id,
    tags: `猫, 動物, ${id}`,
    previewURL: `https://cdn.example/preview/${id}.jpg`,
    webformatURL: `https://cdn.example/web/${id}.jpg`,
    largeImageURL: `https://cdn.example/large/${id}.jpg`,
    pageURL: `https://pixabay.com/photos/${id}/`,
    user: `user${id}`,
    imageWidth: 1920,
    imageHeight: 1280,
  };
}

export function jsonResponse(data, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: async () => data };
}

/** totalHits 件の検索結果を、ページ単位（20 件ずつ）で返す偽の fetch */
export function fakeFetcher(totalHits) {
  return vi.fn(async (url) => {
    const params = new URL(url).searchParams;
    const page = Number(params.get('page'));
    const perPage = Number(params.get('per_page'));
    const start = (page - 1) * perPage;
    const ids = Array.from({ length: Math.max(0, Math.min(perPage, totalHits - start)) }, (_, i) => start + i + 1);
    return jsonResponse({ total: totalHits, totalHits, hits: ids.map(makeHit) });
  });
}
