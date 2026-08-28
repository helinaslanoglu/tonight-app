/**
 * Thin wrapper around AsyncStorage.
 * Provides typed get/set/remove helpers for use in later milestones.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Persist a JSON-serialisable value under `key`.
 */
export async function setItem<T>(key: string, value: T): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

/**
 * Retrieve and deserialise a value stored under `key`.
 * Returns `null` when the key is not found.
 */
export async function getItem<T>(key: string): Promise<T | null> {
  const raw = await AsyncStorage.getItem(key);
  if (raw === null) return null;
  return JSON.parse(raw) as T;
}

/**
 * Remove the value stored under `key`.
 */
export async function removeItem(key: string): Promise<void> {
  await AsyncStorage.removeItem(key);
}

/**
 * Remove all items whose keys start with `prefix`.
 * Useful for clearing a namespace of persisted data.
 */
export async function clearItemsByPrefix(prefix: string): Promise<void> {
  const allKeys = await AsyncStorage.getAllKeys();
  const matching = allKeys.filter((k) => k.startsWith(prefix));
  for (const key of matching) {
    await AsyncStorage.removeItem(key);
  }
}

/** Storage key namespace. Centralise all keys here to avoid typos. */
export const STORAGE_KEYS = {
  /** Persisted settings (dark mode, etc.) — for future use */
  USER_SETTINGS: 'tonight:user_settings',
} as const;
