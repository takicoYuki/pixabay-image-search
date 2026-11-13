import { useEffect, useRef } from 'react';

/** 画像を大きく表示するダイアログ。Esc キー・背景のクリック・閉じるボタンで閉じる。 */
export default function Lightbox({ image, onClose }) {
  const closeRef = useRef(null);

  useEffect(() => {
    closeRef.current?.focus();
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div className="lightbox-backdrop" onClick={onClose}>
      <div
        className="lightbox"
        role="dialog"
        aria-modal="true"
        aria-label={image.tags}
        onClick={(e) => e.stopPropagation()}
      >
        <img src={image.largeImageURL} alt={image.tags} />
        <p>
          {image.width} × {image.height} ／ 投稿者: {image.user} ／{' '}
          <a href={image.pageURL} target="_blank" rel="noreferrer">Pixabay で見る</a>
        </p>
        <button type="button" ref={closeRef} onClick={onClose}>閉じる</button>
      </div>
    </div>
  );
}
