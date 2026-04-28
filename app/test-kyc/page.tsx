import { FunnelKYCValidation } from '@/components/forms/funnel/FunnelKYCValidation';

export default function TestKYCPage() {
  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Prueba del Formulario KYC
          </h1>
          <p className="text-muted-foreground">
            Formulario de validación de datos personales
          </p>
        </div>
        
        <FunnelKYCValidation />
        
        <div className="mt-12 max-w-3xl mx-auto">
          <div className="bg-muted/30 rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Datos de prueba:</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div>
                <h3 className="font-medium mb-2">DNIs para probar:</h3>
                <ul className="space-y-1">
                  <li><strong>12345678</strong> - Validación exitosa</li>
                  <li><strong>00000000</strong> - DNI no encontrado</li>
                  <li><strong>11111111</strong> - Datos no coinciden</li>
                  <li><strong>22222222</strong> - DNI con observaciones</li>
                  <li><strong>99999999</strong> - Timeout de servicio</li>
                </ul>
              </div>
              <div>
                <h3 className="font-medium mb-2">Datos válidos:</h3>
                <ul className="space-y-1">
                  <li><strong>Primer nombre:</strong> JUAN</li>
                  <li><strong>Segundo nombre:</strong> CARLOS (opcional)</li>
                  <li><strong>Primer apellido:</strong> PÉREZ</li>
                  <li><strong>Segundo apellido:</strong> GARCÍA (opcional)</li>
                  <li><strong>Código:</strong> 123 (usar 000 para error)</li>
                </ul>
              </div>
            </div>
            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800">
                <strong>Nota:</strong> Este formulario simula la validación con RENIEC. 
                En producción se conectaría a la API real de validación de identidad.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}