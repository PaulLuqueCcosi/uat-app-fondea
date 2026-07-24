import { ArrowLeft, RotateCcw, Loader2, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface PortfolioHeaderProps {
  loading: boolean;
  onRefresh: () => void;
  children?: React.ReactNode;
}

export function PortfolioHeader({ loading, onRefresh, children }: PortfolioHeaderProps) {
  return (
    <>
      <div className="flex items-center justify-between">
        <Link
          href="/admin/credits"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Créditos
        </Link>
        <div className="flex items-center gap-2">
          {children}
          <Button variant="outline" size="sm" onClick={onRefresh} disabled={loading} className="gap-1">
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
            Refrescar
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <BarChart3 className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Analytics de Cartera</h1>
          <p className="text-sm text-muted-foreground">Distribución, rotación, cohortes y próximos vencimientos</p>
        </div>
      </div>
    </>
  );
}
