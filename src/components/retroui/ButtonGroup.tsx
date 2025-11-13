import { cn } from "@/lib/utils";

export interface ButtonGroupOption {
  value: string;
  label: string;
}

export interface ButtonGroupProps {
  value: string;
  onChange: (value: string) => void;
  options: ButtonGroupOption[];
  className?: string;
  disabled?: boolean;
}

/**
 * Segmented button group component matching retro-tab styling
 */
export const ButtonGroup = ({
  value,
  onChange,
  options,
  className,
  disabled = false,
}: ButtonGroupProps) => {
  return (
    <div className={cn("retro-button-group", className)}>
      {options.map((option, index) => {
        const isSelected = option.value === value;
        const isFirst = index === 0;
        const isLast = index === options.length - 1;
        
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => !disabled && onChange(option.value)}
            disabled={disabled}
            className={cn(
              "retro-button-group-item",
              isSelected && "retro-button-group-item-active",
              isFirst && "retro-button-group-item-first",
              isLast && "retro-button-group-item-last",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
};

