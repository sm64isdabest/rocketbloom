import { useCallback, useEffect, useState } from "react";
import { loadProgress, saveProgress } from "../utils/storage.js";

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
    setProgress(next);
    const result = saveProgress(next);
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

  return { progress, warning, fatal, persist, patchSettings };
}
