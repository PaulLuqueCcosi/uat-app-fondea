import { cn } from "@/lib/utils";

interface Installment {
  value: number;
  label: string;
}

interface InstallmentSelectorProps {
  installments: Installment[];
  selected: number | null;
  onSelect: (value: number) => void;
}

export default function InstallmentSelector({
  installments,
  selected,
  onSelect,
}: InstallmentSelectorProps) {
  return (
    <div id="calc-cuotas" className="mb-3 sm:mb-4">
      <p className="font-bold mb-1.5 text-sm sm:text-base">Cuotas</p>
      <div className="flex flex-wrap gap-1.5 sm:gap-2">
        {installments.map((inst) => (
          <button
            key={inst.value}
            onClick={() => onSelect(inst.value)}
            className={cn(
              "rounded-lg border font-bold transition-colors w-8 h-8 sm:w-9 sm:h-9 text-xs sm:text-sm",
              selected === inst.value
                ? "bg-primary-500 text-white border-primary-500"
                : "border-neutral-300 hover:border-primary-300"
            )}
          >
            {inst.value}
          </button>
        ))}
      </div>
    </div>
  );
}
