import p5 from 'p5'

import type { PixelIcon } from './data/icons'
import { getRandomIcon, pixelIcons } from './data/icons'
import { pixelArtIconAssets, pixelArtIconIds } from './data/pixelartIconAssets'
import iconFont from 'pixelarticons/fonts/pixelart-icons-font.json'
import { defaultPaletteId, getPalette, getRandomPalette, palettes } from './data/palettes'

const GRID_SIZE = 8
const ICON_BASE_SIZE = 24

const iconGlyphs = iconFont as Record<string, string[]>

const movementModes = [
  'sway',
  'pulse',
  'orbit',
  'drift',
  'ripple',
  'zigzag',
  'cascade',
  'spiral',
  'comet',
  'wavefront',
] as const

export type MovementMode = (typeof movementModes)[number]

type PaletteId = (typeof palettes)[number]['id']

type BlendModeKey = 'NONE' | 'MULTIPLY' | 'SCREEN' | 'HARD_LIGHT' | 'OVERLAY'
export type BlendModeOption = BlendModeKey

export type BackgroundMode = 'palette' | 'midnight' | 'charcoal' | 'dusk' | 'dawn' | 'nebula'

const backgroundPresets: Record<BackgroundMode, string | null> = {
  palette: null,
  midnight: '#050509',
  charcoal: '#15151f',
  dusk: '#1f1b3b',
  dawn: '#fbe8c8',
  nebula: '#121835',
}

export type SpriteMode =
  | 'pixel-glass'
  | 'circle'
  | 'square'
  | 'triangle'
  | 'hexagon'
  | 'ring'
  | 'diamond'
  | 'star'
  | 'line'
  | 'icon'

interface PixelTile {
  kind: 'pixels'
  colors: string[]
  u: number
  v: number
  scale: number
  blendMode: BlendModeKey
}

interface IconTile {
  kind: 'icon'
  iconId: string
  tint: string
  u: number
  v: number
  scale: number
  blendMode: BlendModeKey
}

interface ShapeTile {
  kind: 'shape'
  shape: ShapeMode
  tint: string
  u: number
  v: number
  scale: number
  blendMode: BlendModeKey
}

type PreparedTile = PixelTile | IconTile | ShapeTile

interface PreparedLayer {
  tiles: PreparedTile[]
  tileCount: number
  blendMode: BlendModeKey
  opacity: number
}

interface PreparedSprite {
  layers: PreparedLayer[]
  background: string
}

export interface GeneratorState {
  seed: string
  icon: PixelIcon
  paletteId: string
  paletteVariance: number
  scalePercent: number
  scaleBase: number
  scaleSpread: number
  motionIntensity: number
  blendMode: BlendModeKey
  blendModeAuto: boolean
  previousBlendMode: BlendModeKey
  layerOpacity: number
  spriteMode: SpriteMode
  iconAssetId: string
  clusterAmount: number
  clusterSeed: string
  movementMode: MovementMode
  backgroundMode: BackgroundMode
  motionSpeed: number
}

export interface SpriteControllerOptions {
  onStateChange?: (state: GeneratorState) => void
  onFrameRate?: (fps: number) => void
}

const shapeModes = ['circle', 'square', 'triangle', 'hexagon', 'ring', 'diamond', 'star', 'line'] as const

type ShapeMode = (typeof shapeModes)[number]

const shapeIcons: Record<ShapeMode, PixelIcon> = {
  circle: {
    id: 'shape-circle',
    name: 'Circle',
    grid: ['00011000', '00111100', '01111110', '11111111', '11111111', '01111110', '00111100', '00011000'],
  },
  square: {
    id: 'shape-square',
    name: 'Square',
    grid: ['01111110', '11111111', '11111111', '11111111', '11111111', '11111111', '11111111', '01111110'],
  },
  triangle: {
    id: 'shape-triangle',
    name: 'Triangle',
    grid: ['00001000', '00011000', '00111100', '01111110', '11111111', '11111111', '11111111', '11111111'],
  },
  hexagon: {
    id: 'shape-hexagon',
    name: 'Hexagon',
    grid: ['00011000', '00111100', '01111110', '11111111', '11111111', '01111110', '00111100', '00011000'],
  },
  ring: {
    id: 'shape-ring',
    name: 'Ring',
    grid: ['00111100', '01100110', '11000011', '10000001', '10000001', '11000011', '01100110', '00111100'],
  },
  diamond: {
    id: 'shape-diamond',
    name: 'Diamond',
    grid: ['00001000', '00011100', '00111110', '01111111', '00111110', '00011100', '00001000', '00000000'],
  },
  star: {
    id: 'shape-star',
    name: 'Star',
    grid: ['00001000', '01011100', '01111110', '11111111', '01111110', '01011100', '00001000', '00000000'],
  },
  line: {
    id: 'shape-line',
    name: 'Line',
    grid: ['00000000', '11111111', '11111111', '11111111', '11111111', '11111111', '00000000', '00000000'],
  },
}

