export const LANE_COLORS = ["#00FFFF", "#FF00FE", "#FFFF00", "#000000"];

export function getLaneBounds(width, lane) {
  const laneWidth = width / 4;
  return { left: lane * laneWidth, right: (lane + 1) * laneWidth, width: laneWidth };
}

export function getLaneFromCenter(centerX, width) {
  if (!(width > 0)) return 0;
  return Math.max(0, Math.min(3, Math.floor((centerX / width) * 4)));
}

export function renderLaneColumns(ctx, width, height, { flashLane = -1, flashColor = null, flashAlpha = 0, activeLane = -1 } = {}) {
  const laneWidth = width / 4;
  for (let lane = 0; lane < 4; lane += 1) {
    const left = lane * laneWidth;
    ctx.save();
    ctx.fillStyle = LANE_COLORS[lane];
    ctx.globalAlpha = lane === 3 ? 0.58 : 0.13;
    ctx.fillRect(left, 0, laneWidth, height);
    if (lane === flashLane && flashColor && flashAlpha > 0) {
      ctx.fillStyle = flashColor;
      ctx.globalAlpha = flashAlpha;
      ctx.fillRect(left, 0, laneWidth, height);
    }
    ctx.globalAlpha = 1;
    ctx.strokeStyle = lane === 3 ? "#FFFFFF" : LANE_COLORS[lane];
    ctx.lineWidth = lane === 3 ? 2 : 1.5;
    ctx.beginPath();
    ctx.moveTo(left, 0);
    ctx.lineTo(left, height);
    ctx.stroke();
    if (lane === 3) {
      ctx.strokeStyle = "rgba(255,255,255,.7)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(left + 3, 0);
      ctx.lineTo(left + 3, height);
      ctx.stroke();
    }
    if (lane === activeLane) {
      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = 2;
      ctx.strokeRect(left + 4, 2, Math.max(1, laneWidth - 8), Math.max(1, height - 4));
    }
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "700 11px Consolas, monospace";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.shadowColor = "#000000";
    ctx.shadowBlur = 4;
    ctx.fillText(String(lane + 1), left + 7, 142);
    ctx.restore();
  }
  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,.86)";
  ctx.lineWidth = 2;
  ctx.setLineDash?.([8, 7]);
  for (let lane = 1; lane < 4; lane += 1) {
    const x = lane * laneWidth;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  ctx.setLineDash?.([]);
  ctx.restore();
}
