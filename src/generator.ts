import p5 from "p5";

import type { PixelIcon } from "./data/icons";
import { getRandomIcon, pixelIcons } from "./data/icons";
import { pixelArtIconAssets, pixelArtIconIds } from "./data/pixelartIconAssets";
import {
  defaultPaletteId,
  getPalette,
  getRandomPalette,
  palettes,
} from "./data/palettes";

const MIN_TILE_SCALE = 0.12;
const MAX_TILE_SCALE = 6.5;
const MAX_ROTATION_DEGREES = 180;
const MIN_DENSITY_PERCENT = 50;
const MAX_DENSITY_PERCENT_UI = 1000;
const ROTATION_SPEED_MAX = (Math.PI / 2) * 0.05; // approx 4.5°/s at 100%

const degToRad = (value: number) => (value * Math.PI) / 180;
const randomInt = (min: number, max: number) =>
  min + Math.floor(Math.random() * (max - min + 1));

const movementModes = [
  "sway",
  "pulse",
  "orbit",
  "drift",
  "ripple",
  "zigzag",
  "cascade",
  "spiral",
  "comet",
  "wavefront",
] as const;

export type MovementMode = (typeof movementModes)[number];

type PaletteId = (typeof palettes)[number]["id"];

type BlendModeKey = "NONE" | "MULTIPLY" | "SCREEN" | "HARD_LIGHT" | "OVERLAY";
export type BlendModeOption = BlendModeKey;

export type BackgroundMode =
  | "palette"
  | "midnight"
  | "charcoal"
  | "dusk"
  | "dawn"
  | "nebula";

const backgroundPresets: Record<BackgroundMode, string | null> = {
  palette: null,
  midnight: "#050509",
  charcoal: "#15151f",
  dusk: "#1f1b3b",
  dawn: "#fbe8c8",
  nebula: "#121835",
};

export type SpriteMode =
  | "rounded"
  | "circle"
  | "square"
  | "triangle"
  | "hexagon"
  | "ring"
  | "diamond"
  | "star"
  | "line"
  | "icon";

interface IconTile {
  kind: "icon";
  iconId: string;
  tint: string;
  u: number;
  v: number;
  scale: number;
  blendMode: BlendModeKey;
  rotationBase: number;
  rotationDirection: number;
  rotationSpeed: number;
}

interface ShapeTile {
  kind: "shape";
  shape: ShapeMode;
  tint: string;
  u: number;
  v: number;
  scale: number;
  blendMode: BlendModeKey;
  rotationBase: number;
  rotationDirection: number;
  rotationSpeed: number;
}

type PreparedTile = IconTile | ShapeTile;

interface PreparedLayer {
  tiles: PreparedTile[];
  tileCount: number;
  blendMode: BlendModeKey;
  opacity: number;
  mode: "icon" | "shape";
  baseSizeRatio: number;
}

interface PreparedSprite {
  layers: PreparedLayer[];
  background: string;
}

export interface GeneratorState {
  seed: string;
  icon: PixelIcon;
  paletteId: string;
  paletteVariance: number;
  scalePercent: number;
  scaleBase: number;
  scaleSpread: number;
  motionIntensity: number;
  blendMode: BlendModeKey;
  blendModeAuto: boolean;
  previousBlendMode: BlendModeKey;
  layerOpacity: number;
  spriteMode: SpriteMode;
  iconAssetId: string;
  movementMode: MovementMode;
  backgroundMode: BackgroundMode;
  motionSpeed: number;
  rotationEnabled: boolean;
  rotationAmount: number;
  rotationSpeed: number;
}

export interface SpriteControllerOptions {
  onStateChange?: (state: GeneratorState) => void;
  onFrameRate?: (fps: number) => void;
}

const shapeModes = [
  "rounded",
  "circle",
  "square",
  "triangle",
  "hexagon",
  "ring",
  "diamond",
  "star",
  "line",
] as const;
const spriteModePool: SpriteMode[] = [...shapeModes, "icon"];

type ShapeMode = (typeof shapeModes)[number];

