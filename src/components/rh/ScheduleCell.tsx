import React from 'react';
import { ScheduleEntry, Holiday } from '@/integrations/supabase/rh-types';

interface ScheduleCellProps {
  entry?: ScheduleEntry & { shift?: { nome: string; hora_inicio: string; hora_fim: string } };
  holiday?: Holiday;
  isWeekend: boolean;
  shifts: any[];
  onClick: () => void;
}

export const ScheduleCell = ({ entry, holiday, isWeekend, shifts, onClick }: ScheduleCellProps) => {
  const getCellContent = () => {
    // Se é feriado, mostrar feriado
    if (holiday) {
      return {
        text: 'Frd.',
        bgColor: 'bg-orange-400',
        textColor: 'text-white',
        title: `Feriado: ${holiday.nome}`
      };
    }

    // Se tem entrada de escala
    if (entry) {
      switch (entry.tipo) {
        case 'turno':
          if (entry.shift) {
            return {
              text: entry.shift.nome,
              bgColor: getShiftColor(entry.shift.nome),
              textColor: 'text-white',
              title: `${entry.shift.nome} (${entry.shift.hora_inicio} - ${entry.shift.hora_fim})`
            };
          }
          return {
            text: 'Turno',
            bgColor: 'bg-blue-500',
            textColor: 'text-white',
            title: 'Turno não definido'
          };

        case 'folga':
          return {
            text: 'Folga',
            bgColor: 'bg-green-300',
            textColor: 'text-green-800',
            title: 'Dia de folga'
          };

        case 'ferias':
          return {
            text: 'Férias',
            bgColor: 'bg-yellow-400',
            textColor: 'text-yellow-900',
            title: 'Férias'
          };

        case 'atestado':
          return {
            text: 'Atestado',
            bgColor: 'bg-red-300',
            textColor: 'text-red-800',
            title: 'Atestado médico'
          };

        case 'falta':
          return {
            text: 'Falta',
            bgColor: 'bg-red-500',
            textColor: 'text-white',
            title: 'Falta'
          };

        default:
          return {
            text: entry.tipo,
            bgColor: 'bg-gray-400',
            textColor: 'text-white',
            title: entry.tipo
          };
      }
    }

    // Se é fim de semana e não tem entrada específica
    if (isWeekend) {
      return {
        text: 'S/Exp.',
        bgColor: 'bg-gray-300',
        textColor: 'text-gray-600',
        title: 'Sem expediente (fim de semana)'
      };
    }

    // Célula vazia
    return {
      text: '',
      bgColor: 'bg-white hover:bg-gray-100',
      textColor: 'text-gray-600',
      title: 'Clique para definir escala'
    };
  };

  const getShiftColor = (shiftName: string) => {
    // Cores baseadas no nome do turno (T1, T2, T3, T4)
    if (shiftName.includes('T1')) return 'bg-blue-500';
    if (shiftName.includes('T2')) return 'bg-red-500';
    if (shiftName.includes('T3')) return 'bg-gray-600';
    if (shiftName.includes('T4')) return 'bg-green-500';
    
    // Cores alternativas baseadas no nome
    const colors = [
      'bg-blue-500',
      'bg-red-500', 
      'bg-gray-600',
      'bg-green-500',
      'bg-purple-500',
      'bg-indigo-500',
      'bg-pink-500',
      'bg-teal-500'
    ];
    
    const hash = shiftName.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    return colors[Math.abs(hash) % colors.length];
  };

  const cellContent = getCellContent();

  return (
    <div
      className={`
        w-full h-10 border rounded cursor-pointer flex items-center justify-center text-xs font-medium
        transition-colors duration-200 min-h-[40px] min-w-[80px]
        ${cellContent.bgColor} ${cellContent.textColor}
        ${!entry && !holiday && !isWeekend ? 'border-dashed border-gray-300 hover:border-gray-400' : 'border-transparent'}
      `}
      onClick={onClick}
      title={cellContent.title}
    >
      <div className="text-center px-1">
        <div className="font-semibold truncate">{cellContent.text}</div>
        {entry?.observacoes && (
          <div className="text-xs opacity-75 truncate max-w-[70px]" title={entry.observacoes}>
            {entry.observacoes.length > 4 ? entry.observacoes.substring(0, 4) + '...' : entry.observacoes}
          </div>
        )}
      </div>
    </div>
  );
};