export const DEFAULT_STATE: GeneratorState = {
  seed: 'DEADBEEF',
  icon: pixelIcons[0],
  paletteId: defaultPaletteId,
  paletteVariance: 50,
  scalePercent: 80,
  scaleBase: 110,
  scaleSpread: 140,
  motionIntensity: 48,
  blendMode: 'NONE',
  blendModeAuto: true,
  previousBlendMode: 'NONE',
  layerOpacity: 68,
  spriteMode: 'pixel-glass',
  iconAssetId: pixelArtIconIds[0],
  clusterAmount: 75,
  clusterSeed: 'CAFEBABE',
  movementMode: 'sway',
  backgroundMode: 'palette',
  motionSpeed: 100,
}

const SEED_ALPHABET = '0123456789ABCDEF'

const generateSeedString = () =>
  Array.from({ length: 8 }, () => SEED_ALPHABET[Math.floor(Math.random() * SEED_ALPHABET.length)]).join('')

const createMulberry32 = (seed: number) => {
  let t = seed >>> 0
  return () => {
    t += 0x6d2b79f5
    let r = Math.imul(t ^ (t >>> 15), 1 | t)
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r)
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

const hashSeed = (seed: string) => {
  let h = 1779033703 ^ seed.length
  for (let i = 0; i < seed.length; i += 1) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507)
  h ^= h >>> 13
  h = Math.imul(h, 3266489909)
  return h ^ (h >>> 16)
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

const hexToHsl = (hex: string): [number, number, number] => {
  const sanitized = hex.replace('#', '')
  const bigint = parseInt(sanitized, 16)
  const r = ((bigint >> 16) & 255) / 255
  const g = ((bigint >> 8) & 255) / 255
  const b = (bigint & 255) / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0)
        break
      case g:
        h = (b - r) / d + 2
        break
      default:
        h = (r - g) / d + 4
    }
    h /= 6
  }

  return [h * 360, s * 100, l * 100]
}

const hueToRgb = (p: number, q: number, t: number) => {
  if (t < 0) t += 1
  if (t > 1) t -= 1
  if (t < 1 / 6) return p + (q - p) * 6 * t
  if (t < 1 / 2) return q
  if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
  return p
}

const hslToHex = (h: number, s: number, l: number) => {
  h = ((h % 360) + 360) % 360
  s = clamp(s, 0, 100)
  l = clamp(l, 0, 100)

  const sat = s / 100
  const light = l / 100

  if (sat === 0) {
    const gray = Math.round(light * 255)
    return `#${gray.toString(16).padStart(2, '0').repeat(3)}`
  }

  const q = light < 0.5 ? light * (1 + sat) : light + sat - light * sat
  const p = 2 * light - q
  const r = Math.round(hueToRgb(p, q, h / 360 + 1 / 3) * 255)
  const g = Math.round(hueToRgb(p, q, h / 360) * 255)
  const b = Math.round(hueToRgb(p, q, h / 360 - 1 / 3) * 255)

  return `#${[r, g, b]
    .map((value) => value.toString(16).padStart(2, '0'))
    .join('')}`
}

const jitterColor = (hex: string, variance: number, random: () => number) => {
  const [h, s, l] = hexToHsl(hex)
  const hueShift = (random() - 0.5) * variance * 60
  const satShift = (random() - 0.5) * variance * 50
  const lightShift = (random() - 0.5) * variance * 40
  return hslToHex(h + hueShift, s + satShift, l + lightShift)
}

const blendModePool: BlendModeKey[] = ['NONE', 'MULTIPLY', 'SCREEN', 'HARD_LIGHT', 'OVERLAY']

const resolveIconAssetId = (id: string | undefined) =>
  id && pixelArtIconIds.includes(id) ? id : pixelArtIconIds[0]

const getRandomAssetId = () => pixelArtIconIds[Math.floor(Math.random() * pixelArtIconIds.length)]

const getPixelIconForMode = (mode: SpriteMode, fallback: PixelIcon): PixelIcon => {
  if ((shapeModes as readonly string[]).includes(mode)) {
    return shapeIcons[mode as ShapeMode]
  }
  return fallback
}

