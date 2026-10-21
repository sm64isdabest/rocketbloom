export function PlantGrowthArt({ plant, stage = 0, locked = false }) {
  const maxGrowth = Math.max(0, plant.growthStages.length - 1);
  const growth = Math.max(0, Math.min(maxGrowth, Math.round(stage)));
  const ratio = maxGrowth ? growth / maxGrowth : 1;
  const { leaf, flower, accent } = plant.palette;
  const leafCount = Math.round(ratio * 6);
  const height = 8 + ratio * 41;
  const mature = growth >= maxGrowth;
  const isLichen = plant.form === "lichen";
  const isWaterLily = plant.form === "water-lily";
  const isFern = plant.form === "fern";
  const isOrchid = plant.form === "orchid";

  return (
    <svg className={`plant-growth-art plant-growth-art--${plant.form} ${locked ? "is-unknown" : ""}`} viewBox="0 0 120 100" role="img" aria-label={`${plant.name}: ${locked ? "ainda não resgatada" : plant.growthStages[growth]}`}>
      <ellipse cx="60" cy="88" rx="38" ry="6" fill="rgba(5, 14, 19, .46)" />
      {isWaterLily ? <path d="M16 82 Q60 75 104 82" fill="none" stroke="#61cbd0" strokeOpacity=".48" strokeWidth="2" /> : null}
      <path d="M60 84 Q59 66 60 84" stroke={accent} strokeWidth="2" fill="none" />
      {ratio === 0 ? <ellipse cx="60" cy="79" rx="7" ry="5" fill={accent} /> : null}
      {growth > 0 && !isLichen ? <path d={`M60 82 Q${isFern ? 56 : 60} ${82 - height} 60 ${82 - height}`} stroke={leaf} strokeWidth={isFern ? 3 : 2.5} fill="none" strokeLinecap="round" /> : null}
      {Array.from({ length: leafCount }, (_, index) => {
        const side = index % 2 ? 1 : -1;
        const row = Math.floor(index / 2);
        const y = 78 - row * (isLichen ? 0 : 10) - (growth === 3 && isFern ? 1 : 0);
        const x = 60 + side * (10 + row * 4);
        if (isLichen) return <circle key={index} cx={x} cy={y} r={6 + row * 1.2} fill={index % 3 ? leaf : flower} opacity=".9" />;
        const d = isFern
          ? `M60 ${y + 8} Q${x} ${y - 2} ${x} ${y - 7} Q${x + side * 5} ${y - 2} 60 ${y + 8}`
          : `M60 ${y + 5} Q${x - side * 2} ${y - 12} ${x + side * 11} ${y - 7} Q${x + side * 8} ${y + 3} 60 ${y + 5}`;
        return <path key={index} d={d} fill={leaf} stroke={accent} strokeOpacity=".35" strokeWidth="1" />;
      })}
      {mature && !isLichen ? (
        <g transform={`translate(60 ${82 - height})`}>
          {[0, 72, 144, 216, 288].map((rotation) => <ellipse key={rotation} cx="0" cy="-7" rx={isOrchid ? 5 : 4} ry={isOrchid ? 9 : 7} fill={flower} transform={`rotate(${rotation})`} />)}
          <circle r="3.5" fill={accent} />
        </g>
      ) : null}
      {mature && isLichen ? <circle cx="60" cy="70" r="5" fill={accent} /> : null}
    </svg>
  );
}
