import { ReactNode } from 'react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { cn } from '@/lib/utils';

interface ScrollSectionProps {
  children: ReactNode;
  className?: string;
  animation?: 'fade-up' | 'fade-in' | 'slide-left' | 'slide-right' | 'scale-in';
  delay?: number;
}

export function ScrollSection({ children, className, animation = 'fade-up', delay = 0 }: ScrollSectionProps) {
  const { ref, isVisible } = useScrollAnimation(0.1);

  const animationClasses: Record<string, string> = {
    'fade-up': 'animate-fade-up',
    'fade-in': 'animate-fade-in',
    'slide-left': 'animate-slide-left',
    'slide-right': 'animate-slide-right',
    'scale-in': 'animate-scale-in',
  };

  return (
    <div
      ref={ref}
      className={cn(className)}
      style={{
        opacity: isVisible ? undefined : 0,
        animationDelay: isVisible ? `${delay}ms` : undefined,
      }}
    >
      <div className={cn(isVisible && animationClasses[animation])}>
        {children}
      </div>
    </div>
  );
}