const computeMovementOffsets = (
  mode: MovementMode,
  data: {
    time: number
    phase: number
    motionScale: number
    layerIndex: number
    baseUnit: number
    layerTileSize: number
    speedFactor: number
  },
): { offsetX: number; offsetY: number; scaleMultiplier: number } => {
  const { time, phase, motionScale, layerIndex, baseUnit, layerTileSize, speedFactor } = data
  const layerFactor = 1 + layerIndex * 0.12
  const velocity = Math.max(speedFactor, 0)
  const baseTime = velocity === 0 ? 0 : time * velocity
  const phased = baseTime + phase
  const clampScale = (value: number) => Math.max(0.35, value)

  switch (mode) {
    case 'pulse': {
      const pulse = Math.sin(phased * 0.08) * motionScale
      const scaleMultiplier = clampScale(1 + pulse * 0.55)
      const offsetY = Math.sin(phased * 0.04) * baseUnit * motionScale * 0.25 * layerFactor
      return { offsetX: 0, offsetY, scaleMultiplier }
    }
    case 'orbit': {
      const radius = layerTileSize * 0.12 * motionScale * layerFactor
      const angle = phased * (0.05 + layerIndex * 0.01)
      const offsetX = Math.cos(angle) * radius
      const offsetY = Math.sin(angle) * radius
      return { offsetX, offsetY, scaleMultiplier: 1 }
    }
    case 'drift': {
      const offsetX =
        Math.cos(phased * 0.02 + phase * 0.45) * layerTileSize * 0.08 * motionScale
      const offsetY =
        Math.sin(phased * 0.018 + phase * 0.3) * layerTileSize * 0.06 * motionScale
      return { offsetX, offsetY, scaleMultiplier: clampScale(1 + Math.sin(phase) * motionScale * 0.15) }
    }
    case 'ripple': {
      const wave = Math.sin(phased * 0.04 + layerIndex * 0.6)
      const radius = baseUnit * (0.6 + motionScale * 0.9)
      const offsetX = Math.cos(phase * 1.2 + phased * 0.015) * radius * wave * 0.35
      const offsetY = Math.sin(phase * 1.35 + phased * 0.02) * radius * wave * 0.35
      const scaleMultiplier = clampScale(1 + wave * motionScale * 0.4)
      return { offsetX, offsetY, scaleMultiplier }
    }
    case 'zigzag': {
      const zig = phased * 0.06 + layerIndex * 0.25
      const tri = (2 / Math.PI) * Math.asin(Math.sin(zig))
      const sweep = Math.sin(zig * 1.35)
      const offsetX = tri * layerTileSize * 0.35 * motionScale + sweep * baseUnit * 0.2 * motionScale
      const offsetY = Math.sin(zig * 0.9 + layerIndex * 0.4 + phase * 0.4) * layerTileSize * 0.22 * motionScale
      const scaleMultiplier = clampScale(1 + Math.cos(zig * 1.1) * 0.18 * motionScale)
      return { offsetX, offsetY, scaleMultiplier }
    }
    case 'cascade': {
      const cascadeTime = phased * 0.045 + layerIndex * 0.2
      const wave = Math.sin(cascadeTime)
      const drift = (1 - Math.cos(cascadeTime)) * 0.5
      const offsetY = (drift * 2 - 1) * layerTileSize * 0.4 * (1 + layerIndex * 0.12) * motionScale
      const offsetX = wave * baseUnit * 0.3 * motionScale
      const scaleMultiplier = clampScale(1 + Math.sin(cascadeTime * 1.2 + phase * 0.25) * 0.16 * motionScale)
      return { offsetX, offsetY, scaleMultiplier }
    }
    case 'spiral': {
      const radius = baseUnit * (0.8 + layerIndex * 0.25 + motionScale * 1.8)
      const angle = phased * (0.04 + layerIndex * 0.02)
      const spiralFactor = 1 + Math.sin(angle * 0.5) * 0.4
      const offsetX = Math.cos(angle) * radius * spiralFactor
      const offsetY = Math.sin(angle) * radius * spiralFactor
      const scaleMultiplier = clampScale(1 + Math.cos(angle * 0.7) * motionScale * 0.25)
      return { offsetX, offsetY, scaleMultiplier }
    }
    case 'comet': {
      const pathLength = layerTileSize * (1.2 + layerIndex * 0.35 + motionScale * 1.6)
      const travel = phased * (0.035 + layerIndex * 0.01)
      const orbital = travel + phase
      const tail = (Math.sin(travel * 0.9 + phase * 0.6) + 1) * 0.5
      const offsetX = Math.cos(orbital) * pathLength
      const offsetY = Math.sin(orbital * 0.75) * pathLength * 0.48
      const scaleMultiplier = clampScale(0.65 + tail * motionScale * 0.55)
      return { offsetX, offsetY, scaleMultiplier }
    }
    case 'wavefront': {
      const travel = phased * 0.055
      const waveRadius = layerTileSize * (motionScale * 2.4 + 1.6 + layerIndex * 0.25)
      const offsetX = Math.cos(travel + phase * 0.25) * waveRadius
      const offsetY = Math.sin(travel * 0.65 + layerIndex * 0.3 + phase * 0.15) * waveRadius * 0.75
      const breathing = 1 + Math.sin(travel * 0.5) * motionScale * 0.35
      const scaleMultiplier = clampScale(breathing)
      return { offsetX, offsetY, scaleMultiplier }
    }
    case 'sway':
    default: {
      const offsetX = Math.sin(phased * 0.13) * baseUnit * motionScale * 0.45
      const offsetY =
        Math.sin((phased + phase * 0.5) * 0.07 + layerIndex * 0.4) * baseUnit * motionScale * 0.6
      return { offsetX, offsetY, scaleMultiplier: 1 }
    }
  }
}

