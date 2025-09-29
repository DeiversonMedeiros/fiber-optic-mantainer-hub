import { useSidebar } from '@/components/ui/sidebar';

export function useSidebarState() {
  const { state, isMobile } = useSidebar();
  const isCollapsed = state === "collapsed";
  
  return {
    isCollapsed,
    isMobile,
    state
  };
}

