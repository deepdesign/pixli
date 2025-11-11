# Export Enhancements - Implementation Plan

_Last updated: 2025-11-11_

## Overview

Enhance the current basic screenshot functionality to support arbitrary output dimensions while preserving aspect ratio via intelligent cropping. This will enable users to export wallpapers, social media assets, and prints in their desired resolutions.

## Current State

- **Basic Screenshot**: `handleScreenshot()` in `src/App.tsx` captures canvas and downloads as PNG
- **Access Points**: Currently accessible from fullscreen HUD only
- **Limitations**: 
  - Fixed canvas dimensions (square, matches viewport)
  - No custom sizing options
  - No format selection
  - No progress indication for large exports

## Goals

1. **Arbitrary Output Dimensions**: Export to any user-specified pixel dimensions
2. **Aspect Ratio Preservation**: Maintain canvas aspect ratio via intelligent cropping
3. **Format Selection**: Support PNG (default) and optionally JPEG/WebP
4. **Performance**: Handle large exports (>8K) with progress indicators
5. **User Experience**: Intuitive modal interface with preset dimensions

## User Flow

### Primary Flow: Export Modal

1. **Trigger**: User clicks "Export" button (see placement below)
2. **Modal Opens**: Export dialog appears with:
   - Current canvas preview (small thumbnail)
   - Dimension inputs (width × height)
   - Preset dimension buttons (common sizes)
   - Format selector (PNG/JPEG/WebP)
   - Quality slider (for JPEG/WebP)
   - Export button
   - Cancel button
3. **User Input**: 
   - Select preset OR enter custom dimensions
   - Choose format (optional, defaults to PNG)
   - Adjust quality if JPEG/WebP
4. **Validation**: 
   - Check dimensions are within limits (min: 100px, max: 16384px)
   - Warn if >8K resolution (performance impact)
   - Validate aspect ratio preservation
5. **Export Process**:
   - Show progress indicator
   - Render to off-screen buffer
   - Crop/scale as needed
   - Generate blob
   - Trigger download
   - Close modal on success
6. **Error Handling**: Display error message if export fails

### Quick Export Flow (Fullscreen HUD)

- **Current behavior preserved**: Quick screenshot button in fullscreen HUD
- **Enhanced**: Clicking opens modal instead of immediate download
- **Alternative**: Long-press or right-click for instant export at current size

## CTA/Button Placement

### Primary Location: Status Bar (Bottom of Canvas)

**Rationale**: 
- Always visible and contextually relevant
- Matches existing pattern (Presets button, Randomise button)
- Accessible in both normal and fullscreen modes

**Implementation**:
- Add "Export" icon button next to Presets button in status bar
- Use `Download` icon from lucide-react (consistent with fullscreen HUD)
- Icon-only button with tooltip: "Export canvas (S)"

### Secondary Location: Fullscreen HUD

**Current**: "Screenshot" button exists
**Change**: Rename to "Export" and open modal instead of instant download
**Rationale**: More discoverable, allows customization even in fullscreen

### Keyboard Shortcut

- **`S`**: Open export modal (when canvas is focused)
- **`Ctrl/Cmd + S`**: Quick export at current dimensions (bypass modal)

## Technical Architecture

### 1. Off-Screen Rendering with p5.js

**Approach**: Create a temporary p5 graphics buffer for export

```typescript
// Pseudo-code structure
const exportCanvas = async (
  p5Instance: p5,
  targetWidth: number,
  targetHeight: number,
  onProgress?: (progress: number) => void
): Promise<Blob> => {
  // 1. Calculate aspect ratio and crop region
  const canvasAspect = currentWidth / currentHeight;
  const targetAspect = targetWidth / targetHeight;
  
  // 2. Create off-screen graphics buffer
  const exportGraphics = p5Instance.createGraphics(targetWidth, targetHeight);
  
  // 3. Render current state to buffer (with progress callbacks)
  // 4. Crop/scale as needed
  // 5. Convert to blob
  // 6. Return blob for download
};
```

**Key Considerations**:
- Use `p5.Graphics` for off-screen rendering
- Maintain current animation state (freeze frame or export current frame)
- Handle large dimensions efficiently (chunk rendering if needed)
- Preserve pixel-perfect quality (no unnecessary scaling)

### 2. Aspect Ratio & Cropping Logic

**Strategy**: Center crop to preserve square aspect ratio

```typescript
// If target is wider than canvas aspect ratio:
// - Crop top/bottom (letterbox)
// If target is taller than canvas aspect ratio:
// - Crop left/right (pillarbox)

const calculateCropRegion = (
  sourceWidth: number,
  sourceHeight: number,
  targetWidth: number,
  targetHeight: number
) => {
  const sourceAspect = sourceWidth / sourceHeight;
  const targetAspect = targetWidth / targetHeight;
  
  if (targetAspect > sourceAspect) {
    // Target is wider - crop height
    const cropHeight = sourceWidth / targetAspect;
    const cropY = (sourceHeight - cropHeight) / 2;
    return { x: 0, y: cropY, width: sourceWidth, height: cropHeight };
  } else {
    // Target is taller - crop width
    const cropWidth = sourceHeight * targetAspect;
    const cropX = (sourceWidth - cropWidth) / 2;
    return { x: cropX, y: 0, width: cropWidth, height: sourceHeight };
  }
};
```

### 3. Format Support

**PNG** (default):
- Lossless, supports transparency
- Use `canvas.toBlob('image/png')`

**JPEG**:
- Smaller file size, no transparency
- Quality slider (0.1 - 1.0)
- Use `canvas.toBlob('image/jpeg', quality)`

