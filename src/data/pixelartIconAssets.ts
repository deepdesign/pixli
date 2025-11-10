export interface PixelArtIconAsset {
  id: string;
  label: string;
  url: string;
}

const iconAsset = (
  id: string,
  label: string,
  url: string,
): PixelArtIconAsset => ({ id, label, url });

const spriteAsset = (id: string, label: string, fileName: string) =>
  iconAsset(id, label, `/sprites/${fileName}`);

export const pixelArtIconAssets: PixelArtIconAsset[] = [
  spriteAsset("pacman", "Pac-Man", "pacman.svg"),
  spriteAsset("pinky", "Pinky", "pinky.svg"),
  spriteAsset("space-invader-1", "Space Invader 01", "space invader 01.svg"),
  spriteAsset("space-invader-2", "Space Invader 02", "space invader 02.svg"),
];

export const pixelArtIconIds = pixelArtIconAssets.map((icon) => icon.id);

export const getPixelArtIconById = (id: string) =>
  pixelArtIconAssets.find((icon) => icon.id === id);
