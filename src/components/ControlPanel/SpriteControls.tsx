import { useRef } from "react";
import { Button } from "@/components/Button";
import { Switch } from "@/components/retroui/Switch";
import { Lock, Unlock, RefreshCw } from "lucide-react";
import { SPRITE_MODES } from "@/constants/sprites";
import { ControlSlider, ShapeIcon, TooltipIcon } from "./shared";
import { densityToUi, uiToDensity } from "@/lib/utils";
import { animatePulse } from "@/lib/utils/animations";
import type { GeneratorState, SpriteController, SpriteMode } from "@/types/generator";

interface SpriteControlsProps {
  spriteState: GeneratorState;
  controller: SpriteController | null;
  ready: boolean;
  currentModeLabel: string;
  lockedSpriteMode: boolean;
  onLockSpriteMode: (locked: boolean) => void;
  onModeChange: (mode: SpriteMode) => void;
  onRotationToggle: (checked: boolean) => void;
  onRotationAmountChange: (value: number) => void;
}

/**
 * SpriteControls Component
 * 
 * Renders controls for sprite shape selection, density, scale, and rotation.
 * Includes shape buttons, regenerate button, and rotation settings.
 */
export function SpriteControls({
  spriteState,
  controller,
  ready,
  currentModeLabel,
  lockedSpriteMode,
  onLockSpriteMode,
  onModeChange,
  onRotationToggle,
  onRotationAmountChange,
}: SpriteControlsProps) {
  const randomizeButtonRef = useRef<HTMLButtonElement>(null);
  const densityValueUi = densityToUi(spriteState.scalePercent);

  return (
    <>
      <div className="section">
        <h3 className="section-title">Shape</h3>
        {/* Label, status, and tooltip for sprite selection */}
        <div className="control-field">
          <div className="field-heading">
            <div className="field-heading-left">
              <span className="field-label" id="render-mode-label">
                Select Sprites
              </span>
              <TooltipIcon
                id="render-mode-tip"
                text="Choose the geometric shape used for sprites."
                label="Select Sprites"
              />
            </div>
            {currentModeLabel && (
              <span className="field-value">{currentModeLabel}</span>
            )}
          </div>
          {/* Icon button row for sprite selection */}
          <div className="sprite-icon-buttons">
          <div className="flex flex-wrap items-center">
            {SPRITE_MODES.map((mode) => {
              const isSelected = spriteState.spriteMode === mode.value;
              return (
                <Button
                  key={mode.value}
                  type="button"
                  size="icon"
                  variant={isSelected ? "default" : "outline"}
                  onClick={() => onModeChange(mode.value)}
                  disabled={!ready || lockedSpriteMode}
                  title={mode.label}
                  aria-label={mode.label}
                  className={isSelected ? undefined : "icon-button"}
                >
                  <ShapeIcon shape={mode.value} size={24} />
                </Button>
              );
            })}
            <Button
              type="button"
              size="icon"
              variant="outline"
              onClick={() => onLockSpriteMode(!lockedSpriteMode)}
              disabled={!ready}
              aria-label={lockedSpriteMode ? "Unlock sprite mode" : "Lock sprite mode"}
              title={lockedSpriteMode ? "Unlock sprite mode" : "Lock sprite mode"}
              className={
                lockedSpriteMode
                  ? "icon-button control-lock-button control-lock-button-locked"
                  : "icon-button control-lock-button"
              }
            >
              {lockedSpriteMode ? (
                <Lock className="h-4 w-4" />
              ) : (
                <Unlock className="h-4 w-4" />
              )}
            </Button>
          </div>
          </div>
        </div>

        {/* Regenerate sprites button */}
        <div className="control-field control-field--spaced-top">
          <div className="switch-row">
            <Button
              ref={randomizeButtonRef}
              type="button"
              size="icon"
              variant="outline"
              onClick={() => {
                if (randomizeButtonRef.current) {
                  animatePulse(randomizeButtonRef.current);
                }
                // Regenerate sprites by updating the seed
                if (controller) {
                  const currentState = controller.getState();
                  // Update seed to regenerate sprites with new positions and shapes
                  controller.applyState({
                    ...currentState,
                    seed: `${currentState.seed}-regenerate-${Date.now()}`,
                  });
                }
              }}
              disabled={!ready}
              aria-label="Regenerate sprites"
              title="Regenerate all sprites on the canvas with new positions and sizes"
              className="icon-button"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <div className="field-heading-left">
              <span className="field-label" id="regenerate-sprites-label">
                Regenerate
              </span>
              <TooltipIcon
                id="regenerate-sprites-tip"
                text="Regenerate all sprites on the canvas with new positions and sizes."
                label="Regenerate"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="section section--spaced">
        <hr className="section-divider" />
        <h3 className="section-title">Density &amp; Scale</h3>
        <ControlSlider
          id="density-range"
          label="Tile Density"
          min={0}
          max={100}
          value={densityValueUi}
          displayValue={`${densityValueUi}%`}
          onChange={(value) => controller?.setScalePercent(uiToDensity(value))}
          disabled={!ready}
          tooltip="Controls how many tiles spawn per layer; higher values create a busier canvas."
        />
        <ControlSlider
          id="scale-base"
          label="Scale Base"
          min={0}
          max={100}
          value={Math.round(spriteState.scaleBase)}
          displayValue={`${Math.round(spriteState.scaleBase)}%`}
          onChange={(value) => controller?.setScaleBase(value)}
          disabled={!ready}
          tooltip="Sets the baseline sprite size before any random spread is applied."
        />
        <ControlSlider
          id="scale-range"
          label="Scale Range"
          min={0}
          max={100}
          value={Math.round(spriteState.scaleSpread)}
          displayValue={`${Math.round(spriteState.scaleSpread)}%`}
          onChange={(value) => controller?.setScaleSpread(value)}
          disabled={!ready}
          tooltip="Expands or tightens the difference between the smallest and largest sprites."
        />
      </div>

      <div className="section section--spaced">
        <hr className="section-divider" />
        <h3 className="section-title">Depth</h3>
        <div className="control-field control-field--rotation">
          <div className="field-heading">
            <div className="field-heading-left">
              <span className="field-label" id="depth-of-field-toggle-label">
                Depth of Field
              </span>
              <TooltipIcon
                id="depth-of-field-toggle-tip"
                text="Blur sprites based on their distance from a focus plane. Larger sprites (closer) and smaller sprites (farther) get different blur amounts."
                label="Depth of Field"
              />
            </div>
          </div>
          <div className="switch-row">
            <Switch
              id="depth-of-field-toggle"
              checked={spriteState.depthOfFieldEnabled}
              onCheckedChange={(checked) => controller?.setDepthOfFieldEnabled(checked)}
              disabled={!ready}
              aria-labelledby="depth-of-field-toggle-label"
            />
          </div>
        </div>
        {spriteState.depthOfFieldEnabled && (
          <>
            <ControlSlider
              id="depth-focus"
              label="Focus"
              min={0}
              max={100}
              value={Math.round(spriteState.depthOfFieldFocus)}
              displayValue={`${Math.round(spriteState.depthOfFieldFocus)}%`}
              onChange={(value) => controller?.setDepthOfFieldFocus(value)}
              disabled={!ready}
              tooltip="Adjusts which depth is in focus. Objects at this depth remain sharp."
            />
            <ControlSlider
              id="depth-strength"
              label="Blur Strength"
              min={0}
              max={100}
              value={Math.round(spriteState.depthOfFieldStrength)}
              displayValue={`${Math.round(spriteState.depthOfFieldStrength)}%`}
              onChange={(value) => controller?.setDepthOfFieldStrength(value)}
              disabled={!ready}
              tooltip="Controls how blurry objects become when out of focus. Does not affect objects on the focus plane."
            />
          </>
        )}
      </div>

      <div className="section section--spaced">
        <hr className="section-divider" />
        <h3 className="section-title">Rotation</h3>
        <div className="control-field control-field--rotation">
          <div className="field-heading">
            <div className="field-heading-left">
              <span className="field-label" id="rotation-toggle-label">
                Rotation offsets
              </span>
              <TooltipIcon
                id="rotation-toggle-tip"
                text="Allow sprites to inherit a static rotation offset based on the slider below."
                label="Rotation offsets"
              />
            </div>
          </div>
          <div className="switch-row">
            <Switch
              id="rotation-toggle"
              checked={spriteState.rotationEnabled}
              onCheckedChange={onRotationToggle}
              disabled={!ready}
              aria-labelledby="rotation-toggle-label"
            />
          </div>
        </div>
        {spriteState.rotationEnabled && (
          <div className="rotation-slider-wrapper">
            <ControlSlider
              id="rotation-amount"
              label="Rotation Amount"
              min={0}
              max={180}
              value={Math.round(spriteState.rotationAmount)}
              displayValue={`${Math.round(spriteState.rotationAmount)}°`}
              onChange={onRotationAmountChange}
              disabled={!ready}
              tooltip="Set the maximum angle sprites can rotate (distributed randomly, no animation)."
            />
          </div>
        )}
      </div>
    </>
  );
}

