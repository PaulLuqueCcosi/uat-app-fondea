'use client';

import { useState } from 'react';
import Link from 'next/link';
import { GraduationCap, Play, FileText, ExternalLink, Filter } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageTitle } from '@/components/ui/page-title';
import { modules } from '@/lib/education/modules';
import type { Mascot } from '@/lib/education/types';

type FilterOption = 'todos' | 'buho' | 'ardilla';

const filters: { value: FilterOption; label: string; icon: string }[] = [
  { value: 'todos', label: 'Todos', icon: '📚' },
  { value: 'buho', label: 'El Búho Maestro', icon: '🦉' },
  { value: 'ardilla', label: 'La Ardilla Asistente', icon: '🐿️' },
];

function MascotIcon({ mascot }: { mascot: Mascot }) {
  return (
    <span className="text-sm" aria-hidden="true">
      {mascot === 'buho' ? '🦉' : '🐿️'}
    </span>
  );
}

export default function EducacionPage() {
  const [activeFilter, setActiveFilter] = useState<FilterOption>('todos');

  const filteredModules =
    activeFilter === 'todos'
      ? modules
      : modules.filter((m) => m.mascot === activeFilter);

  return (
    <div className="flex flex-1 flex-col gap-5 p-4 md:p-6">
      <PageTitle
        title="Fondea Aprende"
        description="Educación financiera práctica para tomar mejores decisiones con tu dinero. 7 módulos diseñados para empoderar tu manejo financiero."
      />

      {/* Filtros */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-4 h-4 text-muted-foreground" />
        {filters.map((filter) => (
          <Button
            key={filter.value}
            variant={activeFilter === filter.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveFilter(filter.value)}
            className="gap-1.5"
          >
            <span>{filter.icon}</span>
            {filter.label}
          </Button>
        ))}
      </div>

      {/* Contador */}
      <p className="text-xs text-muted-foreground">
        Mostrando {filteredModules.length} de {modules.length} módulos
      </p>

      {/* Grid de módulos — cards compactas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {filteredModules.map((mod) => (
          <Link
            key={mod.id}
            href={`/dashboard/educacion/${mod.id}`}
            className="group"
          >
            <Card className="h-full transition-all hover:ring-2 hover:ring-primary/30 hover:shadow-md">
              {/* Thumbnail compacto */}
              <div className="relative aspect-video w-full overflow-hidden rounded-t-xl">
                <img
                  src={mod.thumbnail}
                  alt={mod.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {/* Overlay oscuro sutil */}
                <div className="absolute inset-0 bg-linear-to-t from-black/40 to-transparent" />
                {/* Mascota */}
                <div className="absolute top-2 left-2">
                  <div className="flex items-center gap-1 rounded-full bg-white/90 backdrop-blur-sm px-1.5 py-0.5 shadow-sm">
                    <MascotIcon mascot={mod.mascot} />
                    <span className="text-[10px] font-medium text-neutral-700">
                      {mod.mascot === 'buho' ? 'Búho' : 'Ardilla'}
                    </span>
                  </div>
                </div>
                {/* Duración */}
                {mod.videoDuration && (
                  <div className="absolute bottom-2 right-2">
                    <div className="flex items-center gap-1 rounded bg-black/75 px-1.5 py-0.5">
                      <Play className="w-2.5 h-2.5 text-white fill-white" />
                      <span className="text-[10px] text-white font-medium">{mod.videoDuration}</span>
                    </div>
                  </div>
                )}
                {/* Módulo número */}
                <div className="absolute bottom-2 left-2">
                  <Badge variant="secondary" className="text-[9px] h-4 px-1.5 bg-white/90 text-neutral-700">
                    Módulo {mod.order}
                  </Badge>
                </div>
              </div>

              <CardContent className="flex flex-col gap-1.5 pt-2.5 pb-3 px-3">
                {/* Título */}
                <h3 className="text-xs font-semibold text-foreground leading-tight group-hover:text-primary transition-colors line-clamp-2">
                  {mod.title}
                </h3>

                {/* Descripción corta */}
                <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
                  {mod.description}
                </p>

                {/* Indicadores */}
                <div className="flex items-center gap-2 pt-1 mt-auto">
                  {mod.videoUrl && (
                    <span className="flex items-center gap-0.5 text-[9px] text-muted-foreground">
                      <Play className="w-2.5 h-2.5" />
                      Video
                    </span>
                  )}
                  {mod.downloadUrl && (
                    <span className="flex items-center gap-0.5 text-[9px] text-muted-foreground">
                      <FileText className="w-2.5 h-2.5" />
                      PDF
                    </span>
                  )}
                  {mod.externalLinks.length > 0 && (
                    <span className="flex items-center gap-0.5 text-[9px] text-muted-foreground">
                      <ExternalLink className="w-2.5 h-2.5" />
                      {mod.externalLinks.length}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
