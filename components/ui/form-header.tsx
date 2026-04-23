import { LucideIcon } from 'lucide-react';

interface FormHeaderProps {
  title: string;
  description: string;
  icon?: LucideIcon;
  step?: number;
}

export function FormHeader({ title, description, icon: Icon, step }: FormHeaderProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        {(Icon || step) && (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-lg">
            {Icon ? <Icon className="h-5 w-5" /> : step}
          </div>
        )}
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
          <p className="text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="h-1 w-full bg-gradient-to-r from-primary via-primary/50 to-transparent rounded-full" />
    </div>
  );
}
