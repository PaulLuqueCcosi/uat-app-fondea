import { BookOpen } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface Article {
  title: string;
  description: string;
}

// Función para obtener artículos educativos
async function getEducationArticles(): Promise<Article[]> {
  // TODO: Reemplazar con llamada real a BD o CMS
  // const articles = await getArticlesFromCMS();
  // return articles;
  
  // Por ahora retornar datos mock
  return [
    { title: '¿Qué es el score crediticio?', description: 'Aprende cómo se calcula y cómo mejorarlo para acceder a mejores tasas.' },
    { title: 'Cómo usar un préstamo personal', description: 'Consejos para usar el crédito de forma responsable y sin endeudarte.' },
    { title: 'Diferencia entre TEA y TCEA', description: 'Entiende las tasas que aplican a tu préstamo antes de firmar.' },
  ];
}

export async function EducationSectionServer() {
  // Obtener datos reales del servidor
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
