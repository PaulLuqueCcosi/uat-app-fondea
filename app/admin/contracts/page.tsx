import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { mockContracts } from '@/modules/admin';

export default async function AdminContractsPage() {
  const contracts = mockContracts;

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <FileText className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Contratos</h1>
          <p className="text-sm text-muted-foreground">{contracts.length} contratos</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">ID</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Cliente</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Solicitud</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Estado</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Firma</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {contracts.map((contract) => (
                  <tr key={contract.id} className="border-b hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs">{contract.id}</td>
                    <td className="px-4 py-3">
                      <Link href={`/admin/users/${contract.userId}`} className="hover:text-primary">{contract.userName}</Link>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">
                      <Link href={`/admin/applications/${contract.applicationId}`} className="text-primary hover:underline">{contract.applicationId}</Link>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={contract.status === 'SIGNED' ? 'success' : 'warning'} className="text-[10px]">
                        {contract.status === 'SIGNED' ? 'Firmado' : 'Pendiente'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {contract.signedAt ? new Date(contract.signedAt).toLocaleDateString('es-PE') : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <Button variant="ghost" size="sm" disabled={contract.status !== 'SIGNED'}>
                        <Download className="h-3.5 w-3.5 mr-1" /> PDF
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
