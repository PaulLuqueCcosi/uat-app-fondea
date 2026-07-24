import { useState, useEffect } from 'react';
import { X, Plus, Settings, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export interface AmountBucketConfig {
  min: number;
  max: number | null;
  label: string;
}

interface AmountBucketsConfigProps {
  buckets: AmountBucketConfig[];
  onSave: (buckets: AmountBucketConfig[]) => void;
  disabled?: boolean;
}

function generateLabel(min: number, max: number | null): string {
  if (max === null) {
    return `S/${min}+`;
  }
  return `S/${min}-${max}`;
}

function validateBuckets(buckets: AmountBucketConfig[]): string | null {
  if (buckets.length === 0) {
    return 'Debe haber al menos un rango';
  }
  
  for (let i = 0; i < buckets.length; i++) {
    const b = buckets[i];
    const isLast = i === buckets.length - 1;
    
    // Validar mínimo
    if (Number.isNaN(b.min) || b.min < 0) {
      return `Rango ${i + 1}: el mínimo debe ser un número mayor o igual a 0`;
    }
    
    // Validar máximo: solo el último puede ser null
    if (b.max === null && !isLast) {
      return `Rango ${i + 1}: solo el último rango puede tener el máximo abierto (∞)`;
    }
    
    // Si tiene máximo, validar que sea mayor al mínimo
    if (b.max !== null) {
      if (Number.isNaN(b.max)) {
        return `Rango ${i + 1}: el máximo debe ser un número válido`;
      }
      if (b.max <= b.min) {
        return `Rango ${i + 1}: el máximo (${b.max}) debe ser mayor al mínimo (${b.min})`;
      }
    }
    
    // Validar que no se solape con el rango anterior
    if (i > 0) {
      const prev = buckets[i - 1];
      
      // El rango anterior debe tener máximo (ya validado arriba)
      if (prev.max === null) {
        return `Error: el rango ${i} no puede tener máximo abierto si no es el último`;
      }
      
      // El mínimo actual debe ser >= al máximo anterior
      if (b.min < prev.max) {
        return `Rango ${i + 1}: el mínimo (${b.min}) debe ser mayor o igual al máximo del rango anterior (${prev.max})`;
      }
    }
  }
  
  return null;
}

export function AmountBucketsConfig({ buckets, onSave, disabled }: AmountBucketsConfigProps) {
  const [open, setOpen] = useState(false);
  const [localBuckets, setLocalBuckets] = useState<AmountBucketConfig[]>(buckets);
  const [error, setError] = useState<string | null>(null);

  // Resetear cuando se abre el modal
  useEffect(() => {
    if (open) {
      setLocalBuckets(buckets);
      setError(null);
    }
  }, [open, buckets]);

  const handleAdd = () => {
    const last = localBuckets[localBuckets.length - 1];
    let nextMin = 0;
    
    if (last) {
      // Si el último rango era abierto (null), ahora debe tener un máximo
      if (last.max === null) {
        // Convertir el último rango de abierto a cerrado
        const updatedLast = {
          ...last,
          max: last.min + 100,
          label: generateLabel(last.min, last.min + 100),
        };
        setLocalBuckets((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = updatedLast;
          return updated;
        });
        nextMin = last.min + 100;
      } else {
        nextMin = last.max;
      }
    }
    
    const newBucket: AmountBucketConfig = {
      min: nextMin,
      max: nextMin + 100,
      label: generateLabel(nextMin, nextMin + 100),
    };
    
    setLocalBuckets((prev) => [...prev, newBucket]);
    setError(null);
  };

  const handleRemove = (index: number) => {
    if (localBuckets.length === 1) {
      setError('Debe haber al menos un rango');
      return;
    }
    setLocalBuckets((prev) => prev.filter((_, i) => i !== index));
    setError(null);
  };

  const handleMinChange = (index: number, value: string) => {
    const num = Number(value);
    if (value.trim() === '' || Number.isNaN(num)) return;
    
    setLocalBuckets((prev) =>
      prev.map((b, i) => {
        if (i !== index) return b;
        const newBucket = { ...b, min: num };
        // Auto-generar label
        newBucket.label = generateLabel(newBucket.min, newBucket.max);
        return newBucket;
      })
    );
    setError(null);
  };

  const handleMaxChange = (index: number, value: string) => {
    const isLastBucket = index === localBuckets.length - 1;
    
    setLocalBuckets((prev) =>
      prev.map((b, i) => {
        if (i !== index) return b;
        
        let newMax: number | null;
        
        if (value.trim() === '') {
          // Solo el último puede tener máximo vacío (null)
          if (isLastBucket) {
            newMax = null;
          } else {
            // Si no es el último, mantener el valor anterior o poner un valor por defecto
            newMax = b.max ?? (b.min + 100);
          }
        } else {
          newMax = Number(value);
        }
        
        const newBucket = { ...b, max: newMax };
        // Auto-generar label
        newBucket.label = generateLabel(newBucket.min, newBucket.max);
        return newBucket;
      })
    );
    setError(null);
  };

  const handleSave = () => {
    const sorted = [...localBuckets].sort((a, b) => a.min - b.min);
    const validationError = validateBuckets(sorted);
    if (validationError) {
      setError(validationError);
      return;
    }
    onSave(sorted);
    setError(null);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm" className="gap-1" disabled={disabled}>
            <Settings className="h-3.5 w-3.5" /> Configurar rangos
          </Button>
        }
      />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Configurar rangos de monto</DialogTitle>
          <DialogDescription>
            Define los rangos para agrupar los préstamos por monto. Los labels se generan automáticamente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 max-h-[400px] overflow-y-auto py-2 pr-2">
          {localBuckets.map((bucket, index) => {
            const isFirst = index === 0;
            const isLast = index === localBuckets.length - 1;
            
            return (
              <div key={index} className="border rounded-lg p-3 bg-muted/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-muted-foreground">
                    Rango {index + 1}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemove(index)}
                    disabled={disabled || localBuckets.length === 1}
                    className="h-7 px-2 text-destructive hover:text-destructive"
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-2">
                  <div>
                    <Label className="text-xs mb-1">Mínimo (S/)</Label>
                    <Input
                      type="number"
                      value={bucket.min}
                      onChange={(e) => handleMinChange(index, e.target.value)}
                      className="h-9"
                      disabled={disabled}
                      min={0}
                      step={10}
                    />
                  </div>
                  <div>
                    <Label className="text-xs mb-1">
                      Máximo (S/) {isLast && <span className="text-muted-foreground">(vacío = ∞)</span>}
                      {!isLast && <span className="text-red-500">*</span>}
                    </Label>
                    <Input
                      type="number"
                      value={bucket.max ?? ''}
                      onChange={(e) => handleMaxChange(index, e.target.value)}
                      className="h-9"
                      disabled={disabled}
                      min={bucket.min + 1}
                      step={10}
                      placeholder={isLast ? 'Opcional: dejar vacío para ∞' : 'Requerido'}
                      required={!isLast}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end">
                  <div className="text-sm font-medium text-primary">
                    {bucket.label}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <DialogFooter className="flex justify-between sm:justify-between gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleAdd} 
            disabled={disabled}
            className="gap-1"
          >
            <Plus className="h-4 w-4" /> Agregar rango
          </Button>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setOpen(false)}
              disabled={disabled}
            >
              Cancelar
            </Button>
            <Button 
              size="sm" 
              onClick={handleSave} 
              disabled={disabled}
            >
              Guardar cambios
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
