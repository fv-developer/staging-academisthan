import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  ChevronRight, X, LucideIcon 
} from 'lucide-react';
import logo from '@/assets/academisthan-logo-official.png';

export interface MenuItem {
  icon: LucideIcon;
  label: string;
  href: string;
  badge?: string;
  exact?: boolean;
}

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  menuItems: MenuItem[];
  title?: string;
}

export function Sidebar({ isOpen, onClose, menuItems, title = 'Menu' }: SidebarProps) {
  const location = useLocation();

  const isActive = (item: MenuItem) => {
    if (item.exact || item.href === '/dashboard' || item.href === '/admin') {
      return location.pathname === item.href;
    }
    return location.pathname.startsWith(item.href);
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-72 bg-white border-r transform transition-transform duration-300 ease-in-out lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header with Logo */}
          <div className="flex items-center justify-between h-16 px-6 border-b">
            <div className="flex items-center gap-2">
              <img 
                src={logo} 
                alt="Academisthan" 
                className="h-8 w-auto"
              />
              <span className="font-serif font-semibold text-lg bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                {title}
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={onClose}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1 py-4">
            <nav className="space-y-1 px-3">
              {menuItems.filter(item => item.label !== 'My Events').map((item) => {
                const active = isActive(item);
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={() => {
                      // Close sidebar on mobile after navigation
                      if (window.innerWidth < 1024) {
                        onClose();
                      }
                    }}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group",
                      active
                        ? "bg-[#161e3b] text-white shadow-sm"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-5 w-5 shrink-0 transition-transform group-hover:scale-110",
                        active ? "text-white" : ""
                      )}
                    />
                    <span className="flex-1">{item.label}</span>
                    
                    {item.badge && (
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-xs font-semibold",
                        active 
                          ? "bg-white/20 text-white" 
                          : "bg-muted text-muted-foreground"
                      )}>
                        {item.badge}
                      </span>
                    )}
                    
                    {active && (
                      <ChevronRight className="h-4 w-4 text-white" />
                    )}
                  </Link>
                );
              })}
            </nav>
          </ScrollArea>

          {/* Footer */}
          <div className="border-t p-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-bold text-sm">
                AP
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">Academisthan</p>
                <p className="text-xs text-muted-foreground">Premium Member</p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
