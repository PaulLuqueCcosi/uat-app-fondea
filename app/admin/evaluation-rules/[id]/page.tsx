'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Copy, Loader2, FileCode2 } from 'lucide-react';
import { toast } from 'sonner';
import { DetailPageHeader } from '@/components/admin/shared';
import {
  getVersionByIdAction,
  activateVersionAction,
} from '@/app/actions/admin-evaluation-rules.actions';
import type { RuleSetVersionResponse } from '@/modules/admin/admin-evaluation-rules.service';
import { VersionDetail } from '@/components/admin/evaluation-rules/VersionDetail';

export default function EvaluationRuleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [version, setVersion] = useState<RuleSetVersionResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const res = await getVersionByIdAction(id);
      if (res.ok && res.data) setVersion(res.data);
      setLoading(false);
    }
    load();
  }, [id]);

  const handleActivate = async () => {
    if (!confirm('¿Activar esta versión?')) return;
    const res = await activateVersionAction(id);
    if (res.ok) {
      toast.success('Versión activada');
      router.push('/admin/evaluation-rules');
    } else {
      toast.error(res.error ?? 'Error al activar');
    }
  };

  const handleDuplicate = () => {
    router.push(`/admin/evaluation-rules/${id}/edit`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-16">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!version) {
    return <div className="p-6 text-center text-muted-foreground">Versión no encontrada</div>;
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <DetailPageHeader
        icon={<FileCode2 className="h-5 w-5 text-primary" />}
        title={`${version.type === 'eliminatory' ? 'Eliminatoria' : 'Scoring'} — v${version.version}`}
        badge={version.active ? { label: 'Activa', variant: 'success' } : { label: 'Inactiva', variant: 'secondary' }}
        backHref="/admin/evaluation-rules"
        backLabel="Motor de evaluación"
      >
        <div className="flex gap-2">
          {!version.active && (
            <Button variant="outline" size="sm" onClick={handleActivate} className="gap-1.5 text-green-600">
              <Play className="h-3.5 w-3.5" /> Activar
            </Button>
          )}
          <Button size="sm" onClick={handleDuplicate} className="gap-1.5">
            <Copy className="h-3.5 w-3.5" /> Tomar como base
          </Button>
        </div>
      </DetailPageHeader>

      {/* Reutilizar el componente de detalle que ya existe */}
      <VersionDetail version={version} onClose={() => router.push('/admin/evaluation-rules')} />
    </div>
  );
}
