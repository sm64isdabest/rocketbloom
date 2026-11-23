import { EMPTY_TREASURE, GOLD_GOALS } from "../game/config/goldConfig.js";
import { preloadImages } from "../utils/preloadImages.js";

const svgUrl = (svg) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
const GOLD_GRADIENT = '<linearGradient id="gold" x2="0" y2="1"><stop stop-color="#fff1a0"/><stop offset=".43" stop-color="#ffc74d"/><stop offset="1" stop-color="#bd6017"/></linearGradient>';
const STEEL_GRADIENT = '<linearGradient id="steel" x2="0" y2="1"><stop stop-color="#78aed1"/><stop offset=".55" stop-color="#385475"/><stop offset="1" stop-color="#15284c"/></linearGradient>';

function createStorageIcon(highlight) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 88">
    <defs>${GOLD_GRADIENT}${STEEL_GRADIENT}
      <radialGradient id="glow"><stop stop-color="#ffc94d" stop-opacity=".85"/><stop offset="1" stop-color="#ffc94d" stop-opacity="0"/></radialGradient>
    </defs>
    ${highlight ? '<ellipse cx="48" cy="47" rx="47" ry="42" fill="url(#glow)"/>' : ""}
    <ellipse cx="47" cy="75" rx="35" ry="6" fill="#030b20" opacity=".85"/>
    <path d="M14 39 25 24h44l13 14v30l-12 9H24l-10-9Z" fill="#172b4e" stroke="#0b1932" stroke-width="3" stroke-linejoin="round"/>
    <path d="m14 39 10 11h47l11-12-13-14H25Z" fill="url(#steel)" stroke="#8bbbdf" stroke-width="1.7" stroke-linejoin="round"/>
    <path d="M20 47v18l8 6h39l9-6V47M30 53v15m36-15v15" fill="none" stroke="#648eb1" stroke-width="2"/>
    <path d="M25 41h46M24 51h48" stroke="url(#gold)" stroke-width="3" stroke-linecap="round"/>
    <path d="M38 45h20v13l-5 5H43l-5-5Z" fill="url(#gold)" stroke="#fff0a3" stroke-width="1.5"/>
    <path d="m48 49 5 5-5 4-5-4Z" fill="#593512"/>
    <path d="M30 33h8m21 0h8" stroke="#ccf5ff" stroke-width="2.4" stroke-linecap="round"/>
    <g fill="url(#gold)" stroke="#ffec89" stroke-width="1.5">
      <ellipse cx="46" cy="21" rx="7" ry="9" transform="rotate(-25 46 21)"/>
      <ellipse cx="61" cy="17" rx="6" ry="8" transform="rotate(22 61 17)"/>
      <ellipse cx="77" cy="24" rx="5" ry="7" transform="rotate(34 77 24)"/>
    </g>
    <path d="m25 12 1.5 4.5L31 18l-4.5 1.5L25 24l-1.5-4.5L19 18l4.5-1.5Z" fill="#fff0a8"/>
    ${highlight ? '<path d="m85 8 2 5 5 2-5 2-2 5-2-5-5-2 5-2ZM11 30l1.5 4.5L17 36l-4.5 1.5L11 42l-1.5-4.5L5 36l4.5-1.5Z" fill="#fff3b2"/>' : ""}
  </svg>`;
}

export const STORAGE_ICON = { normal: svgUrl(createStorageIcon(false)), highlight: svgUrl(createStorageIcon(true)) };

// Coin rows are ordered from back to front. Each row sets height, width and quantity.
const LEVELS = [
  { radius: 98, sparks: 0, rows: [] },
  { radius: 111, sparks: 5, rows: [[173, 48, 6], [186, 74, 10]] },
  { radius: 132, sparks: 10, rows: [[167, 106, 11], [185, 122, 15]],
    stacks: [[148, 174, 6], [179, 171, 4], [222, 175, 9], [257, 179, 7]] },
  { radius: 151, sparks: 17, rows: [[123, 100, 11], [142, 110, 13], [179, 156, 17], [194, 196, 21]],
    stacks: [[109, 180, 5], [301, 188, 7]], openChest: true },
  { radius: 179, sparks: 25, rows: [[79, 58, 8], [97, 105, 14], [117, 140, 17], [139, 172, 21], [160, 210, 25], [183, 260, 29], [198, 298, 31]],
    stacks: [[105, 178, 8], [294, 191, 11]], bars: [[107, 196], [139, 192], [278, 178], [320, 197]], rays: 5 },
  { radius: 200, sparks: 36, rows: [[66, 67, 10], [86, 114, 16], [106, 151, 19], [128, 181, 24], [151, 229, 27], [176, 266, 33], [195, 311, 34], [208, 345, 37]],
    stacks: [[65, 182, 12], [93, 191, 16], [319, 190, 16], [350, 191, 11]], rays: 8,
    bars: [[68, 205], [118, 193], [155, 213], [257, 209], [306, 207], [343, 213]],
    orbit: [[64, 109], [94, 68], [146, 46], [306, 44], [351, 71], [375, 112], [69, 150], [346, 155]],
    gems: [[182, 113], [244, 146], [152, 166], [213, 195], [269, 185]] },
];

function stamp(symbol, x, y, rotation = 0, scale = 1) {
  return `<use href="#${symbol}" transform="translate(${x} ${y}) rotate(${rotation}) scale(${scale})"/>`;
}

function renderCoins(rows) {
  return rows.map(([y, width, count], row) => Array.from({ length: count }, (_, index) => {
    const variation = (row * 23 + index * 31) % 17;
    const x = 210 - width / 2 + index * width / (count - 1) + (variation - 8) * .56;
    return stamp("coin", x.toFixed(1), y + variation % 8 - 3, (variation - 8) * 4, .75 + variation % 5 * .13);
  }).join("")).join("");
}

function renderChest(open) {
  return `<g stroke-linejoin="round">
    <path d="${open ? "M143 133 151 77l23-12h89l17 15-11 52Z" : "M143 137l21-18h94l20 18v39l-13 13H157l-14-13Z"}" fill="url(#steel)" stroke="#8dc5ed" stroke-width="2.4"/>
    <path d="${open ? "m157 111 9-31h91l10 36-15 13h-84Z" : "M144 137l13 16h108l13-16M173 124h73"}" fill="${open ? "#101a32" : "none"}" stroke="#3487c2" stroke-width="3"/>
    ${open ? '<path d="m147 129 11 23h103l12-23Z" fill="#152a4b" stroke="#598cb3" stroke-width="2"/>' : ""}
    <path d="M146 150h128v24l-12 14H158l-12-14Z" fill="url(#steel)" stroke="#6388ad" stroke-width="2"/>
    <path d="M154 154h111m-99 7v13m90-13v13" stroke="#b8d9f2" stroke-width="2"/>
    <path d="M198 151h24v15l-6 7h-12l-6-7Z" fill="url(#gold)" stroke="#fbe293"/>
    <path d="m210 155 5 5-5 5-5-5Z" fill="#674019"/>
  </g>`;
}

export function createTreasureSvg(level) {
  const art = LEVELS[level] ?? LEVELS[0];
  const sparks = Array.from({ length: art.sparks }, (_, i) =>
    stamp("spark", 41 + i * 79 % 339, 35 + i * 53 % 166, 0, i % 4 === 0 ? 1.15 : .55)).join("");
  const rays = Array.from({ length: art.rays ?? 0 }, (_, i) =>
    `<path d="M204 182 194 21 225 21 216 182Z" fill="url(#ray)" transform="rotate(${(i - (art.rays - 1) / 2) * 16} 210 182)"/>`).join("");
  const stacks = (art.stacks ?? []).map(([x, y, count]) => Array.from({ length: count }, (_, i) =>
    stamp("coin", x, y - i * 4.5, 0, 1.14)).join("")).join("");
  const bars = (art.bars ?? []).map(([x, y], i) => stamp("ingot", x, y, i % 2 ? 13 : -12)).join("");
  const gems = (art.gems ?? []).map(([x, y], i) => stamp("gem", x, y, 0, i % 2 ? 1.2 : .9)).join("");
  const orbit = (art.orbit ?? []).map(([x, y], i) => stamp("coin", x, y, i * 23, i % 2 ? 1.1 : .83)).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 240">
    <defs>${GOLD_GRADIENT}${STEEL_GRADIENT}
      <radialGradient id="aura"><stop stop-color="${art.rays ? "#ffc64f" : "#286fc4"}" stop-opacity="${art.rays ? .68 : .48}"/>
        <stop offset="1" stop-color="#2855a0" stop-opacity="0"/></radialGradient>
      <linearGradient id="ray" x2="0" y2="1"><stop stop-color="#ffd775" stop-opacity="0"/><stop offset="1" stop-color="#ffe7a2" stop-opacity=".47"/></linearGradient>
      <g id="coin"><ellipse cy="2.7" rx="10.5" ry="4.9" fill="#98501a" stroke="#6f3c1c" stroke-width=".8"/>
        <ellipse rx="10.5" ry="4.9" fill="url(#gold)" stroke="#ffef83" stroke-width=".9"/>
        <ellipse rx="6.6" ry="2.7" fill="none" stroke="#a95b21" opacity=".64"/><path d="m-3 .2 3-1.7 3 1.7L0 1.8Z" fill="#fff3b0"/></g>
      <g id="ingot" stroke="#ffd578" stroke-linejoin="round">
        <path d="m-17-3 6-11h25l7 11-6 7h-27Z" fill="#a75717"/>
        <path d="m-17-3 6-11h25l7 11Z" fill="url(#gold)"/><path d="M-5-10h15" stroke="#fff2b7"/></g>
      <g id="gem" stroke="#ffc6ff" stroke-width=".9" stroke-linejoin="round">
        <path d="M-11-4-6-10H6l5 6L0 11Z" fill="#af59c7"/><path d="m-6-10 2 6L0 11l4-15 2-6M-11-4h22" fill="#ed9feb"/></g>
      <path id="spark" d="M0-7 1.6-1.6 7 0 1.6 1.6 0 7-1.6 1.6-7 0-1.6-1.6Z" fill="#fff2a8"/>
    </defs>
    <ellipse cx="210" cy="128" rx="${art.radius}" ry="108" fill="url(#aura)"/>
    ${rays}
    ${art.orbit ? '<ellipse cx="210" cy="112" rx="171" ry="53" transform="rotate(-14 210 112)" fill="none" stroke="#ffd681" stroke-opacity=".65"/><ellipse cx="210" cy="112" rx="174" ry="57" transform="rotate(14 210 112)" fill="none" stroke="#65c9f3" stroke-opacity=".43"/>' : ""}
    <ellipse cx="210" cy="205" rx="173" ry="22" fill="#051025" opacity=".74"/>
    <path d="m67 196 37-19h212l37 19-14 20H81Z" fill="#112447" stroke="#5188b9" stroke-width="1.5"/>
    <path d="M68 196h284l-13 14H81Z" fill="url(#steel)"/>
    <path d="M99 212h36m150 0h36" stroke="#65d9ff" stroke-width="2.4" stroke-linecap="round"/>
    ${!art.rows.length || art.openChest ? renderChest(art.openChest) : ""}
    ${renderCoins(art.rows)}${stacks}${bars}${gems}${orbit}${sparks}
  </svg>`;
}

const treasureUrls = new Map();
export function getTreasureArt(level) {
  const available = LEVELS[level] ? level : EMPTY_TREASURE.level;
  if (!treasureUrls.has(available)) treasureUrls.set(available, svgUrl(createTreasureSvg(available)));
  return treasureUrls.get(available);
}

let preloading;
export function preloadStorageAssets(ImageConstructor = globalThis.Image) {
  preloading ??= preloadImages([
    STORAGE_ICON.normal,
    STORAGE_ICON.highlight,
    getTreasureArt(EMPTY_TREASURE.level),
    ...GOLD_GOALS.map(({ treasure }) => getTreasureArt(treasure.level)),
  ], { ImageConstructor });
  return preloading;
}
