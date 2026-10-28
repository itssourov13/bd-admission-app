export type SelectionWriter = (questionId: string, keys: string[], at: number) => Promise<boolean>;

export interface SelectionQueueOptions {
  write: SelectionWriter;
  /** Selections already stored for the session (the rollback target before the first successful write). */
  initial?: Readonly<Record<string, string[]>>;
  /** Called when the latest write for a question fails; persisted is the value known to be in SQLite. */
  onRejected: (questionId: string, persisted: string[]) => void;
  now?: () => number;
}

export interface SelectionQueue {
  /** Records the newest choice (empty keys = cleared) and serializes its write after earlier choices. */
  enqueue(questionId: string, keys: string[]): void;
  /** Resolves true only when queued writes have settled successfully; false on a failed write or timeout. */
  drain(timeoutMs: number): Promise<boolean>;
}

/**
 * Serializes answer changes in tap order. Fast taps for one question (A, B, clear) cannot finish out of order.
 * Submission/timeout drains this queue before finalization. A failed latest write rolls the UI back and blocks
 * finalization until that question is successfully written again.
 */
export function createSelectionQueue(opts: SelectionQueueOptions): SelectionQueue {
  const now = opts.now ?? Date.now;
  const persisted = new Map<string, string[]>(Object.entries(opts.initial ?? {}).map(([id, keys]) => [id, [...keys]]));
  const newest = new Map<string, number>();
  const failed = new Set<string>();
  let seq = 0;
  let chain: Promise<void> = Promise.resolve();

  return {
    enqueue(questionId, keys) {
      const mine = ++seq;
      newest.set(questionId, mine);
      failed.delete(questionId);
      const copy = [...keys];
      const at = now();
      chain = chain.then(async () => {
        let ok = false;
        try { ok = await opts.write(questionId, copy, at); } catch { ok = false; }
        if (ok) {
          persisted.set(questionId, copy);
          return;
        }
        if (newest.get(questionId) !== mine) return;
        failed.add(questionId);
        try { opts.onRejected(questionId, [...(persisted.get(questionId) ?? [])]); } catch { /* preserve queue integrity */ }
      });
    },
    drain(timeoutMs) {
      let timer: ReturnType<typeof setTimeout> | undefined;
      const timeout = new Promise<boolean>((resolve) => {
        timer = setTimeout(() => resolve(false), timeoutMs);
      });
      return Promise.race([chain.then(() => failed.size === 0), timeout]).finally(() => clearTimeout(timer));
    }
  };
}
