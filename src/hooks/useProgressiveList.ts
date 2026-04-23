import { useEffect, useRef, useState } from "react";

export function useProgressiveList<T>(items: T[], initialCount = 10, increment = 10) {
  const [visibleCount, setVisibleCount] = useState(initialCount);
  const loaderRef = useRef<HTMLDivElement>(null);
  const prevLenRef = useRef(items.length);
  const prevFirstRef = useRef(items[0]);

  useEffect(() => {
    const prevLen = prevLenRef.current;
    const prevFirst = prevFirstRef.current;
    prevLenRef.current = items.length;
    prevFirstRef.current = items[0];

    if (items.length === 0) {
      setVisibleCount(initialCount);
      return;
    }

    // Full reload / refresh (not simple pagination append)
    if (items.length < prevLen || items[0] !== prevFirst) {
      setVisibleCount(initialCount);
    }
  }, [items, initialCount]);

  const hasMore = visibleCount < items.length;

  useEffect(() => {
    if (!hasMore || items.length === 0) return;

    const el = loaderRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisibleCount((prev) => Math.min(prev + increment, items.length));
        }
      },
      { threshold: 0.1 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, items.length, increment, visibleCount]);

  return {
    visibleItems: items.slice(0, visibleCount),
    loaderRef,
    hasMore,
  };
}
