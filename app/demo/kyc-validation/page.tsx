import { FunnelKYCValidation } from '@/components/forms/solicitar/KYCValidation';

export default function DemoKYCValidationPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8">
        <div className="mb-6 text-center">
          <div className="inline-flex items-center gap-2 bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium mb-4">
            🚧 MODO DEMO - Solo para pruebas
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            Demo: Verificación de Identidad
          </h1>
          <p className="text-muted-foreground mt-2">
            Esta es una versión de demostración para pruebas. Los datos no se guardan.
          </p>
        </div>
        
        <FunnelKYCValidation 
          dashboardMode={true}
          initialData={null}
          initialBlocked={false}
          initialBlockedHoursLeft={0}
          initialAttemptsLeft={3}
        />
      </div>
    </div>
  );
}