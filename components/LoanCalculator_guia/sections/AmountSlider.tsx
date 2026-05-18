interface Amount {
  value: number;
  label: string;
}

interface AmountSliderProps {
  amounts: Amount[];
  selectedIndex: number;
  onChange: (index: number) => void;
}

export default function AmountSlider({
  amounts,
  selectedIndex,
  onChange,
}: AmountSliderProps) {
  const currentAmount = amounts[selectedIndex]?.value ?? 0;
  const maxIndex = Math.max(0, amounts.length - 1);

  return (
    <div id="calc-monto" className="mb-3 sm:mb-4">
      <span className="font-bold text-sm sm:text-base block mb-1">¿Cuánto necesitas?</span>
      <div className="font-extrabold border border-neutral-200 rounded-lg px-2 py-1 sm:px-3 sm:py-1.5 w-full tabular-nums text-xl sm:text-3xl text-primary-600 text-center mb-2">
        <span className="text-base sm:text-xl font-bold text-neutral-500">S/.</span> {Math.round(currentAmount).toLocaleString("es-PE")}
      </div>
      <input
        type="range"
        min={0}
        max={maxIndex}
        step={1}
        value={selectedIndex}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
        style={{ accentColor: "var(--lc-primary)" }}
      />
      <div className="flex justify-between text-[10px] sm:text-xs text-neutral-400 -mt-1 leading-none">
        <span>{amounts[0]?.label ?? ""}</span>
        <span>{amounts.at(-1)?.label ?? ""}</span>
      </div>
    </div>
  );
}