const computeSprite = (state: GeneratorState): PreparedSprite => {
  const rng = createMulberry32(hashSeed(state.seed))
  const palette = getPalette(state.paletteId)
  const variance = clamp(state.paletteVariance / 100, 0, 1)

  const colorRng = createMulberry32(hashSeed(state.seed))
  const positionRng = createMulberry32(hashSeed(state.clusterSeed || state.seed))
  const chosenPalette = palette.colors.map((color) => jitterColor(color, variance, colorRng))
  const backgroundBase = palette.colors[0]
  const presetBackground = backgroundPresets[state.backgroundMode]
  const background =
    presetBackground === null
      ? jitterColor(backgroundBase, variance * 0.5, colorRng)
      : presetBackground

  const densityValue = clamp(state.scalePercent, 20, 400)
  const densityT = (densityValue - 20) / (400 - 20)
  const baseScaleFactor = clamp(state.scaleBase / 100, 0.2, 4)
  const rangeFactor = clamp(state.scaleSpread / 100, 0, 3)
  const clusterRatio = clamp(state.clusterAmount / 100, 0, 1)
  const baseIconId = resolveIconAssetId(state.iconAssetId)
  const isIconMode = state.spriteMode === 'icon'
  const isShapeMode = shapeModes.includes(state.spriteMode as ShapeMode)
  const isPixelMode = state.spriteMode === 'pixel-glass'
  const basePixelIcon = getPixelIconForMode(state.spriteMode, state.icon)
  const isGlassMode = state.spriteMode === 'pixel-glass'

  const layers: PreparedLayer[] = []
  const opacityBase = clamp(state.layerOpacity / 100, 0.12, 1)
  const layerCount = 3

  for (let layerIndex = 0; layerIndex < layerCount; layerIndex += 1) {
    const pixelTileMin = 1
    const pixelTileMax = 9
    const iconTileMin = 1
    const iconTileMax = 6
    const shapeTileMin = 2
    const shapeTileMax = 10

    let baseTileCount: number
    if (isPixelMode) {
      const pixelTarget = pixelTileMin + densityT * (pixelTileMax - pixelTileMin)
      baseTileCount = Math.max(1, Math.round(1 + clusterRatio * (pixelTarget - 1)))
    } else if (isIconMode) {
      baseTileCount = Math.round(iconTileMin + densityT * (iconTileMax - iconTileMin))
    } else {
      baseTileCount = Math.round(shapeTileMin + densityT * (shapeTileMax - shapeTileMin))
    }

    const densityBoost = 1 + layerIndex * (isPixelMode ? 0.35 : isIconMode ? 0.25 : 0.3)
    const maxTileCount = isPixelMode ? pixelTileMax : isIconMode ? iconTileMax : shapeTileMax
    const tileCount = Math.max(1, Math.min(Math.round(baseTileCount * densityBoost), maxTileCount))
    const skipProbability = isIconMode
      ? clamp(0.4 - densityT * 0.3 + layerIndex * 0.12, 0, 0.6)
      : 0
    const layerBlendMode: BlendModeKey = state.blendModeAuto
      ? blendModePool[Math.floor(Math.random() * blendModePool.length)] ?? 'NONE'
      : state.blendMode
    const opacity = clamp(opacityBase + (rng() - 0.5) * 0.35, 0.12, 0.95)
    const tiles: PreparedTile[] = []

    for (let index = 0; index < tileCount * tileCount; index += 1) {
      const col = index % tileCount
      const row = Math.floor(index / tileCount)
      const jitterX = (positionRng() - 0.5) * 0.65
      const jitterY = (positionRng() - 0.5) * 0.65
      const u = (col + 0.5 + jitterX) / tileCount
      const v = (row + 0.5 + jitterY) / tileCount

      if (isIconMode && layerIndex > 0 && positionRng() < skipProbability) {
        continue
      }

      if (isPixelMode) {
        const primaryPixelIcon = basePixelIcon ?? state.icon
        const sourceIcon = isGlassMode
          ? layerIndex === 0 && index === 0
            ? primaryPixelIcon
            : getRandomIcon()
          : primaryPixelIcon
        const colors: string[] = []
        sourceIcon.grid.forEach((gridRow) => {
          gridRow.split('').forEach((cell) => {
            if (cell === '1') {
              const color = chosenPalette[Math.floor(colorRng() * chosenPalette.length)]
              colors.push(color)
            } else {
              colors.push('transparent')
            }
          })
        })
        const layerModifier = layerIndex === 0 ? 1.2 : 0.8 + layerIndex * 0.25
        const baseScale = baseScaleFactor * layerModifier
        const amplitude = rangeFactor * baseScale
        const minScale = clamp(baseScale - amplitude / 2, 0.12, 6)
        const maxScale = clamp(baseScale + amplitude / 2, minScale + 0.05, 6.5)
        const scale = clamp(minScale + positionRng() * (maxScale - minScale), 0.12, 6.5)
        const tileBlend = state.blendModeAuto
          ? blendModePool[Math.floor(rng() * blendModePool.length)]
          : state.blendMode
        tiles.push({ kind: 'pixels', colors, u, v, scale, blendMode: tileBlend })
      } else if (isIconMode) {
        const iconId = baseIconId
        const tint = chosenPalette[Math.floor(colorRng() * chosenPalette.length)]
        const layerModifier = layerIndex === 0 ? 1.4 : 1 + layerIndex * 0.3
        const baseScale = baseScaleFactor * layerModifier
        const amplitude = rangeFactor * baseScale * 1.1
        const minScale = clamp(baseScale - amplitude / 2, 0.2, 7)
        const maxScale = clamp(baseScale + amplitude / 2, minScale + 0.05, 7.5)
        const scale = clamp(minScale + positionRng() * (maxScale - minScale), 0.2, 7.5)
        const tileBlend = state.blendModeAuto
          ? blendModePool[Math.floor(rng() * blendModePool.length)]
          : state.blendMode
        tiles.push({ kind: 'icon', iconId, tint, u, v, scale, blendMode: tileBlend })
      } else if (isShapeMode) {
        const tint = chosenPalette[Math.floor(colorRng() * chosenPalette.length)]
        const layerModifier = layerIndex === 0 ? 1.5 : 1.1 + layerIndex * 0.35
        const baseScale = baseScaleFactor * layerModifier
        const amplitude = rangeFactor * baseScale * 1.2
        const minScale = clamp(baseScale - amplitude / 2, 0.25, 8)
        const maxScale = clamp(baseScale + amplitude / 2, minScale + 0.05, 8.5)
        const scale = clamp(minScale + positionRng() * (maxScale - minScale), 0.25, 8.5)
        const tileBlend = state.blendModeAuto
          ? blendModePool[Math.floor(rng() * blendModePool.length)]
          : state.blendMode
        tiles.push({ kind: 'shape', shape: state.spriteMode as ShapeMode, tint, u, v, scale, blendMode: tileBlend })
      }
    }

    layers.push({ tiles, tileCount, blendMode: layerBlendMode, opacity })
  }

  return { layers, background }
}

