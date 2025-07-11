import { useState } from "react";

export function usePagination<T>(items: T[], initialCount = 10, step = 10) {
  const [visibleCount, setVisibleCount] = useState(initialCount);

  const visibleItems = items.slice(0, visibleCount);
  const hasMore = visibleCount < items.length;

  function showMore() {
    setVisibleCount((prev) => Math.min(prev + step, items.length));
  }

  function reset() {
    setVisibleCount(initialCount);
  }

  return { visibleItems, hasMore, showMore, reset };
} 