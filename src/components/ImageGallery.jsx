export default function ImageGallery({ images, onSelect }) {
  return (
    <ul className="gallery" aria-label="検索結果">
      {images.map((image) => (
        <li key={image.id}>
          <button type="button" className="thumb" onClick={() => onSelect(image)}>
            <img src={image.webformatURL} alt={image.tags} loading="lazy" />
          </button>
          <span className="credit">by {image.user}</span>
        </li>
      ))}
    </ul>
  );
}
