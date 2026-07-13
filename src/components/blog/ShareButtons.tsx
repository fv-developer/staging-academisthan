import { Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface ShareButtonsProps {
  title: string;
  url?: string;
}

export function ShareButtons({ title, url }: ShareButtonsProps) {
  const { toast } = useToast();
  const shareUrl = url || window.location.href;
  const encoded = encodeURIComponent(shareUrl);
  const encodedTitle = encodeURIComponent(title);

  const channels = [
    { label: 'WhatsApp', icon: '💬', href: `https://wa.me/?text=${encodedTitle}%20${encoded}`, color: 'hover:bg-[hsl(142,70%,40%)]/15 hover:text-[hsl(142,70%,40%)]' },
    { label: 'LinkedIn', icon: 'in', href: `https://www.linkedin.com/sharing/share-offsite/?url=${encoded}`, color: 'hover:bg-[hsl(210,80%,50%)]/15 hover:text-[hsl(210,80%,50%)]' },
    { label: 'Twitter', icon: '𝕏', href: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encoded}`, color: 'hover:bg-foreground/10 hover:text-foreground' },
    { label: 'Facebook', icon: 'f', href: `https://www.facebook.com/sharer/sharer.php?u=${encoded}`, color: 'hover:bg-[hsl(220,46%,48%)]/15 hover:text-[hsl(220,46%,48%)]' },
  ];

  const copyLink = async () => {
    await navigator.clipboard.writeText(shareUrl);
    toast({ title: 'Link copied! 📋' });
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs text-muted-foreground flex items-center gap-1">
        <Share2 className="w-3.5 h-3.5" /> Share:
      </span>
      {channels.map((ch) => (
        <a
          key={ch.label}
          href={ch.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Share on ${ch.label}`}
          className={`w-8 h-8 rounded-lg border border-border flex items-center justify-center text-xs font-bold text-muted-foreground transition-colors ${ch.color}`}
        >
          {ch.icon}
        </a>
      ))}
      <button
        onClick={copyLink}
        className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-xs text-muted-foreground hover:bg-gold/10 hover:text-gold transition-colors"
        aria-label="Copy link"
      >
        🔗
      </button>
    </div>
  );
}
