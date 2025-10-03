/**
 * Safe Web Storage helpers that gracefully fall back when storage
 * is unavailable (e.g., Safari private mode, restricted iframes).
 */

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

function createMemoryStorage(): StorageLike {
  const memory = new Map<string, string>();
  return {
    getItem(key: string): string | null {
      return memory.has(key) ? memory.get(key)! : null;
    },
    setItem(key: string, value: string): void {
      memory.set(key, String(value));
    },
    removeItem(key: string): void {
      memory.delete(key);
    },
  };
}

function isStorageUsable(storage: Storage): boolean {
  try {
    const testKey = '__e1_storage_test__';
    storage.setItem(testKey, '1');
    storage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

export function getLocalStorageSafe(): StorageLike {
  if (typeof window !== 'undefined') {
    try {
      if (window.localStorage && isStorageUsable(window.localStorage)) {
        return window.localStorage;
      }
    } catch {
      // fall through to memory storage
    }
  }
  return createMemoryStorage();
}

export function getSessionStorageSafe(): StorageLike {
  if (typeof window !== 'undefined') {
    try {
      if (window.sessionStorage && isStorageUsable(window.sessionStorage)) {
        return window.sessionStorage;
      }
    } catch {
      // fall through to memory storage
    }
  }
  return createMemoryStorage();
}
