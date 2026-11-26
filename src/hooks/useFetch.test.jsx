import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useFetch } from "./useFetch";

describe("useFetch custom hook", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("fetches data successfully and updates loading, data, and error states", async () => {
    const mockProducts = [
      { id: 1, title: "Classic T-Shirt", images: ["https://example.com/1.jpg"] },
      { id: 2, title: "Denim Jacket", images: ["https://example.com/2.jpg"] },
    ];

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify(mockProducts),
    });
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() =>
      useFetch("https://api.escuelajs.co/api/v1/products")
    );

    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result.current.data).toEqual(mockProducts);
    expect(result.current.error).toBeNull();
  });

  it("handles HTTP errors cleanly", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: "Not Found",
      text: async () => "",
    });
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() =>
      useFetch("https://api.escuelajs.co/api/v1/missing")
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toBeNull();
    expect(result.current.error).toContain("HTTP 404");
  });

  it("handles network failures gracefully", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error("Network failure"));
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() =>
      useFetch("https://api.escuelajs.co/api/v1/products")
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toBeNull();
    expect(result.current.error).toBe("Network failure");
  });

  it("handles malformed JSON responses gracefully", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => "<html>not json</html>",
    });
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() =>
      useFetch("https://api.escuelajs.co/api/v1/malformed")
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toBeNull();
    expect(result.current.error).toBe("Malformed JSON data received from the API.");
  });

  it("refetches when URL changes and provides a stable refetch callback", async () => {
    const firstPayload = [{ id: 1, title: "Product 1" }];
    const secondPayload = [{ id: 2, name: "Category 1" }];

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => JSON.stringify(firstPayload),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => JSON.stringify(secondPayload),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => JSON.stringify(secondPayload),
      });
    vi.stubGlobal("fetch", fetchMock);

    const { result, rerender } = renderHook(({ url }) => useFetch(url), {
      initialProps: { url: "https://api.escuelajs.co/api/v1/products" },
    });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toEqual(firstPayload);

    rerender({ url: "https://api.escuelajs.co/api/v1/categories" });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toEqual(secondPayload);

    const refetchBefore = result.current.refetch;
    await act(async () => {
      await result.current.refetch();
    });

    expect(result.current.refetch).toBe(refetchBefore);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("skips fetching when URL is empty", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useFetch(""));

    expect(fetchMock).not.toHaveBeenCalled();
    expect(result.current.loading).toBe(false);
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
  });
});
