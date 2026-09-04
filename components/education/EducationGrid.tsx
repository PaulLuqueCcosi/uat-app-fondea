'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Play, FileText, ExternalLink, Search, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { EducationModuleSummary, Mascot } from '@/modules/education';

type FilterOption = 'todos' | 'buho' | 'ardilla';

function MascotIcon({ mascot }: { mascot: Mascot }) {
  return (
    <img
      src={mascot === 'buho' ? '/mascotas/Fondi_pet.png' : '/mascotas/Fondea_pet.png'}
      alt={mascot === 'buho' ? 'Fondi' : 'Fondea'}
      className="w-5 h-5 object-contain"
    />
  );
}

interface EducationGridProps {
  modules: EducationModuleSummary[];
}

export function EducationGrid({ modules }: EducationGridProps) {
  const [activeFilter, setActiveFilter] = useState<FilterOption>('todos');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredModules = useMemo(() => {
    let result = modules;

    if (activeFilter !== 'todos') {
      result = result.filter((m) => m.mascot === activeFilter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(
        (m) =>
          m.title.toLowerCase().includes(query) ||
          m.description.toLowerCase().includes(query)
      );
    }

    return result;
  }, [modules, activeFilter, searchQuery]);

  return (
    <>
      {/* Filtros + búsqueda */}
      <div className="flex items-center gap-2 flex-wrap">
        <Tabs
          defaultValue="todos"
          value={activeFilter}
          onValueChange={(v) => setActiveFilter(v as FilterOption)}
        >
          <TabsList>
            <TabsTrigger value="todos">
              📚 Todos
            </TabsTrigger>
            <TabsTrigger value="buho">
              <img src="/mascotas/Fondi_pet.png" alt="Fondi" className="w-4 h-4 object-contain" />
              Fondi
            </TabsTrigger>
            <TabsTrigger value="ardilla">
              <img src="/mascotas/Fondea_pet.png" alt="Fondea" className="w-4 h-4 object-contain" />
              Fondea
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative ml-auto">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 w-36 sm:w-44 rounded-lg border border-border bg-white pl-7 pr-7 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/30 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-neutral-200"
            >
              <X className="w-3 h-3 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>

      {/* Contador */}
      <p className="text-[10px] text-muted-foreground">
        {filteredModules.length} de {modules.length} módulos
      </p>

      {/* Sin resultados */}
      {filteredModules.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Search className="w-10 h-10 text-muted-foreground mb-3 opacity-30" />
          <p className="text-sm text-foreground font-medium">Sin resultados</p>
          <p className="text-xs text-muted-foreground mt-1">Intenta con otra búsqueda o filtro</p>
          <button
            onClick={() => { setSearchQuery(''); setActiveFilter('todos'); }}
            className="mt-3 text-xs text-primary font-medium hover:underline"
          >
            Limpiar filtros
          </button>
        </div>
      )}

      {/* Grid */}
      {filteredModules.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filteredModules.map((mod) => (
            <Link
              key={mod.id}
              href={`/dashboard/educacion/${mod.id}`}
              className="group"
            >
              <Card className="h-full transition-all hover:ring-2 hover:ring-primary/30 hover:shadow-md pt-0">
                <div className="relative aspect-video w-full overflow-hidden rounded-t-xl">
                  <img
                    src={mod.thumbnail}
                    alt={mod.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-black/40 to-transparent" />
                  <div className="absolute top-2 left-2">
                    <div className="flex items-center gap-1 rounded-full bg-white/90 backdrop-blur-sm px-1.5 py-0.5 shadow-sm">
                      <MascotIcon mascot={mod.mascot} />
                      <span className="text-[10px] font-medium text-neutral-700">
                        {mod.mascot === 'buho' ? 'Fondi' : 'Fondea'}
                      </span>
                    </div>
                  </div>
                  {mod.videoDuration && (
                    <div className="absolute bottom-2 right-2">
                      <div className="flex items-center gap-1 rounded bg-black/75 px-1.5 py-0.5">
                        <Play className="w-2.5 h-2.5 text-white fill-white" />
                        <span className="text-[10px] text-white font-medium">{mod.videoDuration}</span>
                      </div>
                    </div>
                  )}
                  <div className="absolute bottom-2 left-2">
                    <Badge variant="secondary" className="text-[9px] h-4 px-1.5 bg-white/90 text-neutral-700">
                      Módulo {mod.order}
                    </Badge>
                  </div>
                </div>

                <CardContent className="flex flex-col gap-1.5 pt-2.5 pb-3 px-3">
                  <h3 className="text-xs font-semibold text-foreground leading-tight group-hover:text-primary transition-colors line-clamp-2">
                    {mod.title}
                  </h3>
                  <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
                    {mod.description}
                  </p>
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
      )}
    </>
  );
}
