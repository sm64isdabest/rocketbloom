import { useCallback, useEffect, useRef, useState } from "react";
import { loadProgress, resetSavedProgress, updateSavedProgress } from "../utils/storage.js";

export function usePersistentProgress() {
  const [progress, setProgress] = useState(null);
  const [warning, setWarning] = useState(null);
  const [fatal, setFatal] = useState(null);
  const currentProgress = useRef(null);
  const hasUnsavedProgress = useRef(false);

  useEffect(() => {
    try {
      const result = loadProgress();
      currentProgress.current = result.progress;
      setProgress(result.progress);
      setWarning(result.error);
    } catch (error) {
      setFatal(error.message || "Falha ao iniciar o progresso.");
    }
  }, []);

  const persist = useCallback((update) => {
    const current = currentProgress.current;
    if (!current) return;
    const result = updateSavedProgress(current, update, { preferMemory: hasUnsavedProgress.current });
    if (result.stale) {
      window.location.reload();
      return result;
    }
    if (result.progress === current) return result;
    currentProgress.current = result.progress;
    hasUnsavedProgress.current = !result.ok;
    setProgress(result.progress);
    if (!result.ok) {
      setWarning(result.error);
    }
    return result;
  }, []);

  const patchSettings = useCallback(
    (partial) => {
      persist((current) => ({
        ...current,
        settings: { ...current.settings, ...partial },
      }));
    },
    [persist],
  );

  const resetProgress = useCallback(() => {
    const result = resetSavedProgress(currentProgress.current);
    if (result.ok) {
      currentProgress.current = result.progress;
      hasUnsavedProgress.current = false;
      setProgress(result.progress);
      setWarning(null);
    }
    return result;
  }, []);

  return { progress, warning, fatal, persist, patchSettings, resetProgress };
}
