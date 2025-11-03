import type { Draft } from '@reduxjs/toolkit';

/**
 * Deduplicates an array of items by their `id` field.
 *
 * - Uses a `Map` to ensure each unique `id` appears only once in the result.
 * - If multiple items share the same `id`, the **last one** in the array is kept.
 * - Supports both plain objects and Immer `Draft<T>` objects.
 *
 * @template T - The type of items, each with a string `id`.
 * @param items - An array of items (possibly including Immer drafts) to deduplicate.
 * @returns A new array containing only unique items by `id`.
 */
export const dedupeById = <T extends { id: string }>(
  items: (T | Draft<T>)[]
): (T | Draft<T>)[] => {
  const map = new Map<string, T | Draft<T>>();
  for (const item of items) {
    map.set(item.id, item); // last one wins
  }
  return Array.from(map.values());
};

/**
 * Deduplicates array by `value` field while preserving **first occurrence order**.
 * Later duplicates are ignored.
 *
 * Use when:
 * - The array is already sorted in the desired order (e.g., from backend API).
 * - You want to keep the first-encountered item for each `value`.
 */
export const dedupeByValuePreserveOrder = <T extends { value: string }>(
  items: T[]
): T[] => {
  const seen = new Set<string>();
  const result: T[] = [];

  for (const item of items) {
    if (!seen.has(item.value)) {
      seen.add(item.value);
      result.push(item);
    }
  }

  return result;
};

/**
 * Deduplicates array by `value` field using an optional resolver to determine which duplicate to keep.
 *
 * If no resolver is provided, keep the **last occurrence** of each item.
 *
 * Use when:
 * - You need to control which duplicate wins (e.g., based on flags or timestamps).
 * - Order is **not** important, or you plan to sort after.
 */
export const dedupeByValue = <T extends { value: string }>(
  items: T[],
  resolver?: (a: T, b: T) => T
): T[] => {
  const map = new Map<string, T>();
  for (const item of items) {
    const existing = map.get(item.value);
    map.set(item.value, existing && resolver ? resolver(existing, item) : item);
  }
  return Array.from(map.values());
};

/**
 * Deduplicates supply rows by batchId (or supplierId fallback).
 * Keeps the **last occurrence** of each unique key.
 *
 * @example
 * const uniqueSupply = dedupeByBatchKey(supplyRows);
 */
export const dedupeByBatchKey = <
  T extends { batchId?: string; supplierId?: string },
>(
  items: T[]
): T[] => {
  const map = new Map<string, T>();

  for (const item of items) {
    const key = item.batchId ?? item.supplierId;
    if (!key) continue;
    map.set(key, item); // last one wins
  }

  return Array.from(map.values());
};