const shapeIcons: Record<ShapeMode, PixelIcon> = {
  rounded: {
    id: "shape-rounded",
    name: "Rounded Square",
    grid: [
      "00011100",
      "00111110",
      "01111111",
      "01111111",
      "01111111",
      "01111111",
      "00111110",
      "00011100",
    ],
  },
  circle: {
    id: "shape-circle",
    name: "Circle",
    grid: [
      "00011000",
      "00111100",
      "01111110",
      "11111111",
      "11111111",
      "01111110",
      "00111100",
      "00011000",
    ],
  },
  square: {
    id: "shape-square",
    name: "Square",
    grid: [
      "01111110",
      "11111111",
      "11111111",
      "11111111",
      "11111111",
      "11111111",
      "11111111",
      "01111110",
    ],
  },
  triangle: {
    id: "shape-triangle",
    name: "Triangle",
    grid: [
      "00001000",
      "00011000",
      "00111100",
      "01111110",
      "11111111",
      "11111111",
      "11111111",
      "11111111",
    ],
  },
  hexagon: {
    id: "shape-hexagon",
    name: "Hexagon",
    grid: [
      "00011000",
      "00111100",
      "01111110",
      "11111111",
      "11111111",
      "01111110",
      "00111100",
      "00011000",
    ],
  },
  ring: {
    id: "shape-ring",
    name: "Ring",
    grid: [
      "00111100",
      "01100110",
      "11000011",
      "10000001",
      "10000001",
      "11000011",
      "01100110",
      "00111100",
    ],
  },
  diamond: {
    id: "shape-diamond",
    name: "Diamond",
    grid: [
      "00001000",
      "00011100",
      "00111110",
      "01111111",
      "00111110",
      "00011100",
      "00001000",
      "00000000",
    ],
  },
  star: {
    id: "shape-star",
    name: "Star",
    grid: [
      "00001000",
      "01011100",
      "01111110",
      "11111111",
      "01111110",
      "01011100",
      "00001000",
      "00000000",
    ],
  },
  line: {
    id: "shape-line",
    name: "Line",
    grid: [
      "00000000",
      "11111111",
      "11111111",
      "11111111",
      "11111111",
      "11111111",
      "00000000",
      "00000000",
    ],
  },
};

export const DEFAULT_STATE: GeneratorState = {
  seed: "DEADBEEF",
  icon: pixelIcons[0],
  paletteId: defaultPaletteId,
  paletteVariance: 50,
  scalePercent: 50,
  scaleBase: 60,
  scaleSpread: 55,
  motionIntensity: 48,
  blendMode: "NONE",
  blendModeAuto: true,
  previousBlendMode: "NONE",
  layerOpacity: 68,
  spriteMode: "rounded",
  iconAssetId: pixelArtIconIds[0],
  movementMode: "sway",
  backgroundMode: "palette",
  motionSpeed: 100,
  rotationEnabled: false,
  rotationAmount: 0,
  rotationSpeed: 0,
};

const SEED_ALPHABET = "0123456789ABCDEF";

const generateSeedString = () =>
  Array.from(
    { length: 8 },
    () => SEED_ALPHABET[Math.floor(Math.random() * SEED_ALPHABET.length)],
  ).join("");

const createMulberry32 = (seed: number) => {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
};

const hashSeed = (seed: string) => {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i += 1) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h ^= h >>> 13;
  h = Math.imul(h, 3266489909);
  return h ^ (h >>> 16);
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const hexToHsl = (hex: string): [number, number, number] => {
  const sanitized = hex.replace("#", "");
  const bigint = parseInt(sanitized, 16);
  const r = ((bigint >> 16) & 255) / 255;
  const g = ((bigint >> 8) & 255) / 255;
  const b = (bigint & 255) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      default:
        h = (r - g) / d + 4;
    }
    h /= 6;
  }

  return [h * 360, s * 100, l * 100];
};

const hueToRgb = (p: number, q: number, t: number) => {
  if (t < 0) t += 1;
  if (t > 1) t -= 1;
  if (t < 1 / 6) return p + (q - p) * 6 * t;
  if (t < 1 / 2) return q;
  if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
  return p;
};

const hslToHex = (h: number, s: number, l: number) => {
  h = ((h % 360) + 360) % 360;
  s = clamp(s, 0, 100);
  l = clamp(l, 0, 100);

  const sat = s / 100;
  const light = l / 100;

  if (sat === 0) {
    const gray = Math.round(light * 255);
    return `#${gray.toString(16).padStart(2, "0").repeat(3)}`;
  }

  const q = light < 0.5 ? light * (1 + sat) : light + sat - light * sat;
  const p = 2 * light - q;
  const r = Math.round(hueToRgb(p, q, h / 360 + 1 / 3) * 255);
  const g = Math.round(hueToRgb(p, q, h / 360) * 255);
  const b = Math.round(hueToRgb(p, q, h / 360 - 1 / 3) * 255);

  return `#${[r, g, b]
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("")}`;
};

const jitterColor = (hex: string, variance: number, random: () => number) => {
  const [h, s, l] = hexToHsl(hex);
  const hueShift = (random() - 0.5) * variance * 60;
  const satShift = (random() - 0.5) * variance * 50;
  const lightShift = (random() - 0.5) * variance * 40;
  return hslToHex(h + hueShift, s + satShift, l + lightShift);
};

const blendModePool: BlendModeKey[] = [
  "NONE",
  "MULTIPLY",
  "SCREEN",
  "HARD_LIGHT",
  "OVERLAY",
];

const resolveIconAssetId = (id: string | undefined) =>
  id && pixelArtIconIds.includes(id) ? id : pixelArtIconIds[0];

const getRandomAssetId = () =>
  pixelArtIconIds[Math.floor(Math.random() * pixelArtIconIds.length)];

