import { useState, useEffect, useCallback, useRef } from "react";

/**
 * Custom hook that fetches JSON data from a given API endpoint.
 * Manages loading, data, and error states while safely canceling stale requests.
 *
 * @param {string} url - The API URL to fetch data from.
 * @param {RequestInit} [options] - Optional fetch request configuration.
 * @returns {{ data: any, loading: boolean, error: string | null, refetch: () => Promise<void> }}
 */
export function useFetch(url, options) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(Boolean(url && typeof url === "string" && url.trim()));
  const [error, setError] = useState(null);

  const abortControllerRef = useRef(null);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const fetchData = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const isEmptyUrl =
      url === null ||
      url === undefined ||
      (typeof url === "string" && url.trim() === "");

    if (isEmptyUrl) {
      abortControllerRef.current = null;
      setData(null);
      setError(null);
      setLoading(false);
      return;
    }

    if (typeof url !== "string") {
      abortControllerRef.current = null;
      setData(null);
      setError("A valid URL string is required.");
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(url, {
        ...optionsRef.current,
        signal: controller.signal,
      });

      if (!response.ok) {
        const statusDetails = response.statusText ? `: ${response.statusText}` : "";
        throw new Error(`Failed to fetch data (HTTP ${response.status}${statusDetails})`);
      }

      let parsedData;
      if (typeof response.text === "function") {
        const rawText = await response.text();
        if (!rawText.trim()) {
          throw new Error("Received an empty response from the server.");
        }

        try {
          parsedData = JSON.parse(rawText);
        } catch {
          throw new Error("Malformed JSON data received from the API.");
        }
      } else if (typeof response.json === "function") {
        try {
          parsedData = await response.json();
        } catch {
          throw new Error("Malformed JSON data received from the API.");
        }
      } else {
        throw new Error("Unsupported response format received from the server.");
      }

      if (!controller.signal.aborted) {
        setData(parsedData);
      }
    } catch (err) {
      if (err?.name === "AbortError" || controller.signal.aborted) {
        return;
      }

      setError(err?.message || "An unexpected network error occurred.");
      setData(null);
    } finally {
      if (abortControllerRef.current === controller && !controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, [url]);

  useEffect(() => {
    fetchData();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

export default useFetch;
