import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Loader2, X } from 'lucide-react';

export interface FormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  onSubmit?: () => void;
  onCancel?: () => void;
  submitText?: string;
  cancelText?: string;
  loading?: boolean;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showCloseButton?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-[95vw]',
};

export function FormModal({
  open,
  onOpenChange,
  title,
  description,
  children,
  onSubmit,
  onCancel,
  submitText = 'Salvar',
  cancelText = 'Cancelar',
  loading = false,
  disabled = false,
  size = 'md',
  showCloseButton = true,
  className = '',
}: FormModalProps) {
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      onOpenChange(false);
    }
  };

  const handleSubmit = () => {
    if (onSubmit && !loading && !disabled) {
      onSubmit();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`${sizeClasses[size]} ${className}`}>
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-semibold">{title}</DialogTitle>
              {description && (
                <DialogDescription className="text-muted-foreground mt-1">
                  {description}
                </DialogDescription>
              )}
            </div>
            {showCloseButton && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancel}
                disabled={loading}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </DialogHeader>

        <Separator className="my-4" />

        <div className="max-h-[70vh] overflow-y-auto">
          <Card className="border-0 shadow-none">
            <CardContent className="p-0">
              {children}
            </CardContent>
          </Card>
        </div>

        {(onSubmit || onCancel) && (
          <>
            <Separator className="my-4" />
            <DialogFooter className="flex items-center justify-end gap-2">
              {onCancel && (
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  disabled={loading}
                >
                  {cancelText}
                </Button>
              )}
              {onSubmit && (
                <Button
                  onClick={handleSubmit}
                  disabled={loading || disabled}
                  className="min-w-[100px]"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    submitText
                  )}
                </Button>
              )}
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Componente para seções do formulário
export function FormSection({
  title,
  children,
  className = '',
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`space-y-4 ${className}`}>
      {title && (
        <div className="border-b pb-2">
          <h3 className="text-lg font-medium text-foreground">{title}</h3>
        </div>
      )}
      {children}
    </div>
  );
}

// Componente para campos do formulário
export function FormField({
  label,
  required,
  error,
  children,
  className = '',
}: {
  label?: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="text-sm font-medium text-foreground">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </label>
      )}
      {children}
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}

// Componente para layout de campos em linha
export function FormRow({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${className}`}>
      {children}
    </div>
  );
}

// Componente para campos em coluna única
export function FormColumn({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`space-y-4 ${className}`}>
      {children}
    </div>
  );
}





