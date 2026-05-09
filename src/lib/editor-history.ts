// UniverCert · Hook simples de undo/redo (S22b)
// Modelo: caller decide quando fazer COMMIT (ao final de drag, ao soltar resize, etc).
// setState muda valor "live" sem entrar no historico.
// commit(state) registra ponto historico atual.

import { useState, useCallback, useRef } from 'react';

const MAX_HISTORY = 50;

export type HistoryHook<T> = {
  state: T;
  setState: (next: T | ((prev: T) => T)) => void;
  commit: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  reset: (next: T) => void;
};

export function useLayoutHistory<T>(initial: T): HistoryHook<T> {
  const [state, setStateRaw] = useState<T>(initial);
  const historyRef = useRef<T[]>([initial]);
  const idxRef = useRef<number>(0);
  // versao pra forçar re-render quando undo/redo
  const [, setVersion] = useState(0);

  const setState = useCallback((next: T | ((prev: T) => T)) => {
    setStateRaw((cur) => {
      const v = typeof next === 'function' ? (next as any)(cur) : next;
      return v;
    });
  }, []);

  const commit = useCallback(() => {
    setStateRaw((cur) => {
      const hist = historyRef.current;
      const idx = idxRef.current;
      // Trim future + push
      const trimmed = hist.slice(0, idx + 1);
      // Avoid duplicate consecutive
      if (trimmed.length > 0 && JSON.stringify(trimmed[trimmed.length - 1]) === JSON.stringify(cur)) {
        return cur;
      }
      trimmed.push(cur);
      const overflow = trimmed.length - MAX_HISTORY;
      if (overflow > 0) trimmed.splice(0, overflow);
      historyRef.current = trimmed;
      idxRef.current = trimmed.length - 1;
      setVersion((v) => v + 1);
      return cur;
    });
  }, []);

  const undo = useCallback(() => {
    if (idxRef.current <= 0) return;
    idxRef.current -= 1;
    const prev = historyRef.current[idxRef.current];
    setStateRaw(prev);
    setVersion((v) => v + 1);
  }, []);

  const redo = useCallback(() => {
    if (idxRef.current >= historyRef.current.length - 1) return;
    idxRef.current += 1;
    const next = historyRef.current[idxRef.current];
    setStateRaw(next);
    setVersion((v) => v + 1);
  }, []);

  const reset = useCallback((next: T) => {
    historyRef.current = [next];
    idxRef.current = 0;
    setStateRaw(next);
    setVersion((v) => v + 1);
  }, []);

  return {
    state,
    setState,
    commit,
    undo,
    redo,
    canUndo: idxRef.current > 0,
    canRedo: idxRef.current < historyRef.current.length - 1,
    reset,
  };
}
