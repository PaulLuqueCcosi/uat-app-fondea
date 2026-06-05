'use client';

import { useState } from 'react';
import { ArrowRight, GraduationCap, LayoutGrid, List } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardAction, CardContent, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';

interface Article {
  title: string;
  description: string;
  image: string;
  href: string;
}

// TODO: Obtener desde CMS o BD
const articles: Article[] = [
  {
    title: '¿Qué es el score crediticio?',
    description: 'Aprende cómo se calcula y cómo mejorarlo para acceder a mejores tasas de interés.',
    image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=400&fit=crop',
    href: '#',
  },
  {
    title: 'Usa tu préstamo responsablemente',
    description: 'Consejos prácticos para usar el crédito sin endeudarte más de lo necesario.',
    image: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=400&h=200&fit=crop',
    href: '#',
  },
  {
    title: 'TEA vs TCEA: entiende las tasas',
    description: 'Las tasas que aplican a tu préstamo explicadas de forma simple.',
    image: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&h=200&fit=crop',
    href: '#',
  },
  {
    title: 'Protege tu información financiera',
    description: 'Tips de seguridad para evitar fraudes y proteger tus datos personales.',
    image: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=400&h=200&fit=crop',
    href: '#',
  },
];

type ViewMode = 'list' | 'grid';

function EducationSectionContent() {
  const [view, setView] = useState<ViewMode>('grid');

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <span className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-primary" />
            Educación Financiera
          </span>
        </CardTitle>
        <CardDescription>Aprende a manejar mejor tu dinero</CardDescription>
        <CardAction>
          <div className="flex items-center gap-1 rounded-lg border border-border p-0.5">
            <button
              onClick={() => setView('list')}
              className={`p-1.5 rounded-md transition-colors ${view === 'list' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground'}`}
              aria-label="Vista lista"
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setView('grid')}
              className={`p-1.5 rounded-md transition-colors ${view === 'grid' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground'}`}
              aria-label="Vista cuadrícula"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
          </div>
        </CardAction>
      </CardHeader>

      <CardContent>
        {view === 'list' ? (
          /* ── Vista Lista ── */
          <div className="divide-y divide-border -mx-4">
            {articles.map((article) => (
              <Link
                key={article.title}
                href={article.href}
                className="group flex items-center gap-4 px-4 py-3.5 hover:bg-muted/50 transition-colors"
              >
                <div className="w-20 h-14 sm:w-24 sm:h-16 rounded-lg overflow-hidden bg-muted shrink-0">
                  <img
                    src={article.image}
                    alt={article.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="flex-1 min-w-0 space-y-0.5">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-medium text-foreground leading-tight group-hover:text-primary transition-colors">
                      {article.title}
                    </h3>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 hidden sm:block">
                    {article.description}
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary shrink-0 group-hover:translate-x-0.5 transition-all" />
              </Link>
            ))}
          </div>
        ) : (
          /* ── Vista Cards con imagen ── */
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {articles.map((article) => (
              <Link
                key={article.title}
                href={article.href}
                className="group flex flex-col rounded-lg border border-border overflow-hidden hover:border-primary/30 hover:shadow-sm transition-all"
              >
                <img
                  src={article.image}
                  alt={article.title}
                  className="aspect-4/3 max-h-36 w-full object-cover"
                />
                <div className="p-3 flex flex-col gap-1 flex-1">
                  <h3 className="text-sm font-medium text-foreground leading-tight group-hover:text-primary transition-colors">
                    {article.title}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                    {article.description}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>

      <CardFooter>
        <Link href="#" className="inline-flex items-center gap-1.5 text-sm text-primary font-medium hover:underline">
          Ver más artículos
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </CardFooter>
    </Card>
  );
}

function EducationSectionSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <span className="flex items-center gap-2">
            <Skeleton className="w-5 h-5 rounded" />
            <Skeleton className="h-5 w-40" />
          </span>
        </CardTitle>
        <CardDescription>
          <Skeleton className="h-3.5 w-56" />
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border overflow-hidden">
              <Skeleton className="aspect-4/3 max-h-36 w-full" />
              <div className="p-3 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-8 w-full rounded-md mt-2" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export const EducationSection = Object.assign(EducationSectionContent, {
  Skeleton: EducationSectionSkeleton,
});
