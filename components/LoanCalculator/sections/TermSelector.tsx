import { cn } from "@/lib/utils";

interface Term {
  value: number;
  label: string;
}

interface TermSelectorProps {
  terms: Term[];
  selected: number | null;
  onSelect: (value: number) => void;
}

export default function TermSelector({
  terms,
  selected,
  onSelect,
}: TermSelectorProps) {
  return (
    <div id="calc-plazo" className="mb-3 sm:mb-4">
      <p className="font-bold mb-1.5 text-sm sm:text-base">Plazo</p>
      <div className="flex gap-1.5 sm:gap-2">
        {terms.map((t) => (
          <button
            key={t.value}
            onClick={() => onSelect(t.value)}
            className={cn(
              "flex-1 rounded-lg border font-bold transition-colors py-1.5 sm:py-2 text-xs sm:text-sm",
              selected === t.value
                ? "bg-primary-500 text-white border-primary-500"
                : "border-neutral-300 hover:border-primary-300"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}
