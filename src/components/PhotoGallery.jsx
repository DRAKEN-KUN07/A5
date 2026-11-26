import { useState, useEffect } from "react";
import { useFetch } from "../hooks/useFetch";
import "./PhotoGallery.css";

const API_ENDPOINTS = [
  {
    id: "products",
    label: "Products",
    url: "https://dummyjson.com/products?limit=24",
  },
  {
    id: "photos",
    label: "Photos",
    url: "https://jsonplaceholder.typicode.com/photos?_limit=24",
  },
  {
    id: "fakestore",
    label: "FakeStore",
    url: "https://fakestoreapi.com/products",
  },
  {
    id: "platzi",
    label: "Platzi API",
    url: "https://api.escuelajs.co/api/v1/products",
  },
  {
    id: "error",
    label: "Test Error",
    url: "https://dummyjson.com/http/404",
  },
];

const SKELETON_COUNT = 8;

const FALLBACK_IMAGE =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600">
      <rect width="600" height="600" fill="#18181b"/>
      <rect x="36" y="36" width="528" height="528" rx="12" fill="#27272a" stroke="#3f3f46" stroke-width="2"/>
      <path d="M175 390 L265 290 L335 360 L385 310 L445 390 Z" fill="#52525b"/>
      <circle cx="240" cy="230" r="32" fill="#52525b"/>
      <text x="300" y="458" font-family="system-ui, sans-serif" font-size="22" fill="#a1a1aa" text-anchor="middle">Image Unavailable</text>
    </svg>`
  );

function cleanImageUrl(candidate) {
  if (typeof candidate !== "string") return "";
  let cleaned = candidate.trim();
  if (!cleaned) return "";

  if (cleaned.startsWith("[") || cleaned.startsWith('"')) {
    try {
      const parsed = JSON.parse(cleaned);
      if (Array.isArray(parsed) && typeof parsed[0] === "string") {
        cleaned = parsed[0].trim();
      } else if (typeof parsed === "string") {
        cleaned = parsed.trim();
      }
    } catch {
      cleaned = cleaned.replace(/^\[+|\]+$/g, "").replace(/^"+|"+$/g, "").trim();
    }
  }

  return /^https?:\/\/.+/i.test(cleaned) ? cleaned : "";
}

function getItemImage(item) {
  if (!item || typeof item !== "object") return FALLBACK_IMAGE;

  const candidates = [
    item.thumbnail,
    ...(Array.isArray(item.images) ? item.images : [item.images]),
    item.image,
    item.avatar,
    item.thumbnailUrl,
    item.url,
  ];

  for (const candidate of candidates) {
    const validUrl = cleanImageUrl(candidate);
    if (validUrl) return validUrl;
  }

  return FALLBACK_IMAGE;
}

function getItemTitle(item) {
  if (!item || typeof item !== "object") return "Untitled";
  return item.title || item.name || "Untitled";
}

function normalizeItems(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.products)) return data.products;
  if (Array.isArray(data?.items)) return data.items;
  if (data && typeof data === "object") return [data];
  return [];
}

function PhotoCard({ title, imageUrl }) {
  const [imgSrc, setImgSrc] = useState(imageUrl);

  useEffect(() => {
    setImgSrc(imageUrl);
  }, [imageUrl]);

  return (
    <article className="photo-card">
      <div className="photo-card__media">
        <img
          src={imgSrc}
          alt={title}
          loading="lazy"
          onError={() => {
            if (imgSrc !== FALLBACK_IMAGE) {
              setImgSrc(FALLBACK_IMAGE);
            }
          }}
        />
      </div>
      <h2 className="photo-card__title" title={title}>
        {title}
      </h2>
    </article>
  );
}

export function PhotoGallery() {
  const [selectedEndpoint, setSelectedEndpoint] = useState(API_ENDPOINTS[0]);
  const { data, loading, error, refetch } = useFetch(selectedEndpoint.url);

  const items = normalizeItems(data);

  return (
    <main className="gallery-page">
      <header className="gallery-header">
        <h1 className="gallery-title">Photos</h1>

        <div className="gallery-controls" role="toolbar" aria-label="API endpoints">
          <div className="endpoint-group">
            {API_ENDPOINTS.map((endpoint) => {
              const isActive = endpoint.id === selectedEndpoint.id;
              return (
                <button
                  key={endpoint.id}
                  type="button"
                  className={`endpoint-btn ${isActive ? "is-active" : ""}`}
                  aria-pressed={isActive}
                  onClick={() => setSelectedEndpoint(endpoint)}
                >
                  {endpoint.label}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            className="refresh-btn"
            onClick={refetch}
            disabled={loading}
          >
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>
      </header>

      {loading && (
        <section aria-live="polite" aria-busy="true">
          <div className="loading-banner">
            <span className="spinner" aria-hidden="true" />
            <span>Fetching {selectedEndpoint.label.toLowerCase()}...</span>
          </div>

          <div className="photo-grid">
            {Array.from({ length: SKELETON_COUNT }, (_, idx) => (
              <div key={idx} className="photo-card photo-card--skeleton" aria-hidden="true">
                <div className="photo-card__media skeleton-box" />
                <div className="skeleton-line" />
              </div>
            ))}
          </div>
        </section>
      )}

      {!loading && error && (
        <section className="error-state" role="alert">
          <h2>Unable to load photos</h2>
          <p className="error-state__message">{error}</p>
          <p className="error-state__url">Endpoint: {selectedEndpoint.url}</p>
          <button type="button" className="retry-btn" onClick={refetch}>
            Try Again
          </button>
        </section>
      )}

      {!loading && !error && items.length === 0 && (
        <section className="empty-state">
          <p>No items returned from this endpoint.</p>
        </section>
      )}

      {!loading && !error && items.length > 0 && (
        <section className="photo-grid" aria-label="Fetched photos grid">
          {items.map((item, index) => (
            <PhotoCard
              key={item?.id ?? `${selectedEndpoint.id}-${index}`}
              title={getItemTitle(item)}
              imageUrl={getItemImage(item)}
            />
          ))}
        </section>
      )}
    </main>
  );
}

export default PhotoGallery;
