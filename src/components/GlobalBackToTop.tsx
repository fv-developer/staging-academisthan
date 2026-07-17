import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronUp } from 'lucide-react';

export function GlobalBackToTop() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 200) {
        setShow(true);
      } else {
        const body = document.getElementById('lms-player-body');
        if (body && body.scrollTop > 200) {
          setShow(true);
        } else {
          setShow(false);
        }
      }
    };

    window.addEventListener('scroll', handleScroll);

    let bodyEl: HTMLElement | null = null;
    const checkBodyScroll = () => {
      const body = document.getElementById('lms-player-body');
      if (body && body !== bodyEl) {
        bodyEl = body;
        body.addEventListener('scroll', handleScroll);
      }
    };

    const interval = setInterval(checkBodyScroll, 1000);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (bodyEl) {
        bodyEl.removeEventListener('scroll', handleScroll);
      }
      clearInterval(interval);
    };
  }, []);

  if (!show) return null;

  return (
    <Button
      onClick={() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        const body = document.getElementById('lms-player-body');
        if (body) body.scrollTo({ top: 0, behavior: 'smooth' });
      }}
      className="fixed bottom-6 right-6 z-[9999] w-10 h-10 rounded-full bg-[#cfa459] hover:bg-[#b8914b] text-[#222] hover:text-[#222] flex items-center justify-center shadow-lg transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 hover:scale-105"
      size="icon"
      title="Back to Top"
    >
      <ChevronUp className="w-5 h-5 stroke-[2.5]" />
    </Button>
  );
}
