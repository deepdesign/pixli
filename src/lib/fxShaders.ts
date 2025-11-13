/**
 * Post-processing shader effects for canvas rendering
 * Uses Canvas 2D API for compatibility, with graceful degradation
 */

/**
 * Apply drop shadow effect to canvas
 */
export const applyDropShadow = (
  canvas: HTMLCanvasElement,
  offsetX: number, // 0-100
  offsetY: number, // 0-100
  blur: number, // 0-100
  opacity: number, // 0-100
): HTMLCanvasElement => {
  if (opacity <= 0) return canvas;

  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  const maxOffset = Math.max(canvas.width, canvas.height) * 0.1; // 10% of largest dimension
  const shadowOffsetX = (offsetX / 100) * maxOffset;
  const shadowOffsetY = (offsetY / 100) * maxOffset;
  const blurRadius = Math.max(1, Math.floor((blur / 100) * 20));
  const shadowOpacity = opacity / 100;

  // Create shadow canvas with padding for blur and offset
  const padding = Math.max(Math.abs(shadowOffsetX), Math.abs(shadowOffsetY)) + blurRadius * 2;
  const shadowCanvas = document.createElement("canvas");
  shadowCanvas.width = canvas.width + padding * 2;
  shadowCanvas.height = canvas.height + padding * 2;
  const shadowCtx = shadowCanvas.getContext("2d");
  if (!shadowCtx) return canvas;

  // Draw original canvas onto shadow canvas with offset (centered in padded area)
  shadowCtx.drawImage(canvas, padding + shadowOffsetX, padding + shadowOffsetY);

  // Apply blur to shadow
  if (typeof shadowCtx.filter !== "undefined") {
    // Create a temporary canvas for the blurred shadow
    const blurredCanvas = document.createElement("canvas");
    blurredCanvas.width = shadowCanvas.width;
    blurredCanvas.height = shadowCanvas.height;
    const blurredCtx = blurredCanvas.getContext("2d");
    if (blurredCtx) {
      blurredCtx.filter = `blur(${blurRadius}px)`;
      blurredCtx.drawImage(shadowCanvas, 0, 0);
      // Copy blurred result back to shadow canvas
      shadowCtx.clearRect(0, 0, shadowCanvas.width, shadowCanvas.height);
      shadowCtx.drawImage(blurredCanvas, 0, 0);
    }
  } else {
    applyBoxBlur(shadowCanvas, blurRadius);
  }

  // Create final canvas
  const finalCanvas = document.createElement("canvas");
  finalCanvas.width = canvas.width;
  finalCanvas.height = canvas.height;
  const finalCtx = finalCanvas.getContext("2d");
  if (!finalCtx) return canvas;

  // Draw shadow first (cropped to original size)
  finalCtx.globalAlpha = shadowOpacity;
  finalCtx.drawImage(
    shadowCanvas,
    padding,
    padding,
    canvas.width,
    canvas.height,
    0,
    0,
    canvas.width,
    canvas.height
  );

  // Draw original on top
  finalCtx.globalAlpha = 1;
  finalCtx.drawImage(canvas, 0, 0);

  // Copy back to original canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(finalCanvas, 0, 0);

  return canvas;
};

/**
 * Apply glow effect to canvas
 * Similar to bloom but with more control over color and intensity
 */
export const applyGlow = (
  canvas: HTMLCanvasElement,
  intensity: number, // 0-100
  radius: number, // 0-100
): HTMLCanvasElement => {
  if (intensity <= 0) return canvas;

  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  const intensityFactor = intensity / 100;
  const blurRadius = Math.max(1, Math.floor((radius / 100) * 15));

  // Create temporary canvas for blurred version
  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = canvas.width;
  tempCanvas.height = canvas.height;
  const tempCtx = tempCanvas.getContext("2d");
  if (!tempCtx) return canvas;

  // Copy original to temp
  tempCtx.drawImage(canvas, 0, 0);

  // Apply blur
  if (typeof tempCtx.filter !== "undefined") {
    tempCtx.filter = `blur(${blurRadius}px)`;
    tempCtx.drawImage(canvas, 0, 0);
  } else {
    applyBoxBlur(tempCanvas, blurRadius);
  }

  // Composite blurred version over original with screen blend mode
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.globalAlpha = intensityFactor * 0.6;
  ctx.drawImage(tempCanvas, 0, 0);
  ctx.restore();

  return canvas;
};

