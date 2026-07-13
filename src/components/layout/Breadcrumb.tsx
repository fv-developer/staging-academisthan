import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <nav className={cn("flex items-center space-x-1 text-sm", className)} aria-label="Breadcrumb">
      <Link 
        to="/dashboard" 
        className="flex items-center text-muted-foreground hover:text-foreground transition-colors"
      >
        <Home className="h-4 w-4" />
      </Link>
      
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        
        return (
          <div key={index} className="flex items-center">
            <ChevronRight className="h-4 w-4 text-muted-foreground mx-1" />
            
            {item.href && !isLast ? (
              <Link
                to={item.href}
                className="text-muted-foreground hover:text-foreground transition-colors font-medium"
              >
                {item.label}
              </Link>
            ) : (
              <span className={cn(
                "font-medium",
                isLast ? "text-foreground" : "text-muted-foreground"
              )}>
                {item.label}
              </span>
            )}
          </div>
        );
      })}
    </nav>
  );
}
