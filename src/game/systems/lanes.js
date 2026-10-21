export const LANE_COLORS = ["#00FFFF", "#FF00FE", "#FFFF00", "#000000"];

export function getLaneBounds(width, lane) {
  const laneWidth = width / 4;
  return { left: lane * laneWidth, right: (lane + 1) * laneWidth, width: laneWidth };
}

export function getLaneFromCenter(centerX, width) {
  if (!(width > 0)) return 0;
  return Math.max(0, Math.min(3, Math.floor((centerX / width) * 4)));
}

export function renderLaneColumns(ctx, width, height, { visible = false, flashLane = -1, flashColor = null, flashAlpha = 0 } = {}) {
  const flashVisible = flashLane >= 0 && flashLane < 4 && flashColor && flashAlpha > 0;
  if (!visible && !flashVisible) return;

  const laneWidth = width / 4;
  for (let lane = 0; lane < 4; lane += 1) {
    if (!visible) break;
    ctx.save();
    ctx.globalAlpha = 0.25;
    ctx.strokeStyle = LANE_COLORS[lane];
    ctx.lineWidth = 1.25;
    ctx.strokeRect(lane * laneWidth + 0.5, 0.5, Math.max(1, laneWidth - 1), Math.max(1, height - 1));
    ctx.restore();
  }
  if (flashVisible) {
    ctx.save();
    ctx.globalAlpha = Math.min(0.48, flashAlpha);
    ctx.strokeStyle = flashColor;
    ctx.lineWidth = 2;
    ctx.strokeRect(flashLane * laneWidth + 0.5, 0.5, Math.max(1, laneWidth - 1), Math.max(1, height - 1));
    ctx.restore();
  }
}
