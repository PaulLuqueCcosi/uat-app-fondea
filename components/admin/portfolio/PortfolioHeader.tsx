import { PieChart } from 'lucide-react';

export function PortfolioHeader() {
  return (
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
        <PieChart className="h-5 w-5 text-primary" />
      </div>
      <div>
        <h1 className="text-xl font-bold text-foreground">Cartera</h1>
        <p className="text-sm text-muted-foreground">Analytics de cartera — distribución, rotación y cohortes</p>
      </div>
    </div>
  );
}
