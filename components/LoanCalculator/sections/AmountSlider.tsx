interface AmountSliderProps {
  monto: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  dedicated?: boolean;
}

export default function AmountSlider({
  monto,
  min,
  max,
  step,
  onChange,
}: AmountSliderProps) {
  return (
    <div id="calc-monto" className="mb-3 sm:mb-4">
      <span className="font-bold text-sm sm:text-base block mb-1">¿Cuánto necesitas?</span>
      <div className="font-extrabold border border-neutral-200 rounded-lg px-2 py-1 sm:px-3 sm:py-1.5 w-full tabular-nums text-xl sm:text-3xl text-primary-600 text-center mb-2">
        <span className="text-base sm:text-xl font-bold text-neutral-500">S/.</span> {Math.round(monto).toLocaleString("es-PE")}
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={monto}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
        style={{ accentColor: "var(--lc-primary)" }}
      />
      <div className="flex justify-between text-[10px] sm:text-xs text-neutral-400 -mt-1 leading-none">
        <span>S/. {Math.round(min).toLocaleString("es-PE")}</span>
        <span>S/. {Math.round(max).toLocaleString("es-PE")}</span>
      </div>
    </div>
  );
}
