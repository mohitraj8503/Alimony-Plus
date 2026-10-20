"use client";

import * as Slider from "@radix-ui/react-slider";
import { useEffect, useState } from "react";
import { Field } from "@/components/ui";

export interface SliderRange {
  min: number;
  max: number;
  step: number;
}

const toText = (value: number) => (Number.isNaN(value) ? "" : String(value));
const parse = (text: string) => (text.trim() === "" ? Number.NaN : Number(text));

export function AmountField({
  label,
  value,
  error,
  slider,
  onChange,
}: {
  label: string;
  value: number;
  error?: string;
  slider?: SliderRange;
  onChange: (value: number) => void;
}) {
  const [text, setText] = useState(toText(value));

  useEffect(() => {
    const parsed = parse(text);
    const same = Object.is(parsed, value) || (Number.isNaN(parsed) && Number.isNaN(value));
    if (!same) setText(toText(value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const position =
    slider && Number.isFinite(value) ? Math.min(Math.max(value, slider.min), slider.max) : (slider?.min ?? 0);

  return (
    <div className="s-amount" data-invalid={error ? "true" : undefined}>
      <Field label={label} hint={error ? `Error: ${error}` : undefined}>
        <input
          type="text"
          inputMode="decimal"
          autoComplete="off"
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            onChange(parse(e.target.value));
          }}
          aria-invalid={error ? true : undefined}
        />
      </Field>
      {slider ? (
        <Slider.Root
          className="s-slider"
          value={[position]}
          min={slider.min}
          max={slider.max}
          step={slider.step}
          onValueChange={(v) => onChange(v[0])}
        >
          <Slider.Track className="s-track">
            <Slider.Range className="s-range" />
          </Slider.Track>
          <Slider.Thumb className="s-thumb" aria-label={`${label}, slider`} />
        </Slider.Root>
      ) : null}
    </div>
  );
}