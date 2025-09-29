import React from 'react';
import { useSidebarState } from '@/hooks/useSidebarState';
import { cn } from '@/lib/utils';

interface ResponsiveContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function ResponsiveContainer({ children, className }: ResponsiveContainerProps) {
  const { isCollapsed } = useSidebarState();

  return (
    <div className={cn(
      "container mx-auto py-6 transition-all duration-300 ease-in-out",
      isCollapsed ? "px-2" : "px-4",
      className
    )}>
      {children}
    </div>
  );
}