const computeMovementOffsets = (
  mode: MovementMode,
  data: {
    time: number;
    phase: number;
    motionScale: number;
    layerIndex: number;
    baseUnit: number;
    layerTileSize: number;
    speedFactor: number;
  },
): { offsetX: number; offsetY: number; scaleMultiplier: number } => {
  const {
    time,
    phase,
    motionScale,
    layerIndex,
    baseUnit,
    layerTileSize,
    speedFactor,
  } = data;
  const layerFactor = 1 + layerIndex * 0.12;
  const velocity = Math.max(speedFactor, 0);
  const baseTime = velocity === 0 ? 0 : time * velocity;
  const phased = baseTime + phase;
  const clampScale = (value: number) => Math.max(0.35, value);

  switch (mode) {
    case "pulse": {
      const pulse = Math.sin(phased * 0.08) * motionScale;
      const scaleMultiplier = clampScale(1 + pulse * 0.55);
      const offsetY =
        Math.sin(phased * 0.04) * baseUnit * motionScale * 0.25 * layerFactor;
      return { offsetX: 0, offsetY, scaleMultiplier };
    }
    case "orbit": {
      const radius = layerTileSize * 0.12 * motionScale * layerFactor;
      const angle = phased * (0.05 + layerIndex * 0.01);
      const offsetX = Math.cos(angle) * radius;
      const offsetY = Math.sin(angle) * radius;
      return { offsetX, offsetY, scaleMultiplier: 1 };
    }
    case "drift": {
      const offsetX =
        Math.cos(phased * 0.02 + phase * 0.45) *
        layerTileSize *
        0.08 *
        motionScale;
      const offsetY =
        Math.sin(phased * 0.018 + phase * 0.3) *
        layerTileSize *
        0.06 *
        motionScale;
      return {
        offsetX,
        offsetY,
        scaleMultiplier: clampScale(1 + Math.sin(phase) * motionScale * 0.15),
      };
    }
    case "ripple": {
      const wave = Math.sin(phased * 0.04 + layerIndex * 0.6);
      const radius = baseUnit * (0.6 + motionScale * 0.9);
      const offsetX =
        Math.cos(phase * 1.2 + phased * 0.015) * radius * wave * 0.35;
      const offsetY =
        Math.sin(phase * 1.35 + phased * 0.02) * radius * wave * 0.35;
      const scaleMultiplier = clampScale(1 + wave * motionScale * 0.4);
      return { offsetX, offsetY, scaleMultiplier };
    }
    case "zigzag": {
      const zig = phased * 0.06 + layerIndex * 0.25;
      const tri = (2 / Math.PI) * Math.asin(Math.sin(zig));
      const sweep = Math.sin(zig * 1.35);
      const offsetX =
        tri * layerTileSize * 0.35 * motionScale +
        sweep * baseUnit * 0.2 * motionScale;
      const offsetY =
        Math.sin(zig * 0.9 + layerIndex * 0.4 + phase * 0.4) *
        layerTileSize *
        0.22 *
        motionScale;
      const scaleMultiplier = clampScale(
        1 + Math.cos(zig * 1.1) * 0.18 * motionScale,
      );
      return { offsetX, offsetY, scaleMultiplier };
    }
    case "cascade": {
      const cascadeTime = phased * 0.045 + layerIndex * 0.2;
      const wave = Math.sin(cascadeTime);
      const drift = (1 - Math.cos(cascadeTime)) * 0.5;
      const offsetY =
        (drift * 2 - 1) *
        layerTileSize *
        0.4 *
        (1 + layerIndex * 0.12) *
        motionScale;
      const offsetX = wave * baseUnit * 0.3 * motionScale;
      const scaleMultiplier = clampScale(
        1 + Math.sin(cascadeTime * 1.2 + phase * 0.25) * 0.16 * motionScale,
      );
      return { offsetX, offsetY, scaleMultiplier };
    }
    case "spiral": {
      const radius = baseUnit * (0.8 + layerIndex * 0.25 + motionScale * 1.8);
      const angle = phased * (0.04 + layerIndex * 0.02);
      const spiralFactor = 1 + Math.sin(angle * 0.5) * 0.4;
      const offsetX = Math.cos(angle) * radius * spiralFactor;
      const offsetY = Math.sin(angle) * radius * spiralFactor;
      const scaleMultiplier = clampScale(
        1 + Math.cos(angle * 0.7) * motionScale * 0.25,
      );
      return { offsetX, offsetY, scaleMultiplier };
    }
    case "comet": {
      const pathLength =
        layerTileSize * (1.2 + layerIndex * 0.35 + motionScale * 1.6);
      const travel = phased * (0.035 + layerIndex * 0.01);
      const orbital = travel + phase;
      const tail = (Math.sin(travel * 0.9 + phase * 0.6) + 1) * 0.5;
      const offsetX = Math.cos(orbital) * pathLength;
      const offsetY = Math.sin(orbital * 0.75) * pathLength * 0.48;
      const scaleMultiplier = clampScale(0.65 + tail * motionScale * 0.55);
      return { offsetX, offsetY, scaleMultiplier };
    }
    case "wavefront": {
      const travel = phased * 0.055;
      const waveRadius =
        layerTileSize * (motionScale * 2.4 + 1.6 + layerIndex * 0.25);
      const offsetX = Math.cos(travel + phase * 0.25) * waveRadius;
      const offsetY =
        Math.sin(travel * 0.65 + layerIndex * 0.3 + phase * 0.15) *
        waveRadius *
        0.75;
      const breathing = 1 + Math.sin(travel * 0.5) * motionScale * 0.35;
      const scaleMultiplier = clampScale(breathing);
      return { offsetX, offsetY, scaleMultiplier };
    }
    case "sway":
    default: {
      const offsetX = Math.sin(phased * 0.13) * baseUnit * motionScale * 0.45;
      const offsetY =
        Math.sin((phased + phase * 0.5) * 0.07 + layerIndex * 0.4) *
        baseUnit *
        motionScale *
        0.6;
      return { offsetX, offsetY, scaleMultiplier: 1 };
    }
  }
};

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const computeSprite = (state: GeneratorState): PreparedSprite => {
  const rng = createMulberry32(hashSeed(state.seed));
  const palette = getPalette(state.paletteId);
  const variance = clamp(state.paletteVariance / 100, 0, 1);

  const colorRng = createMulberry32(hashSeed(`${state.seed}-color`));
  const positionRng = createMulberry32(hashSeed(`${state.seed}-position`));
  const chosenPalette = palette.colors.map((color) =>
    jitterColor(color, variance, colorRng),
  );
  const backgroundBase = palette.colors[0];
  const presetBackground = backgroundPresets[state.backgroundMode];
  const background =
    presetBackground === null
      ? jitterColor(backgroundBase, variance * 0.5, colorRng)
      : presetBackground;

  const densityRatio = clamp(state.scalePercent / MAX_DENSITY_PERCENT_UI, 0, 1);
  const baseScaleValue = clamp(state.scaleBase / 100, 0, 1);
  const spreadValue = clamp(state.scaleSpread / 100, 0, 1);

  const baseScale = lerp(MIN_TILE_SCALE, MAX_TILE_SCALE, baseScaleValue);
  const minScaleFactor = lerp(baseScale, MIN_TILE_SCALE, spreadValue);
  const maxScaleFactor = lerp(baseScale, MAX_TILE_SCALE, spreadValue);
  const rotationRange = state.rotationEnabled
    ? degToRad(clamp(state.rotationAmount, 0, MAX_ROTATION_DEGREES))
    : 0;
  const rotationSpeedBase = clamp(state.rotationSpeed, 0, 100) / 100;

  const baseIconId = resolveIconAssetId(state.iconAssetId);
  const isIconMode = state.spriteMode === "icon";
  const isShapeMode = shapeModes.includes(state.spriteMode as ShapeMode);
  const activeShape = isShapeMode ? (state.spriteMode as ShapeMode) : "rounded";

  const layers: PreparedLayer[] = [];
  const opacityBase = clamp(state.layerOpacity / 100, 0.12, 1);
  const layerCount = 3;
  const layerThresholds = [0, 0.38, 0.7];

  for (let layerIndex = 0; layerIndex < layerCount; layerIndex += 1) {
    const threshold = layerThresholds[layerIndex] ?? 0.85;
    if (layerIndex > 0 && densityRatio < threshold) {
      continue;
    }

    const normalizedDensity =
      layerIndex === 0
        ? densityRatio
        : clamp((densityRatio - threshold) / (1 - threshold), 0, 1);

    const baseSizeBase = isIconMode ? 0.18 : 0.22;
    const baseSizeRatio =
      baseSizeBase * (1 + layerIndex * (isIconMode ? 0.12 : 0.18));
    const maxTiles = isIconMode ? 36 : 60;
    const minTiles = layerIndex === 0 ? 1 : 0;
    const desiredTiles = 1 + normalizedDensity * (maxTiles - 1);
    const tileTotal = Math.max(minTiles, Math.round(desiredTiles));

    if (tileTotal === 0) {
      continue;
    }

    const layerBlendMode: BlendModeKey = state.blendModeAuto
      ? (blendModePool[Math.floor(Math.random() * blendModePool.length)] ??
        "NONE")
      : state.blendMode;
    const opacity = clamp(opacityBase + (rng() - 0.5) * 0.35, 0.12, 0.95);

    const gridCols = Math.max(1, Math.round(Math.sqrt(tileTotal)));
    const gridRows = Math.max(1, Math.ceil(tileTotal / gridCols));
    const tiles: PreparedTile[] = [];

    for (let index = 0; index < tileTotal; index += 1) {
      const col = index % gridCols;
      const row = Math.floor(index / gridCols);
      const jitterStrengthX = gridCols === 1 ? 0.2 : 0.6;
      const jitterStrengthY = gridRows === 1 ? 0.2 : 0.6;
      const jitterX = (positionRng() - 0.5) * jitterStrengthX;
      const jitterY = (positionRng() - 0.5) * jitterStrengthY;
      const u = clamp((col + 0.5 + jitterX) / gridCols, 0.05, 0.95);
      const v = clamp((row + 0.5 + jitterY) / gridRows, 0.05, 0.95);

      const scaleRange = Math.max(0, maxScaleFactor - minScaleFactor);
      const scale =
        scaleRange < 1e-6
          ? baseScale
          : clamp(
              minScaleFactor + positionRng() * scaleRange,
              MIN_TILE_SCALE,
              MAX_TILE_SCALE,
            );
      const rotationBase =
        rotationRange > 0 ? (positionRng() - 0.5) * 2 * rotationRange : 0;
      const rotationDirection = positionRng() > 0.5 ? 1 : -1;
      const rotationSpeedValue =
        rotationSpeedBase > 0
          ? rotationSpeedBase * ROTATION_SPEED_MAX * (0.6 + positionRng() * 0.6)
          : 0;
      const tileBlend = state.blendModeAuto
        ? (blendModePool[Math.floor(rng() * blendModePool.length)] ?? "NONE")
        : state.blendMode;

      if (isIconMode) {
        const tint =
          chosenPalette[Math.floor(colorRng() * chosenPalette.length)];
        tiles.push({
          kind: "icon",
          iconId: baseIconId,
          tint,
          u,
          v,
          scale,
          blendMode: tileBlend,
          rotationBase,
          rotationDirection,
          rotationSpeed: rotationSpeedValue,
        });
      } else {
        const tint =
          chosenPalette[Math.floor(colorRng() * chosenPalette.length)];
        tiles.push({
          kind: "shape",
          shape: activeShape,
          tint,
          u,
          v,
          scale,
          blendMode: tileBlend,
          rotationBase,
          rotationDirection,
          rotationSpeed: rotationSpeedValue,
        });
      }
    }

    layers.push({
      tiles,
      tileCount: tileTotal,
      blendMode: layerBlendMode,
      opacity,
      mode: isIconMode ? "icon" : "shape",
      baseSizeRatio,
    });
  }

  return { layers, background };
};