/**
 * Apply scanlines effect (CRT-style horizontal lines)
 */
export const applyScanlines = (
  canvas: HTMLCanvasElement,
  strength: number, // 0-100
): HTMLCanvasElement => {
  if (strength <= 0) return canvas;

  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  const strengthFactor = strength / 100;
  const lineHeight = 2; // Height of each scanline
  const spacing = 4; // Space between scanlines

  ctx.save();
  ctx.globalCompositeOperation = "multiply";
  ctx.globalAlpha = strengthFactor * 0.3;

  // Draw horizontal lines
  for (let y = 0; y < canvas.height; y += spacing + lineHeight) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(0, y, canvas.width, lineHeight);
  }

  ctx.restore();
  return canvas;
};

/**
 * Apply sepia effect to canvas
 */
export const applySepia = (
  canvas: HTMLCanvasElement,
  intensity: number, // 0-100
): HTMLCanvasElement => {
  if (intensity <= 0) return canvas;

  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  const intensityFactor = intensity / 100;
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    // Sepia formula
    const sepiaR = Math.min(255, (r * 0.393) + (g * 0.769) + (b * 0.189));
    const sepiaG = Math.min(255, (r * 0.349) + (g * 0.686) + (b * 0.168));
    const sepiaB = Math.min(255, (r * 0.272) + (g * 0.534) + (b * 0.131));

    // Blend with original based on intensity
    data[i] = r + (sepiaR - r) * intensityFactor;
    data[i + 1] = g + (sepiaG - g) * intensityFactor;
    data[i + 2] = b + (sepiaB - b) * intensityFactor;
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas;
};

/**
 * Apply black and white (grayscale) effect to canvas
 */
export const applyBlackAndWhite = (
  canvas: HTMLCanvasElement,
  intensity: number, // 0-100
): HTMLCanvasElement => {
  if (intensity <= 0) return canvas;

  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  const intensityFactor = intensity / 100;
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    // Grayscale conversion using luminance formula
    const gray = (r * 0.299) + (g * 0.587) + (b * 0.114);

    // Blend with original based on intensity
    data[i] = r + (gray - r) * intensityFactor;
    data[i + 1] = g + (gray - g) * intensityFactor;
    data[i + 2] = b + (gray - b) * intensityFactor;
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas;
};

/**
 * Apply contrast effect to canvas
 * 0-100 maps to -100% to +100% contrast
 * 50 = no change (0% contrast)
 */
export const applyContrast = (
  canvas: HTMLCanvasElement,
  amount: number, // 0-100, where 50 is neutral
): HTMLCanvasElement => {
  if (amount === 50) return canvas; // No change at neutral

  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  // Convert 0-100 to -1 to 1 contrast factor
  // 0 = -100% contrast (completely gray)
  // 50 = 0% contrast (no change)
  // 100 = +100% contrast (maximum contrast)
  const contrastFactor = ((amount - 50) / 50) * 1.0; // -1.0 to 1.0
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    // Apply contrast formula: factor * (pixel - 128) + 128
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    data[i] = Math.max(0, Math.min(255, contrastFactor * (r - 128) + 128));
    data[i + 1] = Math.max(0, Math.min(255, contrastFactor * (g - 128) + 128));
    data[i + 2] = Math.max(0, Math.min(255, contrastFactor * (b - 128) + 128));
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas;
};

/**
 * Apply halftone pattern effect to canvas
 * Creates circular dots arranged in a grid, with dot size based on brightness
 */
