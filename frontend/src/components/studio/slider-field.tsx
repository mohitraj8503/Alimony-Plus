"use client";
import * as Slider from "@radix-ui/react-slider";

export function SliderField({
  id,
  label,
  value,
  max,
  step,
  suffix,
  error,
  onChange,
}: {
  id: string;
  label: string;
  value: number;
  max: number;
  step: number;
  suffix?: string;
  error?: string;
  onChange: (value: number) => void;
}) {
  const shown = Number.isFinite(value) ? Math.min(Math.max(value, 0), max) : 0;
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        type="number"
        inputMode="decimal"
        min={0}
        step={step}
        value={Number.isFinite(value) ? value : ""}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        onChange={(e) =>
          onChange(e.target.value === "" ? NaN : Number(e.target.value))
        }
      />
      <Slider.Root
        className="relative flex h-5 w-full touch-none items-center select-none"
        value={[shown]}
        min={0}
        max={max}
        step={step}
        onValueChange={([v]) => onChange(v)}
      >
        <Slider.Track className="relative h-1.5 grow rounded-full bg-[#dfe5d6]">
          <Slider.Range className="absolute h-full rounded-full bg-[var(--green)]" />
        </Slider.Track>
        <Slider.Thumb
          aria-label={`${label} slider${suffix ? ` (${suffix})` : ""}`}
          className="block h-5 w-5 rounded-full border-2 border-[var(--green)] bg-white shadow focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--green)]"
        />
      </Slider.Root>
      {error && (
        <small id={`${id}-error`} role="alert" className="text-[var(--amber)]">
          {error}
        </small>
      )}
    </div>
  );
}
