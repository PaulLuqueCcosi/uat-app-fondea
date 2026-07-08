'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { FormSubmission } from '@/modules/admin';
import { getFieldLabel, formatFieldValue } from '@/modules/admin/admin-form-labels';

interface FormCurrentDataCardProps {
  submission: FormSubmission | null;
  formKey?: string;
}

export function FormCurrentDataCard({ submission, formKey = '' }: FormCurrentDataCardProps) {
  if (!submission || submission.verificationResult !== 'APPROVED') {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Datos actuales</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Sin datos aprobados disponibles.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Datos actuales (último envío aprobado)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {Object.entries(submission.submissionData).map(([key, value]) => (
            <div key={key} className="space-y-0.5">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                {getFieldLabel(formKey, key)}
              </p>
              <p className="text-sm font-medium">{formatFieldValue(value)}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