**WebP** (optional):
- Best compression, modern browsers
- Quality slider (0.1 - 1.0)
- Use `canvas.toBlob('image/webp', quality)`
- Fallback to PNG if unsupported

### 4. Performance & Progress

**Large Export Handling**:
- Warn user if dimensions > 8192px
- Show progress indicator during render
- Use `requestAnimationFrame` for chunked rendering if needed
- Estimate time based on pixel count

**Progress Indicator**:
- Modal shows progress bar
- Percentage complete
- Estimated time remaining (optional)

### 5. Dimension Presets

**Common Sizes**:
- **Social Media**:
  - Instagram Post: 1080×1080
  - Instagram Story: 1080×1920
  - Twitter/X: 1200×675
  - Facebook: 1200×630
- **Wallpapers**:
  - HD: 1920×1080
  - 4K: 3840×2160
  - 5K: 5120×2880
- **Print**:
  - A4 (300 DPI): 2480×3508
  - Square Print: 3000×3000
- **Custom**: User-entered dimensions

## Component Structure

### ExportModal Component

```typescript
interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCanvasSize: { width: number; height: number };
  onExport: (options: ExportOptions) => Promise<void>;
}

interface ExportOptions {
  width: number;
  height: number;
  format: 'png' | 'jpeg' | 'webp';
  quality?: number; // 0.1 - 1.0 for JPEG/WebP
}
```

**Sections**:
1. **Preview**: Small canvas thumbnail showing crop region
2. **Dimensions**: 
   - Preset buttons (grid layout)
   - Custom inputs (width × height)
   - Aspect ratio lock toggle
3. **Format**: Radio buttons or select
4. **Quality**: Slider (only visible for JPEG/WebP)
5. **Actions**: Export button, Cancel button

### Export Service

```typescript
// src/lib/exportService.ts
export interface ExportConfig {
  width: number;
  height: number;
  format: 'png' | 'jpeg' | 'webp';
  quality?: number;
}

export const exportCanvas = async (
  p5Instance: p5,
  config: ExportConfig,
  onProgress?: (progress: number) => void
): Promise<Blob> => {
  // Implementation
};
```

## Implementation Steps

### Phase 1: Foundation
1. ✅ Create `ExportModal` component structure
2. ✅ Add export button to status bar
3. ✅ Implement modal overlay (reuse PresetManager pattern)
4. ✅ Add dimension preset buttons
5. ✅ Add custom dimension inputs

### Phase 2: Core Export Logic
1. ✅ Create `exportService.ts` with off-screen rendering
2. ✅ Implement aspect ratio calculation
3. ✅ Implement cropping logic
4. ✅ Add PNG export (baseline)
5. ✅ Test with various dimensions

### Phase 3: Format Support
1. ✅ Add JPEG export with quality
2. ✅ Add WebP export with quality (optional)
3. ✅ Add format selector UI
4. ✅ Add quality slider

### Phase 4: Performance & UX
1. ✅ Add progress indicator
2. ✅ Add dimension validation
3. ✅ Add >8K warning
4. ✅ Add error handling
5. ✅ Add keyboard shortcuts

### Phase 5: Polish
1. ✅ Update fullscreen HUD button
2. ✅ Add tooltips
3. ✅ Add preview thumbnail
4. ✅ Test edge cases
5. ✅ Performance optimization

## File Structure

```
src/
  components/
    ExportModal.tsx          # Main export modal component
  lib/
    exportService.ts         # Core export logic
    exportPresets.ts         # Dimension presets data
  App.tsx                    # Add export button, modal state
  index.css                  # Export modal styles
```

## Libraries & Dependencies

**Core**:
- p5.js (already in use) - Off-screen graphics buffers
- Canvas API - `toBlob()`, `getImageData()`

**Optional**:
- None required - using native browser APIs

## Edge Cases & Considerations

1. **Very Large Exports** (>8K):
   - Warn user about performance
   - Show progress indicator
   - Consider memory limits

2. **Aspect Ratio Mismatch**:
   - Always center crop
   - Show crop preview in modal
   - Explain cropping behavior

3. **Browser Compatibility**:
   - `toBlob()` support (all modern browsers)
   - WebP support (check and fallback)

4. **Memory Management**:
   - Clean up graphics buffers after export
   - Handle out-of-memory errors gracefully

5. **Animation State**:
   - Export current frame (freeze animation)
   - Consider "Export Animation" feature later

## Future Enhancements

1. **Batch Export**: Export multiple sizes at once
2. **Animation Export**: GIF/WebM sequence export
3. **Export History**: Remember recent export dimensions
4. **Custom Presets**: User-defined dimension presets
5. **Export Templates**: Pre-configured export settings for common use cases

## Testing Strategy

1. **Unit Tests**:
   - Aspect ratio calculation
   - Crop region calculation
   - Dimension validation

2. **Integration Tests**:
   - Export flow end-to-end
   - Modal interactions
   - Error handling

3. **Performance Tests**:
   - Large export timing
   - Memory usage
   - Progress indicator accuracy

4. **Browser Tests**:
   - Cross-browser compatibility
   - Format support detection
   - Mobile responsiveness

## Success Criteria

- ✅ Users can export to any dimension (within limits)
- ✅ Aspect ratio is preserved via intelligent cropping
- ✅ Multiple formats supported (PNG, JPEG, WebP)
- ✅ Large exports show progress
- ✅ Modal is intuitive and discoverable
- ✅ Export button is accessible from status bar
- ✅ Keyboard shortcuts work (`S` to open, `Ctrl/Cmd+S` for quick export)

