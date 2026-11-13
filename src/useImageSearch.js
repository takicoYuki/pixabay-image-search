import { useCallback, useEffect, useRef, useState } from 'react';

const INITIAL = {
  query: '',
  imageType: 'all',
  images: [],
  totalHits: 0,
  page: 0,
  status: 'idle', // idle / loading / success / error
  error: '',
};

/**
 * 検索と「もっと見る」の状態をまとめて管理する。
 * 新しい検索を始めたら前のリクエストは中断し、古い結果で画面が上書きされないようにする。
 */
export function useImageSearch(client) {
  const [state, setState] = useState(INITIAL);
  const controllerRef = useRef(null);

  useEffect(() => () => controllerRef.current?.abort(), []);

  const run = useCallback(async ({ query, imageType, page, append }) => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    setState((s) => ({
      ...(append ? s : { ...INITIAL, images: [] }),
      query,
      imageType,
      status: 'loading',
      error: '',
    }));
    try {
      const { images, totalHits } = await client.search({ query, imageType, page, signal: controller.signal });
      setState((s) => {
        // 同じ画像が 2 ページにまたがって返ってくることがあるので ID で重複を除く
        const known = new Set(s.images.map((i) => i.id));
        const merged = append ? [...s.images, ...images.filter((i) => !known.has(i.id))] : images;
        return { ...s, images: merged, totalHits, page, status: 'success' };
      });
    } catch (e) {
      if (e.name === 'AbortError') return;
      setState((s) => ({ ...s, status: 'error', error: e.message }));
    }
  }, [client]);

  const search = useCallback((query, imageType = 'all') => {
    if (!query.trim()) return;
    run({ query: query.trim(), imageType, page: 1, append: false });
  }, [run]);

  const loadMore = useCallback(() => {
    run({ query: state.query, imageType: state.imageType, page: state.page + 1, append: true });
  }, [run, state.query, state.imageType, state.page]);

  const hasMore = state.status === 'success' && state.images.length < state.totalHits;

  return { ...state, hasMore, search, loadMore };
}
