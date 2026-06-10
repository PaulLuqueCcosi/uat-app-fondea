import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  Play,
  FileText,
  Download,
  ExternalLink,
  BookOpen,
  CheckCircle,
  Clock,
  Lightbulb,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { getModuleById, getAllModuleIds } from '@/lib/education/get-modules';
import { modules } from '@/lib/education/modules';
import type { Mascot } from '@/lib/education/types';

export async function generateStaticParams() {
  const ids = await getAllModuleIds();
  return ids.map((moduleId) => ({ moduleId }));
}

function MascotBanner({ mascot }: { mascot: Mascot }) {
  const isBuho = mascot === 'buho';
  return (
    <div className={`flex items-center gap-3 rounded-lg px-4 py-3 ${isBuho ? 'bg-primary/5 border border-primary/10' : 'bg-accent-50 border border-accent-200'}`}>
      <img
        src={isBuho ? '/mascotas/Fondi_pet.png' : '/mascotas/Fondea_pet.png'}
        alt={isBuho ? 'Fondi' : 'Fondea'}
        className="w-10 h-10 object-contain"
      />
      <div>
        <p className={`text-sm font-semibold ${isBuho ? 'text-primary-700' : 'text-accent-800'}`}>
          {isBuho ? 'Fondi — El Búho Maestro' : 'Fondea — La Ardilla Asistente'}
        </p>
        <p className="text-xs text-muted-foreground">
          {isBuho
            ? 'Te explica conceptos financieros de forma clara y directa'
            : 'Te acompaña con consejos prácticos para el día a día'}
        </p>
      </div>
    </div>
  );
}

