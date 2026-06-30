import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bell, Send } from 'lucide-react';
import { mockNotifications } from '@/modules/admin';

export default async function AdminNotificationsPage() {
  const notifications = mockNotifications;

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Bell className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Notificaciones</h1>
            <p className="text-sm text-muted-foreground">Historial y envío de notificaciones</p>
          </div>
        </div>
        <Button size="sm"><Send className="h-3.5 w-3.5 mr-1" /> Enviar notificación</Button>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Historial de envíos</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {notifications.map((ntf) => (
              <div key={ntf.id} className="flex items-start gap-3 px-4 py-3">
                <div className="pt-0.5">
                  <span className={`block w-2 h-2 rounded-full ${
                    ntf.priority === 'urgent' ? 'bg-destructive' :
                    ntf.priority === 'high' ? 'bg-warning-500' :
                    'bg-muted-foreground'
                  }`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">{ntf.title}</p>
                    <Badge variant="outline" className="text-[9px] shrink-0">{ntf.type}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{ntf.message}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    Para: {ntf.userName} · {new Date(ntf.sentAt).toLocaleString('es-PE')}
                    {ntf.read && ' · Leída'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
