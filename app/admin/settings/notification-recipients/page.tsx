import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getAdminAlertRecipients } from '@/modules/admin/admin-notification-recipients.service';
import { NotificationRecipientsClient } from '@/components/admin/notifications/NotificationRecipientsClient';

export default async function AdminNotificationRecipientsPage() {
  const recipients = await getAdminAlertRecipients();

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <Link
        href="/admin/settings"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground w-fit"
      >
        <ArrowLeft className="h-4 w-4" /> Configuración
      </Link>

      <NotificationRecipientsClient initialRecipients={recipients} />
    </div>
  );
}