export const applyHalftone = (
  canvas: HTMLCanvasElement,
  dotSize: number, // 0-100, controls the size of the halftone dots
  angle: number, // 0-360, rotation angle of the halftone pattern
  intensity: number, // 0-100, controls the strength of the effect
): HTMLCanvasElement => {
  if (intensity <= 0) return canvas;

  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  const intensityFactor = intensity / 100;
  const sizeFactor = dotSize / 100;
  // Dot spacing: smaller dots = more spacing, larger dots = less spacing
  const spacing = Math.max(4, Math.floor(20 - (sizeFactor * 16)));
  const radius = Math.max(1, Math.floor(sizeFactor * spacing * 0.4));

  // Convert angle to radians
  const angleRad = (angle * Math.PI) / 180;
  const cosAngle = Math.cos(angleRad);
  const sinAngle = Math.sin(angleRad);

  // Get image data
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  // Create output canvas
  const outputCanvas = document.createElement("canvas");
  outputCanvas.width = canvas.width;
  outputCanvas.height = canvas.height;
  const outputCtx = outputCanvas.getContext("2d");
  if (!outputCtx) return canvas;

  // Fill with white background
  outputCtx.fillStyle = "#ffffff";
  outputCtx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw halftone dots
  outputCtx.fillStyle = "#000000";
  outputCtx.globalAlpha = intensityFactor;

  // Calculate center for rotation
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;

  for (let y = 0; y < canvas.height + spacing; y += spacing) {
    for (let x = 0; x < canvas.width + spacing; x += spacing) {
      // Get pixel brightness at this position (clamped to canvas bounds)
      const px = Math.max(0, Math.min(canvas.width - 1, Math.round(x)));
      const py = Math.max(0, Math.min(canvas.height - 1, Math.round(y)));
      const idx = (py * canvas.width + px) * 4;

      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      // Calculate luminance
      const brightness = (r * 0.299 + g * 0.587 + b * 0.114) / 255;
      // Invert brightness for halftone (darker areas = larger dots)
      const dotRadius = radius * (1 - brightness);

      if (dotRadius > 0.5) {
        // Rotate position around center
        const dx = x - centerX;
        const dy = y - centerY;
        const rotatedX = centerX + dx * cosAngle - dy * sinAngle;
        const rotatedY = centerY + dx * sinAngle + dy * cosAngle;

        // Draw circle at rotated position
        outputCtx.beginPath();
        outputCtx.arc(rotatedX, rotatedY, dotRadius, 0, Math.PI * 2);
        outputCtx.fill();
      }
    }
  }

  // Composite halftone pattern over original using multiply blend
  ctx.save();
  ctx.globalCompositeOperation = "multiply";
  ctx.drawImage(outputCanvas, 0, 0);
  ctx.restore();

  return canvas;
};

/**
 * Simple box blur implementation (fallback when filter API unavailable)
 */
function applyBoxBlur(canvas: HTMLCanvasElement, radius: number): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const width = canvas.width;
  const height = canvas.height;
  const r = Math.floor(radius);

  // Horizontal blur
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let rSum = 0, gSum = 0, bSum = 0, aSum = 0, count = 0;

      for (let dx = -r; dx <= r; dx++) {
        const px = Math.max(0, Math.min(width - 1, x + dx));
        const idx = (y * width + px) * 4;
        rSum += data[idx];
        gSum += data[idx + 1];
        bSum += data[idx + 2];
        aSum += data[idx + 3];
        count++;
      }

      const idx = (y * width + x) * 4;
      data[idx] = rSum / count;
      data[idx + 1] = gSum / count;
      data[idx + 2] = bSum / count;
      data[idx + 3] = aSum / count;
    }
  }

  // Vertical blur
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let rSum = 0, gSum = 0, bSum = 0, aSum = 0, count = 0;

      for (let dy = -r; dy <= r; dy++) {
        const py = Math.max(0, Math.min(height - 1, y + dy));
        const idx = (py * width + x) * 4;
        rSum += data[idx];
        gSum += data[idx + 1];
        bSum += data[idx + 2];
        aSum += data[idx + 3];
        count++;
      }

      const idx = (y * width + x) * 4;
      data[idx] = rSum / count;
      data[idx + 1] = gSum / count;
      data[idx + 2] = bSum / count;
      data[idx + 3] = aSum / count;
    }
  }

  ctx.putImageData(imageData, 0, 0);
}

