import { useCallback, useMemo, useState } from 'react';
import { createPixabayClient } from './api.js';
import { useImageSearch } from './useImageSearch.js';
import SearchForm from './components/SearchForm.jsx';
import ImageGallery from './components/ImageGallery.jsx';
import Lightbox from './components/Lightbox.jsx';

export default function App({ apiKey = import.meta.env.VITE_PIXABAY_API_KEY, fetcher }) {
  const client = useMemo(() => createPixabayClient({ apiKey, fetcher }), [apiKey, fetcher]);
  const { images, totalHits, status, error, hasMore, query, search, loadMore } = useImageSearch(client);
  const [selected, setSelected] = useState(null);
  const close = useCallback(() => setSelected(null), []);

  return (
    <div className="container">
      <header>
        <h1>Pixabay 画像検索</h1>
        <p className="attribution">
          画像提供: <a href="https://pixabay.com/" target="_blank" rel="noreferrer">Pixabay</a>
        </p>
      </header>

      {!apiKey ? (
        <p role="alert" className="error">
          API キーが設定されていません。.env.example を参考に .env.local を作成してください。
        </p>
      ) : (
        <SearchForm onSearch={search} loading={status === 'loading'} />
      )}

      {status === 'error' && <p role="alert" className="error">{error}</p>}
      {status === 'success' && (
        <p className="summary" aria-live="polite">
          {totalHits === 0
            ? `「${query}」に一致する画像は見つかりませんでした。`
            : `「${query}」の検索結果: ${totalHits.toLocaleString('ja-JP')} 件中 ${images.length} 件を表示`}
        </p>
      )}

      <ImageGallery images={images} onSelect={setSelected} />

      {status === 'loading' && <p className="loading" aria-live="polite">読み込み中…</p>}
      {hasMore && <button type="button" className="more" onClick={loadMore}>もっと見る</button>}

      {selected && <Lightbox image={selected} onClose={close} />}
    </div>
  );
}
