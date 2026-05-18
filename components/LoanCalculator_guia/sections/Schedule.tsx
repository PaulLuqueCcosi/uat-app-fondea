import { Skeleton } from "../ui";

interface ScheduleItem {
  label: string;
  amount: number;
}

interface ScheduleProps {
  schedule: ScheduleItem[] | null;
  calculating: boolean;
}

// Extrae fecha corta del label: "Domingo - 13 Abr" → "13 Abr"
function shortDate(label: string): string {
  const parts = label.split(" - ");
  if (parts.length >= 2) {
    return parts[1].trim();
  }
  const words = label.trim().split(" ");
  return words.slice(-2).join(" ");
}

export default function Schedule({ schedule, calculating }: ScheduleProps) {
  return (
    <div className="mb-3 sm:mb-4">
      <p className="font-bold mb-1.5 text-sm sm:text-base">Cronograma</p>
      {calculating || !schedule ? (
        <div className="flex gap-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-10 flex-1 rounded-lg" />
          ))}
        </div>
      ) : (
        <div>
          {schedule.length <= 3 ? (
            <div className="flex flex-col gap-0.5">
              {schedule.map((item, i) => (
                <div key={i} className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="text-neutral-500">{shortDate(item.label)}</span>
                  <span className="font-bold tabular-nums" style={{ color: "var(--lc-text)" }}>
                    S/ {item.amount.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs sm:text-sm text-neutral-600">
              <span className="font-bold" style={{ color: "var(--lc-text)" }}>
                {schedule.length} cuotas de S/ {schedule[0].amount.toFixed(2)}
              </span>
              <span className="text-neutral-400 mx-1">·</span>
              <span className="text-neutral-500">
                {shortDate(schedule[0].label)} → {shortDate(schedule[schedule.length - 1].label)}
              </span>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
