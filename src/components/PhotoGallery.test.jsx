import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent, cleanup } from "@testing-library/react";
import PhotoGallery from "./PhotoGallery";

describe("PhotoGallery component", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("renders loading state and then displays fetched product cards", async () => {
    const mockPayload = {
      products: [
        {
          id: 1,
          title: "Minimalist Watch",
          thumbnail: "https://cdn.dummyjson.com/product-images/watch/thumbnail.webp",
          images: ['["https://example.com/watch.jpg"]'],
        },
        {
          id: 2,
          title: "Canvas Tote Bag",
          images: ["https://example.com/bag.jpg"],
        },
      ],
    };

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify(mockPayload),
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<PhotoGallery />);

    expect(screen.getByText("Fetching products...")).toBeTruthy();

    await waitFor(() => {
      expect(screen.getByText("Minimalist Watch")).toBeTruthy();
      expect(screen.getByText("Canvas Tote Bag")).toBeTruthy();
    });

    const watchImg = screen.getByAltText("Minimalist Watch");
    const bagImg = screen.getByAltText("Canvas Tote Bag");
    expect(watchImg.getAttribute("src")).toBe(
      "https://cdn.dummyjson.com/product-images/watch/thumbnail.webp"
    );
    expect(bagImg.getAttribute("src")).toBe("https://example.com/bag.jpg");
  });

  it("switches endpoints and renders error state with retry support", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () =>
          JSON.stringify([
            { id: 10, title: "Initial Product", images: ["https://example.com/p.jpg"] },
          ]),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: "Not Found",
        text: async () => "",
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () =>
          JSON.stringify([
            { id: 11, name: "Recovered Item", image: "https://example.com/r.jpg" },
          ]),
      });
    vi.stubGlobal("fetch", fetchMock);

    render(<PhotoGallery />);

    await waitFor(() => {
      expect(screen.getByText("Initial Product")).toBeTruthy();
    });

    fireEvent.click(screen.getByRole("button", { name: "Test Error" }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeTruthy();
      expect(screen.getByText(/HTTP 404/)).toBeTruthy();
    });

    fireEvent.click(screen.getByRole("button", { name: "Try Again" }));

    await waitFor(() => {
      expect(screen.getByText("Recovered Item")).toBeTruthy();
    });
  });
});
