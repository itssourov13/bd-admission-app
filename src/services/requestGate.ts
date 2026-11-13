/**
 * Latest-request-wins gate for async loads (e.g. Browse search/filter/paging).
 * `begin()` starts a new generation and invalidates every earlier request; callers check `isCurrent(id)`
 * before writing state on success AND on failure, so a stale request can neither overwrite nor error the screen.
 */
export interface RequestGate {
  begin(): number;
  current(): number;
  isCurrent(id: number): boolean;
}

export function createRequestGate(): RequestGate {
  let generation = 0;
  return {
    begin: () => ++generation,
    current: () => generation,
    isCurrent: (id) => id === generation
  };
}
