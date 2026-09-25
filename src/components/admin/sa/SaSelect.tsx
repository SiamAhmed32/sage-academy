"use client";

import type { CSSProperties } from "react";
import { Select as SelectPrimitive } from "radix-ui";
import { Check, ChevronDown } from "lucide-react";

export type SaSelectOption = { value: string; label: string; disabled?: boolean };

// Radix's Select forbids an empty-string item value (it's reserved to mean
// "cleared"), but plenty of our options are "" — All classes, no teacher, no
// discount reason, etc. Swap "" for this sentinel at the boundary instead.
const EMPTY = "__sa-select-empty__";
const toRadix = (value: string) => (value === "" ? EMPTY : value);
const fromRadix = (value: string) => (value === EMPTY ? "" : value);

/**
 * Themed drop-in replacement for a native <select>: same value/onChange
 * contract, but the open list is our own styled popup (maroon accent,
 * matches .select/.input) instead of the browser's native menu.
 */
export function SaSelect({
  value,
  onChange,
  options,
  placeholder = "Select…",
  size = "default",
  disabled,
  ariaLabel,
  className = "",
  style,
}: {
  value: string;
  onChange: (value: string) => void;
  options: SaSelectOption[];
  placeholder?: string;
  size?: "default" | "sm";
  disabled?: boolean;
  ariaLabel?: string;
  className?: string;
  style?: CSSProperties;
}) {
  const selected = options.find((option) => option.value === value);
  return (
    <SelectPrimitive.Root value={toRadix(value)} onValueChange={(next) => onChange(fromRadix(next))} disabled={disabled}>
      <SelectPrimitive.Trigger
        className={`sa-select-trigger${size === "sm" ? " sm" : ""} ${className}`.trim()}
        aria-label={ariaLabel}
        style={style}
      >
        <span className="sa-select-value">{selected ? selected.label : <span className="sa-select-placeholder">{placeholder}</span>}</span>
        <SelectPrimitive.Icon asChild>
          <ChevronDown size={16} />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal container={typeof document === "undefined" ? undefined : (document.querySelector(".sa") ?? document.body)}>
        <SelectPrimitive.Content className="sa-select-content" position="popper" sideOffset={6}>
          <SelectPrimitive.Viewport className="sa-select-viewport">
            {options.map((option) => (
              <SelectPrimitive.Item key={option.value} value={toRadix(option.value)} disabled={option.disabled} className="sa-select-item">
                <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
                <SelectPrimitive.ItemIndicator className="sa-select-check">
                  <Check size={14} />
                </SelectPrimitive.ItemIndicator>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}
