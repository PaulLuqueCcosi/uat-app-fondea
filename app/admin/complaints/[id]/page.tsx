import { getAdminComplaintDetail } from '@/modules/admin/admin-complaints.service';
import { ComplaintDetail } from '@/components/admin/complaints/ComplaintDetail';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { formatDate, formatDateTime } from '@/lib/admin-formatters';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AdminComplaintDetailPage({ params }: Props) {
  const { id } = await params;
  const complaint = await getAdminComplaintDetail(id);

  if (!complaint) {
    return (
      <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
        <Link href="/admin/complaints" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground w-fit">
          <ArrowLeft className="h-4 w-4" /> Reclamaciones
        </Link>
        <Card>
          <CardContent className="p-6 text-center text-sm text-muted-foreground">
            No se encontró la reclamación.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <Link href="/admin/complaints" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground w-fit">
        <ArrowLeft className="h-4 w-4" /> Reclamaciones
      </Link>

      <ComplaintDetail
        complaint={complaint}
        submittedDateDisplay={formatDate(complaint.submittedDate)}
        legalDeadlineDisplay={formatDate(complaint.legalDeadline)}
        respondedAtDisplay={complaint.respondedAt ? formatDateTime(complaint.respondedAt) : null}
      />
    </div>
  );
}
