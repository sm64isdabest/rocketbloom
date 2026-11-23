import { useCallback, useEffect, useState } from "react";
import { loadProgress, resetSavedProgress, saveProgress } from "../utils/storage.js";

export function usePersistentProgress() {
  const [progress, setProgress] = useState(null);
  const [warning, setWarning] = useState(null);
  const [fatal, setFatal] = useState(null);

  useEffect(() => {
    try {
      const result = loadProgress();
      setProgress(result.progress);
      setWarning(result.error);
    } catch (error) {
      setFatal(error.message || "Falha ao iniciar o progresso.");
    }
  }, []);

  const persist = useCallback((next) => {
    const result = saveProgress(next);
    if (result.stale) {
      window.location.reload();
      return;
    }
    setProgress(next);
    if (!result.ok) {
      setWarning(result.error);
    }
  }, []);

  const patchSettings = useCallback(
    (partial) => {
      if (!progress) {
        return;
      }
      persist({
        ...progress,
        settings: { ...progress.settings, ...partial },
      });
    },
    [persist, progress],
  );

  const resetProgress = useCallback(() => {
    const result = resetSavedProgress(progress);
    if (result.ok) {
      setProgress(result.progress);
      setWarning(null);
    }
    return result;
  }, [progress]);

  return { progress, warning, fatal, persist, patchSettings, resetProgress };
}
