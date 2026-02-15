// SSR polyfills for wagmi (indexedDB used by idb-keyval in @wagmi/connectors)
if (typeof window === "undefined") {
  if (typeof globalThis.indexedDB === "undefined") {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const fakeIDB = require("fake-indexeddb");
      globalThis.indexedDB = fakeIDB.default ?? fakeIDB;
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const FDBKeyRange = require("fake-indexeddb/lib/FDBKeyRange");
      globalThis.IDBKeyRange = FDBKeyRange.default ?? FDBKeyRange;
    } catch {
      // silent
    }
  }
}

export {};
