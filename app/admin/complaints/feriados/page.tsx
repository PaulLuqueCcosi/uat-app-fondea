import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getAdminComplaintHolidays } from '@/modules/admin/admin-complaint-holidays.service';
import { ComplaintHolidaysClient } from '@/components/admin/complaints/ComplaintHolidaysClient';

export default async function AdminComplaintHolidaysPage() {
  const holidays = await getAdminComplaintHolidays();

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <Link
        href="/admin/complaints"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground w-fit"
      >
        <ArrowLeft className="h-4 w-4" /> Reclamaciones
      </Link>

      <ComplaintHolidaysClient initialHolidays={holidays} />
    </div>
  );
}
