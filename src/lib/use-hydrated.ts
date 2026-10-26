import { useSyncExternalStore } from "react";

const noop = () => () => {};

/**
 * False during SSR and until hydration. With cacheComponents, a form posted
 * before hydration comes back as a blank page, so submit buttons wait for this.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(noop, () => true, () => false);
}
