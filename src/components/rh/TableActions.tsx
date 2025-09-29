// @ts-nocheck
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  Clock,
  Download,
  Copy,
  Archive,
  Unarchive,
  UserCheck,
  UserX,
} from 'lucide-react';

export interface ActionItem {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  disabled?: boolean;
  confirm?: {
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
  };
}

export interface TableActionsProps {
  item: any;
  actions: ActionItem[];
  showDropdown?: boolean;
  maxVisibleActions?: number;
  className?: string;
}

export function TableActions({
  item,
  actions,
  showDropdown = true,
  maxVisibleActions = 2,
  className = '',
}: TableActionsProps) {
  const [confirmAction, setConfirmAction] = React.useState<ActionItem | null>(null);
  const [confirmOpen, setConfirmOpen] = React.useState(false);

  const visibleActions = actions.slice(0, maxVisibleActions);
  const dropdownActions = actions.slice(maxVisibleActions);

  const handleAction = (action: ActionItem) => {
    if (action.confirm) {
      setConfirmAction(action);
      setConfirmOpen(true);
    } else {
      action.onClick();
    }
  };

  const executeConfirmedAction = () => {
    if (confirmAction) {
      confirmAction.onClick();
      setConfirmOpen(false);
      setConfirmAction(null);
    }
  };

  return (
    <>
      <div className={`flex items-center gap-1 ${className}`}>
        {/* Ações visíveis */}
        {visibleActions.map((action, index) => (
          <Button
            key={index}
            variant={action.variant || 'ghost'}
            size="sm"
            onClick={() => handleAction(action)}
            disabled={action.disabled}
            className="h-8 w-8 p-0"
            title={action.label}
          >
            {action.icon || <MoreHorizontal className="h-4 w-4" />}
          </Button>
        ))}

        {/* Dropdown para ações adicionais */}
        {showDropdown && dropdownActions.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Ações</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {dropdownActions.map((action, index) => (
                <DropdownMenuItem
                  key={index}
                  onClick={() => handleAction(action)}
                  disabled={action.disabled}
                  className={action.variant === 'destructive' ? 'text-destructive' : ''}
                >
                  {action.icon && <span className="mr-2">{action.icon}</span>}
                  {action.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Modal de confirmação */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmAction?.confirm?.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.confirm?.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {confirmAction?.confirm?.cancelText || 'Cancelar'}
            </AlertDialogCancel>
            <AlertDialogAction onClick={executeConfirmedAction}>
              {confirmAction?.confirm?.confirmText || 'Confirmar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// Componentes de ações pré-definidas
export function ViewAction({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      disabled={disabled}
      className="h-8 w-8 p-0"
      title="Visualizar"
    >
      <Eye className="h-4 w-4" />
    </Button>
  );
}

export function EditAction({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      disabled={disabled}
      className="h-8 w-8 p-0"
      title="Editar"
    >
      <Edit className="h-4 w-4" />
    </Button>
  );
}

export function DeleteAction({ 
  onClick, 
  disabled, 
  confirmTitle = 'Confirmar exclusão',
  confirmDescription = 'Tem certeza que deseja excluir este item? Esta ação não pode ser desfeita.',
}: { 
  onClick: () => void; 
  disabled?: boolean;
  confirmTitle?: string;
  confirmDescription?: string;
}) {
  return (
    <TableActions
      item={{}}
      actions={[{
        label: 'Excluir',
        icon: <Trash2 className="h-4 w-4" />,
        onClick,
        variant: 'destructive',
        disabled,
        confirm: {
          title: confirmTitle,
          description: confirmDescription,
          confirmText: 'Excluir',
          cancelText: 'Cancelar',
        },
      }]}
      showDropdown={false}
      maxVisibleActions={1}
    />
  );
}

export function StatusAction({ 
  status, 
  onApprove, 
  onReject, 
  onPending,
  disabled = false,
}: { 
  status: string;
  onApprove?: () => void;
  onReject?: () => void;
  onPending?: () => void;
  disabled?: boolean;
}) {
  const getStatusIcon = () => {
    switch (status) {
      case 'aprovado':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'rejeitado':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'pendente':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'aprovado':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejeitado':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'pendente':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const actions: ActionItem[] = [];

  if (onApprove && status !== 'aprovado') {
    actions.push({
      label: 'Aprovar',
      icon: <CheckCircle className="h-4 w-4" />,
      onClick: onApprove,
      variant: 'default',
      disabled,
    });
  }

  if (onReject && status !== 'rejeitado') {
    actions.push({
      label: 'Rejeitar',
      icon: <XCircle className="h-4 w-4" />,
      onClick: onReject,
      variant: 'destructive',
      disabled,
    });
  }

  if (onPending && status !== 'pendente') {
    actions.push({
      label: 'Marcar como Pendente',
      icon: <Clock className="h-4 w-4" />,
      onClick: onPending,
      variant: 'outline',
      disabled,
    });
  }

  return (
    <div className="flex items-center gap-2">
      <Badge variant="outline" className={getStatusColor()}>
        {getStatusIcon()}
        <span className="ml-1 capitalize">{status}</span>
      </Badge>
      
      {actions.length > 0 && (
        <TableActions
          item={{}}
          actions={actions}
          showDropdown={false}
          maxVisibleActions={actions.length}
        />
      )}
    </div>
  );
}

export function EmployeeStatusAction({ 
  status, 
  onChangeStatus,
  disabled = false,
}: { 
  status: string;
  onChangeStatus: (newStatus: string) => void;
  disabled?: boolean;
}) {
  const statusOptions = [
    { value: 'ativo', label: 'Ativo', icon: <UserCheck className="h-4 w-4" />, variant: 'default' as const },
    { value: 'inativo', label: 'Inativo', icon: <UserX className="h-4 w-4" />, variant: 'secondary' as const },
    { value: 'demitido', label: 'Demitido', icon: <UserX className="h-4 w-4" />, variant: 'destructive' as const },
    { value: 'aposentado', label: 'Aposentado', icon: <UserCheck className="h-4 w-4" />, variant: 'outline' as const },
    { value: 'licenca', label: 'Licença', icon: <Clock className="h-4 w-4" />, variant: 'outline' as const },
  ];

  const currentStatus = statusOptions.find(s => s.value === status);
  const otherStatuses = statusOptions.filter(s => s.value !== status);

  const actions: ActionItem[] = otherStatuses.map(statusOption => ({
    label: `Marcar como ${statusOption.label}`,
    icon: statusOption.icon,
    onClick: () => onChangeStatus(statusOption.value),
    variant: statusOption.variant,
    disabled,
  }));

  return (
    <div className="flex items-center gap-2">
      <Badge variant="outline" className={`capitalize ${currentStatus ? `bg-${currentStatus.variant === 'default' ? 'green' : currentStatus.variant === 'destructive' ? 'red' : 'gray'}-100 text-${currentStatus.variant === 'default' ? 'green' : currentStatus.variant === 'destructive' ? 'red' : 'gray'}-800 border-${currentStatus.variant === 'default' ? 'green' : currentStatus.variant === 'destructive' ? 'red' : 'gray'}-200` : ''}`}>
        {currentStatus?.icon}
        <span className="ml-1">{currentStatus?.label}</span>
      </Badge>
      
      {actions.length > 0 && (
        <TableActions
          item={{}}
          actions={actions}
          showDropdown={false}
          maxVisibleActions={1}
        />
      )}
    </div>
  );
}





