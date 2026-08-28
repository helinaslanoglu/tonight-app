/**
 * Thin wrapper around AsyncStorage.
 * Provides typed get/set/remove helpers for use in later milestones.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Persist a JSON-serialisable value under `key`.
 */
export async function setItem<T>(key: string, value: T): Promise<boolean> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    if (__DEV__) {
      console.warn(`[storage] Failed to set item for key "${key}":`, error);
    }
    return false;
  }
}

/**
 * Retrieve and deserialise a value stored under `key`.
 * Returns `null` when the key is not found or if deserialisation fails.
 */
export async function getItem<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw === null) return null;
    return JSON.parse(raw) as T;
  } catch (error) {
    if (__DEV__) {
      console.warn(`[storage] Failed to get item for key "${key}":`, error);
    }
    return null;
  }
}

/**
 * Remove the value stored under `key`.
 */
export async function removeItem(key: string): Promise<boolean> {
  try {
    await AsyncStorage.removeItem(key);
    return true;
  } catch (error) {
    if (__DEV__) {
      console.warn(`[storage] Failed to remove item for key "${key}":`, error);
    }
    return false;
  }
}

/**
 * Remove all items whose keys start with `prefix`.
 * Useful for clearing a namespace of persisted data.
 */
export async function clearItemsByPrefix(prefix: string): Promise<boolean> {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const matching = allKeys.filter((k) => k.startsWith(prefix));
    for (const key of matching) {
      await AsyncStorage.removeItem(key);
    }
    return true;
  } catch (error) {
    if (__DEV__) {
      console.warn(`[storage] Failed to clear items by prefix "${prefix}":`, error);
    }
    return false;
  }
}

/** Storage key namespace. Centralise all keys here to avoid typos. */
export const STORAGE_KEYS = {
  /** Persisted settings (dark mode, etc.) — for future use */
  USER_SETTINGS: 'tonight:user_settings',
} as const;
