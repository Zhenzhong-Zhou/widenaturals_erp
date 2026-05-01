import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'recent_warehouses';
const MAX_RECENT = 5;

export interface RecentWarehouse {
  id: string;
  name: string;
  code: string;
  visitedAt: number;
}

const readStorage = (): RecentWarehouse[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.slice(0, MAX_RECENT);
  } catch {
    return [];
  }
};

const writeStorage = (list: RecentWarehouse[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // localStorage unavailable or quota exceeded — silently ignore
  }
};

/**
 * Tracks recently visited warehouses in localStorage.
 *
 * - Capped at MAX_RECENT entries (most recent first)
 * - Deduplicates by warehouse id
 * - Persists across page reloads but not across devices/sessions
 *
 * Future improvement: sync with a server-side user preferences API
 * if cross-device persistence becomes a requirement.
 */
const useRecentWarehouses = () => {
  const [recent, setRecent] = useState<RecentWarehouse[]>([]);

  // Hydrate from storage on mount
  useEffect(() => {
    setRecent(readStorage());
  }, []);

  const addRecent = useCallback(
    (warehouse: Omit<RecentWarehouse, 'visitedAt'>) => {
      setRecent((prev) => {
        const filtered = prev.filter((w) => w.id !== warehouse.id);
        const next = [
          { ...warehouse, visitedAt: Date.now() },
          ...filtered,
        ].slice(0, MAX_RECENT);
        writeStorage(next);
        return next;
      });
    },
    []
  );

  const clearRecent = useCallback(() => {
    writeStorage([]);
    setRecent([]);
  }, []);

  return { recent, addRecent, clearRecent };
};

export default useRecentWarehouses;