export interface SpriteController {
  getState: () => GeneratorState;
  randomizeAll: () => void;
  randomizeIcon: () => void;
  randomizeColors: () => void;
  randomizeScale: () => void;
  randomizeScaleRange: () => void;
  randomizeMotion: () => void;
  randomizeBlendMode: () => void;
  setScalePercent: (value: number) => void;
  setScaleBase: (value: number) => void;
  setScaleSpread: (value: number) => void;
  setPaletteVariance: (value: number) => void;
  setMotionIntensity: (value: number) => void;
  setMotionSpeed: (value: number) => void;
  setBlendMode: (mode: BlendModeOption) => void;
  setBlendModeAuto: (value: boolean) => void;
  setLayerOpacity: (value: number) => void;
  setSpriteMode: (mode: SpriteMode) => void;
  setMovementMode: (mode: MovementMode) => void;
  setIconAsset: (iconId: string) => void;
  setRotationEnabled: (value: boolean) => void;
  setRotationAmount: (value: number) => void;
  setRotationSpeed: (value: number) => void;
  usePalette: (paletteId: PaletteId) => void;
  setBackgroundMode: (mode: BackgroundMode) => void;
  applySingleTilePreset: () => void;
  applyNebulaPreset: () => void;
  applyMinimalGridPreset: () => void;
  reset: () => void;
  destroy: () => void;
}

