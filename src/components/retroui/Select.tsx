import { forwardRef } from "react";

import { cn } from "@/lib/utils";

import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown, ChevronUp } from "lucide-react";

export const Select = SelectPrimitive.Root;

export const SelectTrigger = forwardRef<
  HTMLButtonElement,
  SelectPrimitive.SelectTriggerProps
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn("control-dropdown-trigger", className)}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDown className="h-3.5 w-3.5" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
));
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;

export const SelectValue = SelectPrimitive.Value;

export const SelectContent = forwardRef<
  HTMLDivElement,
  SelectPrimitive.SelectContentProps
>(
  (
    { className, children, position = "popper", sideOffset = 8, modal = false, ...props },
    ref,
  ) => (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        ref={ref}
        className={cn("control-dropdown-menu", className)}
        position={position}
        sideOffset={sideOffset}
        modal={modal}
        {...props}
      >
        <SelectPrimitive.ScrollUpButton className="control-select-scroll">
          <ChevronUp className="h-3 w-3" />
        </SelectPrimitive.ScrollUpButton>
        <SelectPrimitive.Viewport className={cn("control-select-viewport")}>
          {children}
        </SelectPrimitive.Viewport>
        <SelectPrimitive.ScrollDownButton className="control-select-scroll">
          <ChevronDown className="h-3 w-3" />
        </SelectPrimitive.ScrollDownButton>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  ),
);
SelectContent.displayName = SelectPrimitive.Content.displayName;

export const SelectGroup = SelectPrimitive.Group;

export const SelectItem = forwardRef<
  HTMLDivElement,
  SelectPrimitive.SelectItemProps
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn("control-dropdown-item", className)}
    {...props}
  >
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    <span className="control-select-indicator">
      <SelectPrimitive.ItemIndicator>
        <Check className="select-check-icon" />
      </SelectPrimitive.ItemIndicator>
    </span>
  </SelectPrimitive.Item>
));
SelectItem.displayName = SelectPrimitive.Item.displayName;

export const SelectLabel = SelectPrimitive.Label;
export const SelectSeparator = SelectPrimitive.Separator;
