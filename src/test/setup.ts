import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

// Mock crypto.randomUUID for Node / consistent test IDs
Object.defineProperty(globalThis, "crypto", {
  value: { randomUUID: () => "test-uuid-" + Math.random().toString(36).slice(2) },
});

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }),
});