export const createSpriteController = (
  container: HTMLElement,
  options: SpriteControllerOptions = {},
): SpriteController => {
  let state: GeneratorState = {
    ...DEFAULT_STATE,
    icon: getRandomIcon(),
    iconAssetId: resolveIconAssetId(DEFAULT_STATE.iconAssetId),
    seed: generateSeedString(),
    previousBlendMode: DEFAULT_STATE.blendMode,
  };
  let prepared = computeSprite(state);
  let p5Instance: p5 | null = null;
  const iconGraphics: Record<string, p5.Image | null> = Object.fromEntries(
    pixelArtIconAssets.map(({ id }) => [id, null]),
  );

  const notifyState = () => {
    options.onStateChange?.({ ...state });
  };

  const updateSprite = () => {
    prepared = computeSprite(state);
    notifyState();
  };

  const updateSeed = (seed?: string) => {
    state.seed = seed ?? generateSeedString();
  };

  const sketch = (p: p5) => {
    let canvas: p5.Renderer;
    let animationTime = 0;

    p.setup = () => {
      const size = container.clientWidth || 640;
      canvas = p.createCanvas(size, size);
      canvas.parent(container);
      p.pixelDensity(1);
      p.noStroke();
      p.noSmooth();
      p.imageMode(p.CENTER);

      pixelArtIconAssets.forEach(({ id, url }) => {
        if (iconGraphics[id]) {
          return;
        }
        p.loadImage(url, (img) => {
          iconGraphics[id] = img;
        });
      });
    };

    p.windowResized = () => {
      const size = container.clientWidth || 640;
      p.resizeCanvas(size, size);
    };

    p.draw = () => {
      const drawSize = Math.min(p.width, p.height);
      const offsetX = (p.width - drawSize) / 2;
      const offsetY = (p.height - drawSize) / 2;
      const motionScale = clamp(state.motionIntensity / 100, 0, 1.5);
      const deltaMs = typeof p.deltaTime === "number" ? p.deltaTime : 16.666;
      const speedFactor = Math.max(state.motionSpeed / 100, 0);
      animationTime += speedFactor * (deltaMs / 16.666);
      const globalTime = animationTime;
      const baseIconId = resolveIconAssetId(state.iconAssetId);

      p.background(prepared.background);
      const ctx = p.drawingContext as CanvasRenderingContext2D;
      ctx.imageSmoothingEnabled = false;

      const blendMap: Record<BlendModeKey, p5.BLEND_MODE> = {
        NONE: p.BLEND,
        MULTIPLY: p.MULTIPLY,
        SCREEN: p.SCREEN,
        HARD_LIGHT: p.HARD_LIGHT ?? p.OVERLAY,
        OVERLAY: p.OVERLAY,
      };

      prepared.layers.forEach((layer, layerIndex) => {
        if (layer.tiles.length === 0) {
          return;
        }
        const baseLayerSize = drawSize * layer.baseSizeRatio;

        p.push();
        layer.tiles.forEach((tile, tileIndex) => {
          const tileBlendMode = tile.blendMode ?? layer.blendMode;
          p.blendMode(blendMap[tileBlendMode] ?? p.BLEND);
          const normalizedU = ((tile.u % 1) + 1) % 1;
          const normalizedV = ((tile.v % 1) + 1) % 1;
          const baseX = offsetX + normalizedU * drawSize;
          const baseY = offsetY + normalizedV * drawSize;

          if (tile.kind === "icon") {
            const iconGraphic =
              iconGraphics[tile.iconId] ?? iconGraphics[baseIconId];
            if (!iconGraphic) {
              return;
            }
            const baseIconSize =
              baseLayerSize * tile.scale * (1 + layerIndex * 0.08);
            const movement = computeMovementOffsets(state.movementMode, {
              time: globalTime,
              phase: tileIndex * 9,
              motionScale,
              layerIndex,
              baseUnit: baseIconSize,
              layerTileSize: baseLayerSize,
              speedFactor,
            });
            const iconSize = baseIconSize * movement.scaleMultiplier;

            const rotationTime = globalTime * speedFactor;
            const rotationSpeed = tile.rotationSpeed;
            const rotationAngle =
              (state.rotationEnabled ? tile.rotationBase : 0) +
              rotationSpeed * tile.rotationDirection * rotationTime;
            p.push();
            p.translate(baseX + movement.offsetX, baseY + movement.offsetY);
            if (rotationAngle !== 0) {
              p.rotate(rotationAngle);
            }
            const tintColour = p.color(tile.tint);
            tintColour.setAlpha(Math.round(layer.opacity * 255));
            p.tint(tintColour);
            p.image(iconGraphic, 0, 0, iconSize, iconSize);
            p.pop();
          } else if (tile.kind === "shape") {
            const baseShapeSize =
              baseLayerSize * tile.scale * (1 + layerIndex * 0.08);
            const movement = computeMovementOffsets(state.movementMode, {
              time: globalTime,
              phase: tileIndex * 7,
              motionScale,
              layerIndex,
              baseUnit: baseShapeSize,
              layerTileSize: baseLayerSize,
              speedFactor,
            });
            const shapeSize = baseShapeSize * movement.scaleMultiplier;
            const fillColor = p.color(tile.tint);
            fillColor.setAlpha(Math.round(layer.opacity * 255));

            p.push();
            p.translate(baseX + movement.offsetX, baseY + movement.offsetY);
            const rotationTime = globalTime * speedFactor;
            const rotationSpeed = tile.rotationSpeed;
            const rotationAngle =
              (state.rotationEnabled ? tile.rotationBase : 0) +
              rotationSpeed * tile.rotationDirection * rotationTime;
            if (rotationAngle !== 0) {
              p.rotate(rotationAngle);
            }
            p.noStroke();
            p.fill(fillColor);

            const halfSize = shapeSize / 2;
            switch (tile.shape) {
              case "rounded": {
                const cornerRadius = shapeSize * 0.3;
                p.rectMode(p.CENTER);
                p.rect(0, 0, shapeSize, shapeSize, cornerRadius);
                break;
              }
              case "circle":
                p.circle(0, 0, shapeSize);
                break;
              case "square":
                p.rectMode(p.CENTER);
                p.rect(0, 0, shapeSize, shapeSize);
                break;
              case "triangle": {
                const height = (Math.sqrt(3) / 2) * shapeSize;
                const yOffset = height / 3;
                p.triangle(
                  -halfSize,
                  yOffset,
                  halfSize,
                  yOffset,
                  0,
                  yOffset - height,
                );
                break;
              }
              case "hexagon": {
                const radius = halfSize;
                p.beginShape();
                for (let k = 0; k < 6; k += 1) {
                  const angle = p.TWO_PI * (k / 6) - p.HALF_PI;
                  p.vertex(Math.cos(angle) * radius, Math.sin(angle) * radius);
                }
                p.endShape(p.CLOSE);
                break;
              }
              case "ring": {
                const strokeWeight = Math.max(1.5, shapeSize * 0.18);
                const wobble =
                  Math.sin((tileIndex + p.frameCount) * 0.03 + layerIndex) *
                  0.35;
                p.noFill();
                p.stroke(fillColor);
                p.strokeWeight(strokeWeight);
                p.rotate(wobble);
                p.circle(0, 0, shapeSize);
                p.noStroke();
                break;
              }
              case "diamond": {
                p.beginShape();
                p.vertex(0, -halfSize);
                p.vertex(halfSize, 0);
                p.vertex(0, halfSize);
                p.vertex(-halfSize, 0);
                p.endShape(p.CLOSE);
                break;
              }
              case "star": {
                const outer = halfSize;
                const inner = outer * 0.45;
                p.beginShape();
                for (let k = 0; k < 10; k += 1) {
                  const angle = p.TWO_PI * (k / 10) - p.HALF_PI;
                  const radius = k % 2 === 0 ? outer : inner;
                  p.vertex(Math.cos(angle) * radius, Math.sin(angle) * radius);
                }
                p.endShape(p.CLOSE);
                break;
              }
              case "line": {
                const length = shapeSize * 18;
                const thickness = Math.max(2, shapeSize * 0.12);
                p.rectMode(p.CENTER);
                p.rect(0, 0, length, thickness);
                break;
              }
              default:
                p.circle(0, 0, shapeSize);
            }

            p.pop();
          }
        });

        p.pop();
      });

      if (p.frameCount % 24 === 0) {
        options.onFrameRate?.(Math.round(p.frameRate()));
      }
    };
  };

  p5Instance = new p5(sketch);

  const applyState = (
    partial: Partial<GeneratorState>,
    options: { recompute?: boolean } = {},
  ) => {
    const { recompute = true } = options;
    state = { ...state, ...partial };
    if (recompute) {
      updateSprite();
    } else {
      notifyState();
    }
  };

  const controller: SpriteController = {
    getState: () => ({ ...state }),
    randomizeAll: () => {
      updateSeed();
      const nextMode =
        spriteModePool[Math.floor(Math.random() * spriteModePool.length)];
      state.spriteMode = nextMode;
      if (nextMode === "icon") {
        state.iconAssetId = getRandomAssetId();
        state.icon = getRandomIcon();
      } else {
        state.icon = shapeIcons[nextMode as ShapeMode];
        state.iconAssetId = resolveIconAssetId(DEFAULT_STATE.iconAssetId);
      }
      state.paletteId = getRandomPalette().id;
      state.scalePercent = randomInt(MIN_DENSITY_PERCENT, 800);
      state.scaleBase = randomInt(35, 80);
      state.scaleSpread = randomInt(30, 95);
      state.paletteVariance = randomInt(12, 88);
      state.motionIntensity = randomInt(15, 90);
      state.motionSpeed = randomInt(20, 85);
      state.layerOpacity = randomInt(40, 82);
      state.blendMode =
        blendModePool[Math.floor(Math.random() * blendModePool.length)];
      state.blendModeAuto = true;
      state.previousBlendMode = state.blendMode;
      state.movementMode =
        movementModes[Math.floor(Math.random() * movementModes.length)];
      state.backgroundMode = "palette";
      updateSprite();
    },
    randomizeIcon: () => {
      updateSeed();
      if (state.spriteMode === "icon") {
        state.iconAssetId = getRandomAssetId();
      } else {
        const nextShape =
          shapeModes[Math.floor(Math.random() * shapeModes.length)];
        state.spriteMode = nextShape;
        state.icon = shapeIcons[nextShape];
      }
      updateSprite();
    },
    randomizeColors: () => {
      updateSeed();
      state.paletteId = getRandomPalette().id;
      state.paletteVariance = randomInt(15, 85);
      updateSprite();
    },
    randomizeScale: () => {
      state.scaleBase = randomInt(35, 80);
      updateSprite();
    },
    randomizeScaleRange: () => {
      state.scaleSpread = randomInt(30, 95);
      updateSprite();
    },
    randomizeMotion: () => {
      state.motionIntensity = randomInt(15, 90);
      state.movementMode =
        movementModes[Math.floor(Math.random() * movementModes.length)];
      state.motionSpeed = randomInt(25, 90);
      updateSprite();
    },
    randomizeBlendMode: () => {
      state.blendModeAuto = false;
      state.blendMode =
        blendModePool[Math.floor(Math.random() * blendModePool.length)];
      state.previousBlendMode = state.blendMode;
      updateSprite();
    },
    setScalePercent: (value: number) => {
      applyState({ scalePercent: clamp(value, 0, MAX_DENSITY_PERCENT_UI) });
    },
    setScaleBase: (value: number) => {
      applyState({ scaleBase: clamp(value, 0, 100) });
    },
    setScaleSpread: (value: number) => {
      applyState({ scaleSpread: clamp(value, 0, 100) });
    },
    setPaletteVariance: (value: number) => {
      applyState({ paletteVariance: clamp(value, 0, 100) });
    },
    setMotionIntensity: (value: number) => {
      applyState({ motionIntensity: clamp(value, 0, 100) });
    },
    setMotionSpeed: (value: number) => {
      applyState({ motionSpeed: clamp(value, 0, 100) }, { recompute: false });
    },
    setBlendMode: (mode: BlendModeOption) => {
      applyState({
        blendModeAuto: false,
        blendMode: mode,
        previousBlendMode: mode,
      });
    },
    setBlendModeAuto: (value: boolean) => {
      if (value) {
        const stored = state.blendModeAuto
          ? state.previousBlendMode
          : state.blendMode;
        applyState({
          blendModeAuto: true,
          previousBlendMode: stored,
        });
      } else {
        const fallback = state.previousBlendMode ?? state.blendMode ?? "NONE";
        applyState({ blendModeAuto: false, blendMode: fallback });
      }
    },
    setLayerOpacity: (value: number) => {
      applyState({ layerOpacity: clamp(value, 15, 100) });
    },
    setSpriteMode: (mode: SpriteMode) => {
      if (mode === "icon") {
        applyState({ spriteMode: mode });
        return;
      }
      if ((shapeModes as readonly string[]).includes(mode)) {
        applyState({ spriteMode: mode, icon: shapeIcons[mode as ShapeMode] });
      }
    },
    setMovementMode: (mode: MovementMode) => {
      if (!movementModes.includes(mode)) {
        return;
      }
      applyState({ movementMode: mode }, { recompute: false });
    },
    setIconAsset: (iconId: string) => {
      const resolved = resolveIconAssetId(iconId);
      applyState({ iconAssetId: resolved });
    },
    setRotationEnabled: (value: boolean) => {
      applyState({ rotationEnabled: value });
    },
    setRotationAmount: (value: number) => {
      applyState({
        rotationAmount: clamp(value, 0, MAX_ROTATION_DEGREES),
        rotationEnabled: true,
      });
    },
    setRotationSpeed: (value: number) => {
      applyState({ rotationSpeed: clamp(value, 0, 100) });
    },
    usePalette: (paletteId: PaletteId) => {
      if (getPalette(paletteId)) {
        applyState({ paletteId });
      }
    },
    setBackgroundMode: (mode: BackgroundMode) => {
      if (!(mode in backgroundPresets)) {
        return;
      }
      applyState({ backgroundMode: mode });
    },
    applySingleTilePreset: () => {
      updateSeed();
      applyState({
        scalePercent: 22,
        scaleBase: 85,
        scaleSpread: 45,
        movementMode: "pulse",
        motionIntensity: 28,
        motionSpeed: 65,
        rotationEnabled: true,
        rotationAmount: 35,
      });
    },
    applyNebulaPreset: () => {
      updateSeed();
      applyState({
        scalePercent: 320,
        scaleBase: 75,
        scaleSpread: 95,
        paletteVariance: 86,
        movementMode: "orbit",
        motionIntensity: 74,
        motionSpeed: 90,
        blendMode: "SCREEN",
        blendModeAuto: false,
        previousBlendMode: "SCREEN",
        layerOpacity: 62,
        rotationEnabled: true,
        rotationAmount: 72,
      });
    },
    applyMinimalGridPreset: () => {
      updateSeed();
      applyState({
        scalePercent: 65,
        scaleBase: 55,
        scaleSpread: 38,
        paletteVariance: 18,
        movementMode: "drift",
        motionIntensity: 20,
        motionSpeed: 45,
        blendMode: "MULTIPLY",
        blendModeAuto: false,
        previousBlendMode: "MULTIPLY",
        layerOpacity: 48,
        rotationEnabled: false,
        rotationAmount: 0,
      });
    },
    reset: () => {
      state = {
        ...DEFAULT_STATE,
        seed: generateSeedString(),
        icon: getRandomIcon(),
        iconAssetId: pixelArtIconIds[0],
        previousBlendMode: DEFAULT_STATE.blendMode,
      };
      updateSprite();
    },
    destroy: () => {
      p5Instance?.remove();
      p5Instance = null;
    },
  };

  notifyState();

  return controller;
};
