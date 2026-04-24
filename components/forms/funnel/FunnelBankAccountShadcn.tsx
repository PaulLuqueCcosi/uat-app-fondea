'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Building2, Wallet, CreditCard } from 'lucide-react';
import { getCurrentStep } from '@/lib/funnel-steps';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  Form,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { Separator } from '@/components/ui/separator';
import { StickyBottomBar } from '@/components/ui/sticky-bottom-bar';
import { FormHeader } from '@/components/ui/form-header';
import { saveBankAccount } from '@/app/actions/loan.actions';

interface FunnelBankAccountProps {
  dashboardMode?: boolean;
}

interface SectionHeaderProps {
  title: string;
  description: string;
}

function SectionHeader({ title, description }: SectionHeaderProps) {
  return (
    <div className="space-y-1">
      <h2 className="font-semibold text-primary">{title}</h2>
      <p className="text-muted-foreground text-sm">{description}</p>
    </div>
  );
}

const BANKS = [
  { value: 'BCP', label: 'BCP' },
  { value: 'BBVA', label: 'BBVA' },
  { value: 'Interbank', label: 'Interbank' },
  { value: 'Scotiabank', label: 'Scotiabank' },
  { value: 'Banco de la Nación', label: 'Banco de la Nación' },
  { value: 'Banco Pichincha', label: 'Banco Pichincha' },
  { value: 'BanBif', label: 'BanBif' },
  { value: 'Falabella', label: 'Falabella' },
  { value: 'Ripley', label: 'Ripley' },
  { value: 'Otro', label: 'Otro' },
];

const bankAccountFormSchema = z.object({
  bank: z.string().min(1, 'Selecciona tu banco'),
  cci: z
    .string()
    .length(20, 'El CCI debe tener exactamente 20 dígitos')
    .regex(/^\d+$/, 'Solo se permiten números'),
});

type BankAccountFormValues = z.infer<typeof bankAccountFormSchema>;

export function FunnelBankAccountShadcn({ dashboardMode = false }: FunnelBankAccountProps) {
  const router = useRouter();
  const pathname = usePathname();
  const currentStep = getCurrentStep(pathname);

  const form = useForm<BankAccountFormValues>({
    resolver: zodResolver(bankAccountFormSchema),
    defaultValues: {
      bank: '',
      cci: '',
    },
  });

  const onSubmit = async (data: BankAccountFormValues) => {
    const bankAccountData = {
      bank: data.bank,
      accountType: 'savings',
      accountNumber: '',
      cci: data.cci,
    };

    await saveBankAccount(bankAccountData);

    if (dashboardMode) {
      router.push('/dashboard');
    } else {
      router.push(currentStep?.nextPath || '/funnel/summary');
    }
  };

  const content = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-full">
        {/* Info importante */}
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-10">
          <p className="text-sm text-foreground">
            La cuenta debe estar a tu nombre y debe ser una cuenta en soles.
          </p>
        </div>

        {/* Sección: Datos bancarios */}
        <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
          <SectionHeader
            title="Datos bancarios"
            description="Para recibir el desembolso"
          />

          <div className="space-y-8 md:col-span-2">
            <FormField
              control={form.control}
              name="bank"
              render={({ field }) => (
                <FormItem className="flex flex-col gap-1">
                  <FormLabel>Banco</FormLabel>
                  <NativeSelect {...field} className="w-full">
                    <NativeSelectOption value="">Selecciona tu banco</NativeSelectOption>
                    {BANKS.map((opt) => (
                      <NativeSelectOption key={opt.value} value={opt.value}>
                        {opt.label}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                  <FormDescription>El banco donde tienes tu cuenta</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="cci"
              render={({ field }) => (
                <FormItem className="flex flex-col gap-1">
                  <FormLabel>Código de Cuenta Interbancario (CCI)</FormLabel>
                  <Input
                    placeholder="00212345678901234567"
                    {...field}
                    className="w-full"
                    maxLength={20}
                    onChange={(e) => {
                      const cleaned = e.target.value.replace(/\D/g, '').slice(0, 20);
                      field.onChange(cleaned);
                    }}
                  />
                  <FormDescription>20 dígitos que identifican tu cuenta</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Info sobre CCI */}
            <div className="bg-muted/50 rounded-lg p-4 border border-border">
              <p className="text-xs text-muted-foreground">
                <strong>¿Dónde encuentro mi CCI?</strong> Lo puedes encontrar en tu app bancaria,
                banca por internet, o solicitándolo en una agencia. Es un código de 20 dígitos.
              </p>
            </div>
          </div>
        </div>

        <Separator className="my-10 bg-primary/20 h-px" />

        {/* Botones de acción */}
        {!dashboardMode && (
          <div className="flex flex-col sm:flex-row justify-end gap-3">
            <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => router.back()}>
              Atrás
            </Button>
            <Button
              type="submit"
              className="w-full sm:w-auto"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? 'Guardando...' : 'Continuar'}
            </Button>
          </div>
        )}
      </form>
    </Form>
  );

  if (dashboardMode) {
    return (
      <>
        {content}
        <StickyBottomBar
          ctaLabel="Guardar cambios"
          onCta={form.handleSubmit(onSubmit)}
          loading={form.formState.isSubmitting}
        />
      </>
    );
  }

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader className="pb-4">
        <FormHeader
          icon={currentStep?.icon || CreditCard}
          title={currentStep?.title || "Cuenta bancaria para desembolso"}
          description={currentStep?.description || "Ingresa la cuenta donde recibirás el dinero del préstamo"}
        />
      </CardHeader>
      <CardContent className="pt-0">
        {content}
      </CardContent>
    </Card>
  );
}
