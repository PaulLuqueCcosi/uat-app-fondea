import { BookOpen } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface Article {
  title: string;
  description: string;
}

async function getEducationArticles(): Promise<Article[]> {
  // TODO: Obtener desde CMS o BD
  return [
    { title: '¿Qué es el score crediticio?', description: 'Aprende cómo se calcula y cómo mejorarlo para acceder a mejores tasas.' },
    { title: 'Cómo usar un préstamo personal', description: 'Consejos para usar el crédito de forma responsable y sin endeudarte.' },
    { title: 'Diferencia entre TEA y TCEA', description: 'Entiende las tasas que aplican a tu préstamo antes de firmar.' },
  ];
}

async function EducationSectionContent() {
  const articles = await getEducationArticles();

  return (
    <Card>
      <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
        <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center shrink-0">
          <BookOpen className="w-4 h-4 text-white" />
        </div>
        <h2 className="font-semibold text-dark">Aprende sobre finanzas</h2>
      </div>
      <div className="divide-y divide-border">
        {articles.map((article) => (
          <div key={article.title} className="px-5 py-3 flex flex-col gap-0.5">
            <p className="text-sm font-medium text-dark">{article.title}</p>
            <p className="text-xs text-fondea-text leading-relaxed">{article.description}</p>
            <button className="text-xs text-primary font-medium hover:underline self-start mt-1">
              Leer →
            </button>
          </div>
        ))}
      </div>
    </Card>
  );
}

function EducationSectionSkeleton() {
  return (
    <Card>
      <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
        <Skeleton className="w-7 h-7 rounded-full shrink-0" />
        <Skeleton className="h-5 w-40" />
      </div>
      <div className="divide-y divide-border">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="px-5 py-3 flex flex-col gap-0.5">
            {/* Título del artículo */}
            <Skeleton className="h-4 w-48" />
            {/* Descripción línea 1 */}
            <Skeleton className="h-3 w-full" />
            {/* Descripción línea 2 */}
            <Skeleton className="h-3 w-5/6" />
            {/* Botón "Leer" */}
            <Skeleton className="h-3 w-12 mt-1" />
          </div>
        ))}
      </div>
    </Card>
  );
}

export const EducationSection = Object.assign(EducationSectionContent, {
  Skeleton: EducationSectionSkeleton,
});