export default async function EducacionModulePage({
  params,
}: {
  params: Promise<{ moduleId: string }>;
}) {
  const { moduleId } = await params;
  const mod = await getModuleById(moduleId);

  if (!mod) {
    notFound();
  }

  const currentIndex = modules.findIndex((m) => m.id === moduleId);
  const prevModule = currentIndex > 0 ? modules[currentIndex - 1] : null;
  const nextModule = currentIndex < modules.length - 1 ? modules[currentIndex + 1] : null;

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 lg:p-8">
      {/* Navegación superior */}
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/dashboard/educacion"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Volver a Fondea Aprende</span>
          <span className="sm:hidden">Volver</span>
        </Link>
        <div className="flex items-center gap-1.5">
          {prevModule && (
            <Link href={`/dashboard/educacion/${prevModule.id}`}>
              <Button variant="outline" size="icon-sm">
                <ArrowLeft className="w-3.5 h-3.5" />
              </Button>
            </Link>
          )}
          <Badge variant="outline" className="text-[10px]">
            {mod.order} / {modules.length}
          </Badge>
          {nextModule && (
            <Link href={`/dashboard/educacion/${nextModule.id}`}>
              <Button variant="outline" size="icon-sm">
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="secondary">Módulo {mod.order}</Badge>
          {mod.videoDuration && (
            <Badge variant="outline" className="gap-1">
              <Clock className="w-3 h-3" />
              {mod.videoDuration} de video
            </Badge>
          )}
        </div>

        {/* Título + Mascota lado a lado */}
        <div className="flex items-start gap-4">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground leading-tight">
              {mod.title}
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-prose mt-2">
              {mod.description}
            </p>
          </div>
          {/* Mascota alineada con el título */}
          <div className="shrink-0 hidden sm:block">
            <img
              src={mod.mascot === 'buho' ? '/mascotas/Fondi_pet.png' : '/mascotas/Fondea_pet.png'}
              alt={mod.mascot === 'buho' ? 'Fondi' : 'Fondea'}
              className="w-20 h-20 object-contain"
            />
            <p className="text-[10px] text-center text-primary mt-1">
              {mod.mascot === 'buho' ? 'Fondi' : 'Fondea'}
            </p>
          </div>
        </div>
      </div>

      {/* ═══ 2 COLUMNAS ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── IZQUIERDA (2/3): Video + Enlaces ── */}
        <div className="lg:col-span-2 flex flex-col gap-6">

          {/* Video */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <div className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10">
                  <Play className="w-3.5 h-3.5 text-primary fill-primary" />
                </div>
                Video Snack
                {mod.videoDuration && (
                  <span className="text-xs text-muted-foreground ml-auto font-normal">
                    {mod.videoDuration}
                  </span>
                )}
              </CardTitle>
              {mod.videoTitle && (
                <CardDescription className="pl-9">{mod.videoTitle}</CardDescription>
              )}
            </CardHeader>
            <CardContent>
              {mod.videoUrl ? (
                <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-neutral-100 border border-border shadow-sm">
                  <iframe
                    src={mod.videoUrl}
                    title={mod.videoTitle || mod.title}
                    className="absolute inset-0 w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center aspect-video w-full rounded-lg bg-neutral-100 border border-border">
                  <div className="text-center space-y-2">
                    <Play className="w-12 h-12 text-muted-foreground mx-auto" />
                    <p className="text-sm text-muted-foreground">Video próximamente</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Profundiza más — enlaces */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <div className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10">
                  <ExternalLink className="w-3.5 h-3.5 text-primary" />
                </div>
                Profundiza más
              </CardTitle>
              <CardDescription className="pl-9">
                Recursos oficiales de instituciones reconocidas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {mod.externalLinks.map((link, i) => (
                  <a
                    key={i}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center gap-3 rounded-lg border border-border p-3 hover:border-primary/30 hover:bg-primary/5 transition-all"
                  >
                    <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-neutral-100 group-hover:bg-primary/10 transition-colors shrink-0">
                      <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground group-hover:text-primary transition-colors leading-tight">
                        {link.label}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{link.institution}</p>
                    </div>
                  </a>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── DERECHA (1/3): Resumen + Guía + Siguiente ── */}
        <div className="lg:col-span-1">
          <div className="lg:sticky lg:top-20 space-y-4">

            {/* Resumen / Texto blog */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <div className="flex items-center justify-center w-7 h-7 rounded-full bg-accent-100">
                    <BookOpen className="w-3.5 h-3.5 text-accent-800" />
                  </div>
                  Resumen
                </CardTitle>
                <CardDescription className="pl-9">
                  Lectura: {Math.ceil(mod.bodyParagraphs.join(' ').split(' ').length / 200)} min
                </CardDescription>
              </CardHeader>
              <CardContent>
                <article>
                  {mod.bodyParagraphs.map((paragraph, i) => (
                    <p
                      key={i}
                      className="text-xs text-foreground leading-relaxed mb-3 last:mb-0"
                    >
                      {paragraph}
                    </p>
                  ))}
                </article>
              </CardContent>
            </Card>

            {/* Puntos clave */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <div className="flex items-center justify-center w-7 h-7 rounded-full bg-success-50">
                    <Lightbulb className="w-3.5 h-3.5 text-success-700" />
                  </div>
                  Puntos clave
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2.5">
                  {mod.summaryPoints.map((point, i) => (
                    <li key={i} className="flex gap-2 items-start">
                      <CheckCircle className="w-3.5 h-3.5 text-success-600 shrink-0 mt-0.5" />
                      <span className="text-xs text-foreground leading-relaxed">{point}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Material descargable */}
            {mod.downloadUrl && (
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-error-50 border border-error-100 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5 text-error-500" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-foreground leading-tight">
                        {mod.downloadLabel}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">PDF — Gratis</p>
                    </div>
                  </div>
                  <a href={mod.downloadUrl} target="_blank" rel="noopener noreferrer" className="block">
                    <Button variant="default" size="sm" className="w-full gap-2">
                      <Download className="w-3.5 h-3.5" />
                      Descargar gratis
                    </Button>
                  </a>
                </CardContent>
              </Card>
            )}

          </div>
        </div>
      </div>

      {/* Navegación inferior */}
      <Separator className="mt-2" />
      <div className="flex items-center justify-between gap-4 pb-4">
        {prevModule ? (
          <Link href={`/dashboard/educacion/${prevModule.id}`} className="group flex items-center gap-3 min-w-0 max-w-[45%]">
            <ArrowLeft className="w-4 h-4 text-muted-foreground group-hover:text-primary shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] text-muted-foreground">Anterior</p>
              <p className="text-xs font-medium text-foreground group-hover:text-primary transition-colors truncate">
                {prevModule.title}
              </p>
            </div>
          </Link>
        ) : (
          <div />
        )}
        {nextModule ? (
          <Link href={`/dashboard/educacion/${nextModule.id}`} className="group flex items-center gap-3 text-right min-w-0 max-w-[45%]">
            <div className="min-w-0">
              <p className="text-[10px] text-muted-foreground">Siguiente</p>
              <p className="text-xs font-medium text-foreground group-hover:text-primary transition-colors truncate">
                {nextModule.title}
              </p>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary shrink-0" />
          </Link>
        ) : (
          <div />
        )}
      </div>
    </div>
  );
}
