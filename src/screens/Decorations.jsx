const APP_BASE = import.meta.env?.BASE_URL ?? "/";
const STAR_POSITIONS = [[8, 19], [19, 61], [32, 15], [42, 73], [61, 22], [74, 62], [81, 32], [94, 12]];

export function Decorations({ equippedIds }) {
  return (
    <div className="gold-decorations" aria-hidden="true">
      {equippedIds.includes("aurora") ? <div className="gold-decorations__aurora" /> : null}
      {equippedIds.includes("nebula") ? <div className="gold-decorations__nebula" /> : null}
      {equippedIds.includes("stars") ? STAR_POSITIONS.map(([x, y], index) => (
        <span className="gold-decorations__star" key={x}
          style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${index * -0.43}s` }}>✦</span>
      )) : null}
      {equippedIds.includes("saturn") ? <img className="gold-decorations__planet"
        src={`${APP_BASE}assets/ui/planets/saturn-icon.webp`} alt="" /> : null}
      {equippedIds.includes("frame") ? <div className="gold-decorations__frame" /> : null}
    </div>
  );
}
