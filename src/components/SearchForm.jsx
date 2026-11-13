import { useState } from 'react';
import { IMAGE_TYPES } from '../api.js';

export default function SearchForm({ onSearch, loading }) {
  const [query, setQuery] = useState('');
  const [imageType, setImageType] = useState('all');

  const handleSubmit = (e) => {
    e.preventDefault(); // Enter でページが再読み込みされないようにする
    onSearch(query, imageType);
  };

  return (
    <form className="search-form" role="search" onSubmit={handleSubmit}>
      <input
        type="search"
        aria-label="キーワード"
        placeholder="画像を探す（例: 富士山、猫）"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <select aria-label="画像の種類" value={imageType} onChange={(e) => setImageType(e.target.value)}>
        {IMAGE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
      </select>
      <button type="submit" disabled={loading || !query.trim()}>検索</button>
    </form>
  );
}
