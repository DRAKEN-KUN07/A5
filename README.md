# Task 5: React Custom Hooks (`useFetch`)

A React + Vite application implementing a reusable `useFetch` custom hook to simplify API data fetching, loading states, error handling, and request cancellation.

## Project Structure

```text
├── public/
│   └── _redirects
├── src/
│   ├── components/
│   │   ├── PhotoGallery.css
│   │   └── PhotoGallery.jsx
│   ├── hooks/
│   │   ├── useFetch.js
│   │   └── useFetch.test.jsx
│   ├── App.css
│   ├── App.jsx
│   ├── index.css
│   └── main.jsx
├── index.html
├── netlify.toml
├── package.json
└── vite.config.js
```

## Features & Implementation Decisions

- **Custom Hook (`src/hooks/useFetch.js`)**:
  - Uses `useState` for `data`, `loading`, and `error` states.
  - Uses `useCallback` to memoize `fetchData` per `url` and expose a stable `refetch` function.
  - Uses `useEffect` with `AbortController` cleanup so stale in-flight requests are aborted on URL changes or component unmount.
  - Handles HTTP status errors (`!response.ok`), network failures, empty payloads, and malformed JSON responses cleanly.
- **Gallery UI (`src/components/PhotoGallery.jsx`)**:
  - Consumes `useFetch` to display product photos and titles in a responsive 4-column dark-themed card grid.
  - Defaults to `https://dummyjson.com/products?limit=24` and supports switching across `Photos` (`https://jsonplaceholder.typicode.com/photos?_limit=24`), `FakeStore` (`https://fakestoreapi.com/products`), `Platzi API` (`https://api.escuelajs.co/api/v1/products` — noted as experiencing upstream TLS errors at the time of testing), and `Test Error` (`https://dummyjson.com/http/404`), plus a `Refresh` action to verify hook flexibility and error recovery.
  - Displays a loading spinner and skeleton placeholders while fetching, an error panel with a retry button when requests fail, and SVG fallback artwork if remote images fail to load.

## Getting Started

```bash
npm install
npm run dev
```

## Build & Test

```bash
npm test
npm run build
```