export interface SpriteController {
  getState: () => GeneratorState
  randomizeAll: () => void
  randomizeIcon: () => void
  randomizeColors: () => void
  randomizeScale: () => void
  randomizeScaleRange: () => void
  randomizeMotion: () => void
  randomizeBlendMode: () => void
  setScalePercent: (value: number) => void
  setScaleBase: (value: number) => void
  setScaleSpread: (value: number) => void
  setPaletteVariance: (value: number) => void
  setMotionIntensity: (value: number) => void
  setMotionSpeed: (value: number) => void
  setBlendMode: (mode: BlendModeOption) => void
  setBlendModeAuto: (value: boolean) => void
  setLayerOpacity: (value: number) => void
  setSpriteMode: (mode: SpriteMode) => void
  setMovementMode: (mode: MovementMode) => void
  setIconAsset: (iconId: string) => void
  setClusterAmount: (value: number) => void
  randomizeCluster: () => void
  applySingleTilePreset: () => void
  applyNebulaPreset: () => void
  applyMinimalGridPreset: () => void
  usePalette: (paletteId: PaletteId) => void
  setBackgroundMode: (mode: BackgroundMode) => void
  reset: () => void
  destroy: () => void
}

export const createSpriteController = (
  container: HTMLElement,
  options: SpriteControllerOptions = {},
): SpriteController => {
  let state: GeneratorState = {
    ...DEFAULT_STATE,
    icon: getRandomIcon(),
    iconAssetId: resolveIconAssetId(DEFAULT_STATE.iconAssetId),
    clusterSeed: generateSeedString(),
    previousBlendMode: DEFAULT_STATE.blendMode,
  }
  let prepared = computeSprite(state)
  let p5Instance: p5 | null = null
  const iconGraphics: Record<string, p5.Graphics | null> = Object.fromEntries(
    pixelArtIconAssets.map(({ id }) => [id, null]),
  )

  const notifyState = () => {
    options.onStateChange?.({ ...state })
  }

  const updateSprite = () => {
    prepared = computeSprite(state)
    notifyState()
  }

  const updateSeed = (seed?: string) => {
    state.seed = seed ?? generateSeedString()
  }

  const sketch = (p: p5) => {
    let canvas: p5.Renderer
    let animationTime = 0

    p.setup = () => {
      const size = container.clientWidth || 640
      canvas = p.createCanvas(size, size)
      canvas.parent(container)
      p.pixelDensity(1)
      p.noStroke()
      p.noSmooth()
      p.imageMode(p.CENTER)

      if (typeof Path2D !== 'undefined') {
        pixelArtIconAssets.forEach(({ id }) => {
          const paths = iconGlyphs[id]
          if (!paths || iconGraphics[id]) {
            return
          }
          const graphics = p.createGraphics(ICON_BASE_SIZE, ICON_BASE_SIZE)
          graphics.pixelDensity(1)
          const ctx = graphics.drawingContext as CanvasRenderingContext2D
          ctx.clearRect(0, 0, ICON_BASE_SIZE, ICON_BASE_SIZE)
          ctx.imageSmoothingEnabled = false
          ctx.fillStyle = '#ffffff'
          paths.forEach((path) => {
            try {
              const shape = new Path2D(path)
              ctx.fill(shape)
            } catch (error) {
              console.warn(`Failed to render pixel icon path for ${id}`, error)
            }
          })
          iconGraphics[id] = graphics
        })
      }
    }

    p.windowResized = () => {
      const size = container.clientWidth || 640
      p.resizeCanvas(size, size)
    }

    p.draw = () => {
      const gridCount = GRID_SIZE
      const drawSize = Math.min(p.width, p.height)
      const offsetX = (p.width - drawSize) / 2
      const offsetY = (p.height - drawSize) / 2
      const motionScale = clamp(state.motionIntensity / 100, 0, 1.5)
      const deltaMs = typeof p.deltaTime === 'number' ? p.deltaTime : 16.666
      const speedFactor = Math.max(state.motionSpeed / 100, 0)
      animationTime += speedFactor * (deltaMs / 16.666)
      const globalTime = animationTime
      const baseIconId = resolveIconAssetId(state.iconAssetId)

      p.background(prepared.background)
      const ctx = p.drawingContext as CanvasRenderingContext2D
      ctx.imageSmoothingEnabled = false

  const blendMap: Record<BlendModeKey, p5.BLEND_MODE> = {
    NONE: p.BLEND,
        MULTIPLY: p.MULTIPLY,
        SCREEN: p.SCREEN,
        HARD_LIGHT: p.HARD_LIGHT ?? p.OVERLAY,
        OVERLAY: p.OVERLAY,
      }

      prepared.layers.forEach((layer, layerIndex) => {
        if (layer.tiles.length === 0) {
          return
        }
        const tileDivisor = Math.max(layer.tileCount, 1)
        const layerTileSize = drawSize / tileDivisor
        const pixelSize = layerTileSize / gridCount

        p.push()
        layer.tiles.forEach((tile, tileIndex) => {
          const tileBlendMode = tile.blendMode ?? layer.blendMode
          p.blendMode(blendMap[tileBlendMode] ?? p.BLEND)
          const normalizedU = ((tile.u % 1) + 1) % 1
          const normalizedV = ((tile.v % 1) + 1) % 1
          const baseX = offsetX + normalizedU * drawSize
          const baseY = offsetY + normalizedV * drawSize

          if (tile.kind === 'pixels') {
            const tileScale = tile.scale * (1 + layerIndex * 0.1)
            const baseRenderPixel = pixelSize * tileScale
            let colorIndex = 0

            for (let y = 0; y < gridCount; y += 1) {
              for (let x = 0; x < gridCount; x += 1) {
                const color = tile.colors[colorIndex]
                if (color !== 'transparent') {
                  const phase = tileIndex * 13 + colorIndex * 1.4
                  const movement = computeMovementOffsets(state.movementMode, {
                    time: globalTime,
                    phase,
                    motionScale,
                    layerIndex,
                    baseUnit: baseRenderPixel,
                    layerTileSize,
                    speedFactor,
                  })
                  const localJitter = Math.sin((p.frameCount + colorIndex * 1.7 + tileIndex * 5) * 0.11) *
                    baseRenderPixel * motionScale * 0.18
                  const renderPixel = baseRenderPixel * movement.scaleMultiplier
                  const offsetXLocal = movement.offsetX + localJitter - (gridCount * renderPixel) / 2
                  const offsetYLocal = movement.offsetY - (gridCount * renderPixel) / 2
                  const fillColor = p.color(color)
                  fillColor.setAlpha(Math.round(layer.opacity * 255))
                  p.fill(fillColor)
                  p.rect(
                    baseX + x * renderPixel + offsetXLocal,
                    baseY + y * renderPixel + offsetYLocal,
                    renderPixel,
                    renderPixel,
                    renderPixel * 0.22,
                  )
                }
                colorIndex += 1
              }
            }
          } else if (tile.kind === 'icon') {
            const iconGraphic = iconGraphics[tile.iconId] ?? iconGraphics[baseIconId]
            if (!iconGraphic) {
              return
            }
            const baseIconSize = layerTileSize * tile.scale * (1 + layerIndex * 0.08)
            const movement = computeMovementOffsets(state.movementMode, {
              time: globalTime,
              phase: tileIndex * 9,
              motionScale,
              layerIndex,
              baseUnit: baseIconSize,
              layerTileSize,
              speedFactor,
            })
            const iconSize = baseIconSize * movement.scaleMultiplier

            p.push()
            p.tint(tile.tint)
            p.image(iconGraphic, baseX + movement.offsetX, baseY + movement.offsetY, iconSize, iconSize)
            p.pop()
          } else if (tile.kind === 'shape') {
            const baseShapeSize = layerTileSize * tile.scale * (1 + layerIndex * 0.08)
            const movement = computeMovementOffsets(state.movementMode, {
              time: globalTime,
              phase: tileIndex * 7,
              motionScale,
              layerIndex,
              baseUnit: baseShapeSize,
              layerTileSize,
              speedFactor,
            })
            const shapeSize = baseShapeSize * movement.scaleMultiplier
            const fillColor = p.color(tile.tint)
            fillColor.setAlpha(Math.round(layer.opacity * 255))

            p.push()
            p.translate(baseX + movement.offsetX, baseY + movement.offsetY)
            p.noStroke()
            p.fill(fillColor)

            const halfSize = shapeSize / 2
            switch (tile.shape) {
              case 'circle':
                p.circle(0, 0, shapeSize)
                break
              case 'square':
                p.rectMode(p.CENTER)
                p.rect(0, 0, shapeSize, shapeSize)
                break
              case 'triangle': {
                const height = (Math.sqrt(3) / 2) * shapeSize
                const yOffset = height / 3
                p.triangle(
                  -halfSize,
                  yOffset,
                  halfSize,
                  yOffset,
                  0,
                  yOffset - height,
                )
                break
              }
              case 'hexagon': {
                const radius = halfSize
                p.beginShape()
                for (let k = 0; k < 6; k += 1) {
                  const angle = p.TWO_PI * (k / 6) - p.HALF_PI
                  p.vertex(Math.cos(angle) * radius, Math.sin(angle) * radius)
                }
                p.endShape(p.CLOSE)
                break
              }
              case 'ring': {
                const strokeWeight = Math.max(1.5, shapeSize * 0.18)
                const wobble = Math.sin((tileIndex + p.frameCount) * 0.03 + layerIndex) * 0.35
                p.noFill()
                p.stroke(fillColor)
                p.strokeWeight(strokeWeight)
                p.rotate(wobble)
                p.circle(0, 0, shapeSize)
                p.noStroke()
                break
              }
              case 'diamond': {
                p.beginShape()
                p.vertex(0, -halfSize)
                p.vertex(halfSize, 0)
                p.vertex(0, halfSize)
                p.vertex(-halfSize, 0)
                p.endShape(p.CLOSE)
                break
              }
              case 'star': {
                const outer = halfSize
                const inner = outer * 0.45
                p.beginShape()
                for (let k = 0; k < 10; k += 1) {
                  const angle = p.TWO_PI * (k / 10) - p.HALF_PI
                  const radius = k % 2 === 0 ? outer : inner
                  p.vertex(Math.cos(angle) * radius, Math.sin(angle) * radius)
                }
                p.endShape(p.CLOSE)
                break
              }
              case 'line': {
                const angle = Math.sin((tileIndex + p.frameCount) * 0.06 + layerIndex) * p.PI
                const strokeWeight = Math.max(1.5, shapeSize * 0.22)
                p.noFill()
                p.stroke(fillColor)
                p.strokeCap(p.ROUND)
                p.strokeWeight(strokeWeight)
                p.rotate(angle)
                p.line(-halfSize, 0, halfSize, 0)
                p.noStroke()
                break
              }
              default:
                p.circle(0, 0, shapeSize)
            }

            p.pop()
          }
        })

        p.pop()
      })

      if (p.frameCount % 24 === 0) {
        options.onFrameRate?.(Math.round(p.frameRate()))
      }
    }
  }

  p5Instance = new p5(sketch)

  const applyState = (partial: Partial<GeneratorState>, options: { recompute?: boolean } = {}) => {
    const { recompute = true } = options
    state = { ...state, ...partial }
    if (recompute) {
      updateSprite()
    } else {
      notifyState()
    }
  }

  const controller: SpriteController = {
    getState: () => ({ ...state }),
    randomizeAll: () => {
      updateSeed()
      state.icon = getRandomIcon()
      state.iconAssetId = getRandomAssetId()
      state.paletteId = getRandomPalette().id
      state.scalePercent = 20 + Math.floor(Math.random() * 380)
      state.scaleBase = 70 + Math.floor(Math.random() * 150)
      state.scaleSpread = 40 + Math.floor(Math.random() * 220)
      state.paletteVariance = Math.floor(Math.random() * 100)
      state.motionIntensity = Math.floor(Math.random() * 100)
      state.motionSpeed = 60 + Math.floor(Math.random() * 141)
      state.layerOpacity = 35 + Math.floor(Math.random() * 55)
      state.blendMode = blendModePool[Math.floor(Math.random() * blendModePool.length)]
      state.blendModeAuto = true
      state.previousBlendMode = state.blendMode
      state.movementMode = movementModes[Math.floor(Math.random() * movementModes.length)]
      state.clusterAmount = Math.floor(Math.random() * 101)
      state.clusterSeed = generateSeedString()
      state.backgroundMode = 'palette'
      updateSprite()
    },
    randomizeIcon: () => {
      updateSeed()
      if (state.spriteMode === 'pixel-glass') {
        state.icon = getRandomIcon()
      } else if (state.spriteMode === 'icon') {
        state.iconAssetId = getRandomAssetId()
      }
      updateSprite()
    },
    randomizeColors: () => {
      updateSeed()
      state.paletteId = getRandomPalette().id
      state.paletteVariance = Math.floor(Math.random() * 100)
      updateSprite()
    },
    randomizeScale: () => {
      state.scaleBase = 70 + Math.floor(Math.random() * 150)
      updateSprite()
    },
    randomizeScaleRange: () => {
      state.scaleSpread = 40 + Math.floor(Math.random() * 220)
      updateSprite()
    },
    randomizeMotion: () => {
      state.motionIntensity = Math.floor(Math.random() * 100)
      state.movementMode = movementModes[Math.floor(Math.random() * movementModes.length)]
      state.motionSpeed = 60 + Math.floor(Math.random() * 141)
      updateSprite()
    },
    randomizeBlendMode: () => {
      state.blendModeAuto = false
      state.blendMode = blendModePool[Math.floor(Math.random() * blendModePool.length)]
      state.previousBlendMode = state.blendMode
      updateSprite()
    },
    setScalePercent: (value: number) => {
      applyState({ scalePercent: clamp(value, 20, 400) })
    },
    setScaleBase: (value: number) => {
      applyState({ scaleBase: clamp(value, 40, 220) })
    },
    setScaleSpread: (value: number) => {
      applyState({ scaleSpread: clamp(value, 30, 360) })
    },
    setPaletteVariance: (value: number) => {
      applyState({ paletteVariance: clamp(value, 0, 100) })
    },
    setMotionIntensity: (value: number) => {
      applyState({ motionIntensity: clamp(value, 0, 100) })
    },
    setMotionSpeed: (value: number) => {
      applyState({ motionSpeed: clamp(value, 0, 300) }, { recompute: false })
    },
    setBlendMode: (mode: BlendModeOption) => {
      applyState({ blendModeAuto: false, blendMode: mode, previousBlendMode: mode })
    },
    setBlendModeAuto: (value: boolean) => {
      if (value) {
        const stored = state.blendModeAuto ? state.previousBlendMode : state.blendMode
        applyState({
          blendModeAuto: true,
          previousBlendMode: stored,
        })
      } else {
        const fallback = state.previousBlendMode ?? state.blendMode ?? 'NONE'
        applyState({ blendModeAuto: false, blendMode: fallback })
      }
    },
    setLayerOpacity: (value: number) => {
      applyState({ layerOpacity: clamp(value, 15, 100) })
    },
    setSpriteMode: (mode: SpriteMode) => {
      if (mode === 'icon') {
        applyState({ spriteMode: mode })
        return
      }
      if (mode === 'pixel-glass') {
        applyState({ spriteMode: mode, icon: getRandomIcon() })
        return
      }
      if ((shapeModes as readonly string[]).includes(mode)) {
        applyState({ spriteMode: mode, icon: shapeIcons[mode as ShapeMode] })
      }
    },
    setMovementMode: (mode: MovementMode) => {
      if (!movementModes.includes(mode)) {
        return
      }
      applyState({ movementMode: mode }, { recompute: false })
    },
    setIconAsset: (iconId: string) => {
      const resolved = resolveIconAssetId(iconId)
      applyState({ iconAssetId: resolved })
    },
    setClusterAmount: (value: number) => {
      applyState({ clusterAmount: clamp(value, 0, 100) })
    },
    setBackgroundMode: (mode: BackgroundMode) => {
      if (!(mode in backgroundPresets)) {
        return
      }
      applyState({ backgroundMode: mode })
    },
    randomizeCluster: () => {
      const previousManual = state.blendModeAuto ? state.previousBlendMode ?? state.blendMode : state.blendMode
      const nextBlend = blendModePool[Math.floor(Math.random() * blendModePool.length)]
      const nextAuto = Math.random() > 0.35
      applyState({
        clusterSeed: generateSeedString(),
        clusterAmount: Math.floor(Math.random() * 101),
        scalePercent: 20 + Math.floor(Math.random() * 380),
        movementMode: movementModes[Math.floor(Math.random() * movementModes.length)],
        paletteVariance: Math.floor(Math.random() * 101),
        blendMode: nextBlend,
        blendModeAuto: nextAuto,
        previousBlendMode: nextAuto ? previousManual : nextBlend,
        layerOpacity: 30 + Math.floor(Math.random() * 61),
        motionSpeed: 60 + Math.floor(Math.random() * 141),
      })
    },
    applySingleTilePreset: () => {
      applyState({
        clusterSeed: generateSeedString(),
        clusterAmount: 0,
        scalePercent: 22,
        scaleBase: 185,
        scaleSpread: 55,
        movementMode: 'pulse',
        motionIntensity: 28,
        motionSpeed: 90,
      })
    },
    applyNebulaPreset: () => {
      applyState({
        clusterSeed: generateSeedString(),
        clusterAmount: 100,
        scalePercent: 320,
        scaleBase: 140,
        scaleSpread: 280,
        paletteVariance: 86,
        movementMode: 'orbit',
        motionIntensity: 74,
        motionSpeed: 130,
        blendMode: 'SCREEN',
        blendModeAuto: false,
        previousBlendMode: 'SCREEN',
        layerOpacity: 62,
      })
    },
    applyMinimalGridPreset: () => {
      applyState({
        clusterSeed: generateSeedString(),
        clusterAmount: 12,
        scalePercent: 65,
        scaleBase: 95,
        scaleSpread: 38,
        paletteVariance: 18,
        movementMode: 'drift',
        motionIntensity: 20,
        motionSpeed: 60,
        blendMode: 'MULTIPLY',
        blendModeAuto: false,
        previousBlendMode: 'MULTIPLY',
        layerOpacity: 48,
      })
    },
    usePalette: (paletteId: PaletteId) => {
      if (getPalette(paletteId)) {
        applyState({ paletteId })
      }
    },
    reset: () => {
      state = {
        ...DEFAULT_STATE,
        seed: generateSeedString(),
        icon: getRandomIcon(),
        iconAssetId: pixelArtIconIds[0],
        clusterSeed: generateSeedString(),
        previousBlendMode: DEFAULT_STATE.blendMode,
      }
      updateSprite()
    },
    destroy: () => {
      p5Instance?.remove()
      p5Instance = null
    },
  }

  notifyState()

  return controller
}

