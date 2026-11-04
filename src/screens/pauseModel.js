export function getPauseAssetUrl(filename, basePath = import.meta.env?.BASE_URL ?? "/") {
  const normalizedBase = basePath.endsWith("/") ? basePath : `${basePath}/`;
  return `${normalizedBase}assets/ui/pause/${filename}`;
}

export function getPauseActions({ onQuit, onResume, onSettings }) {
  return [
    { id: "quit", label: "Sair da fase", asset: "leave.png", onClick: onQuit },
    { id: "resume", label: "Continuar", asset: "continue.png", onClick: onResume },
    { id: "settings", label: "Configurações", asset: "settings.png", onClick: onSettings },
  ];
}
