import { useCallback, useEffect, useRef, useState } from "react";
import { useFocusEffect } from "expo-router";
import type { SqlDb } from "../db/types";
import { useDb } from "../db/provider";

export interface QueryState<T> {
  data: T | null;
  error: Error | null;
  /** True only while there is no data to show yet; refreshes on focus keep the previous data visible. */
  loading: boolean;
  reload: () => void;
}

/**
 * Loads data from SQLite when the screen is focused (so results, bookmarks and history are fresh after
 * returning from practice) and whenever `deps` change. Out-of-order responses are discarded.
 */
export function useQuery<T>(loader: (db: SqlDb) => Promise<T>, deps: readonly unknown[] = []): QueryState<T> {
  const db = useDb();
  const [state, setState] = useState<{ data: T | null; error: Error | null; loading: boolean }>({ data: null, error: null, loading: true });
  const loaderRef = useRef(loader);
  useEffect(() => { loaderRef.current = loader; });
  const sequence = useRef(0);
  const depsKey = JSON.stringify(deps);

  const run = useCallback(() => {
    const id = ++sequence.current;
    loaderRef.current(db).then(
      (data) => { if (sequence.current === id) setState({ data, error: null, loading: false }); },
      (error: unknown) => {
        if (sequence.current === id) setState((s) => ({ data: s.data, error: error instanceof Error ? error : new Error(String(error)), loading: false }));
      }
    );
    // depsKey intentionally re-creates the callback when the caller's dependencies change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db, depsKey]);

  useFocusEffect(useCallback(() => { run(); }, [run]));

  const reload = useCallback(() => {
    setState((s) => ({ ...s, loading: s.data === null, error: null }));
    run();
  }, [run]);

  return { ...state, reload };
}
