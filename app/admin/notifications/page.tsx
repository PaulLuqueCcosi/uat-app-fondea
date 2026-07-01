'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Bell, Send, Search, X } from 'lucide-react';
import { mockNotifications, mockUsers } from '@/modules/admin';

export default function AdminNotificationsPage() {
  const notifications = mockNotifications;
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState('normal');

  const filteredUsers = searchQuery.length > 0
    ? mockUsers.filter((u) =>
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.dni?.includes(searchQuery)
      )
    : [];

  const handleSend = () => {
    // Simulación de envío
    alert(`Notificación enviada a ${mockUsers.find((u) => u.id === selectedUser)?.name}`);
    setSendDialogOpen(false);
    setSelectedUser(null);
    setSearchQuery('');
    setTitle('');
    setMessage('');
    setPriority('normal');
  };

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
        <Button size="sm" onClick={() => setSendDialogOpen(true)}>
          <Send className="h-3.5 w-3.5 mr-1" /> Enviar notificación
        </Button>
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

      {/* Dialog Enviar Notificación */}
      <Dialog open={sendDialogOpen} onOpenChange={setSendDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Enviar Notificación Manual</DialogTitle>
            <DialogDescription>
              Selecciona un cliente y redacta el mensaje.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Buscador de cliente */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Cliente</label>
              {selectedUser ? (
                <div className="flex items-center justify-between bg-muted/50 rounded-lg px-3 py-2">
                  <span className="text-sm">
                    {mockUsers.find((u) => u.id === selectedUser)?.name}
                  </span>
                  <Button variant="ghost" size="icon-sm" onClick={() => { setSelectedUser(null); setSearchQuery(''); }}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nombre o DNI..."
                    className="pl-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {filteredUsers.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-popover border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {filteredUsers.map((u) => (
                        <button
                          key={u.id}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors"
                          onClick={() => { setSelectedUser(u.id); setSearchQuery(''); }}
                        >
                          <p className="font-medium">{u.name}</p>
                          <p className="text-xs text-muted-foreground">DNI: {u.dni}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Título</label>
              <Input
                placeholder="Ej: Recordatorio de pago"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Mensaje</label>
              <textarea
                className="w-full min-h-[80px] rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Escribe el mensaje..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Prioridad</label>
              <div className="flex gap-2">
                {(['normal', 'high', 'urgent'] as const).map((p) => (
                  <Button
                    key={p}
                    variant={priority === p ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPriority(p)}
                    className="text-xs capitalize"
                  >
                    {p === 'normal' ? 'Normal' : p === 'high' ? 'Alta' : 'Urgente'}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSendDialogOpen(false)}>Cancelar</Button>
            <Button
              onClick={handleSend}
              disabled={!selectedUser || !title.trim() || !message.trim()}
            >
              <Send className="h-3.5 w-3.5 mr-1" /> Enviar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
