export interface Palette {
  id: string;
  name: string;
  colors: string[];
}

export const palettes: Palette[] = [
  {
    id: "neon",
    name: "Neon Pop",
    colors: ["#ff3cac", "#784ba0", "#2b86c5", "#00f5d4", "#fcee0c"],
  },
  {
    id: "pastel",
    name: "Soft Pastel",
    colors: ["#f7c5cc", "#ffdee8", "#c4f3ff", "#d9f0ff", "#fdf5d7"],
  },
  {
    id: "sunset",
    name: "Sunset Drive",
    colors: ["#ff7b00", "#ff5400", "#ff0054", "#ad00ff", "#6300ff"],
  },
  {
    id: "synth",
    name: "Synthwave",
    colors: ["#ff4ecd", "#ff9f1c", "#2ec4b6", "#cbf3f0", "#011627"],
  },
  {
    id: "aurora",
    name: "Aurora Glass",
    colors: ["#00c6ff", "#0072ff", "#7b42f6", "#b01eff", "#f441a5"],
  },
  {
    id: "arcade",
    name: "Arcade Neon",
    colors: ["#f72585", "#7209b7", "#3a0ca3", "#4361ee", "#4cc9f0"],
  },
  {
    id: "flora",
    name: "Flora Bloom",
    colors: ["#ffafbd", "#ffc3a0", "#ffdfd3", "#d0ffb7", "#86fde8"],
  },
  {
    id: "ember",
    name: "Ember Glow",
    colors: ["#ff4e00", "#ec9f05", "#f5c469", "#ffd17c", "#ffd8a9"],
  },
  {
    id: "oceanic",
    name: "Oceanic Pulse",
    colors: ["#031a6b", "#033860", "#087ca7", "#3fd7f2", "#9ef6ff"],
  },
  {
    id: "void",
    name: "Midnight Void",
    colors: ["#0f0f1c", "#1f1147", "#371a79", "#5d2e9a", "#8c44ff"],
  },
];

export const defaultPaletteId = "neon";

export const getPalette = (id: string) =>
  palettes.find((palette) => palette.id === id) ?? palettes[0];

export const getRandomPalette = () =>
  palettes[Math.floor(Math.random() * palettes.length)];
