import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Calculator, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';

import heritageNalanda from '@/assets/hero/heritage-nalanda.jpg';
import heritageGurukul from '@/assets/hero/heritage-gurukul.jpg';
import heritageHall from '@/assets/hero/heritage-hall.jpg';
import heritageManuscripts from '@/assets/hero/heritage-manuscripts.jpg';
import heritageCampus from '@/assets/hero/heritage-campus.jpg';
import heroProfessor from '@/assets/hero-professor.jpg';

const heritageImages = [
  { src: heritageNalanda, label: '1 — Nalanda University' },
  { src: heritageGurukul, label: '2 — Gurukul under Banyan' },
  { src: heritageHall, label: '3 — Grand Convocation Hall' },
  { src: heritageManuscripts, label: '4 — Ancient Manuscripts & Diya' },
  { src: heritageCampus, label: '5 — Heritage Campus at Dawn' },
];

function HeroContent() {
  return (
    <div className="relative z-10 text-center max-w-4xl mx-auto px-4 space-y-8">
      <div className="animate-fade-up" style={{ animationDelay: '0.2s' }}>
        <span className="inline-block px-4 py-1.5 rounded-full bg-gold/10 border border-gold/20 text-gold text-sm font-medium tracking-wider uppercase mb-6">
          Of the Teachers · By the Teachers · For the Teachers
        </span>
      </div>
      <h1 className="animate-fade-up font-serif text-5xl md:text-7xl lg:text-8xl font-bold text-warm leading-tight" style={{ animationDelay: '0.4s' }}>
        Acade<span className="text-gradient-gold">misthan</span>
      </h1>
      <p className="animate-fade-up text-warm/70 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed font-light" style={{ animationDelay: '0.6s' }}>
        "Teachers should be the best minds in the country."
        <span className="block text-warm/50 mt-2">"The true teachers are those who help us think for ourselves."</span>
        <span className="block text-sm text-warm/40 mt-2">— Dr. Sarvepalli Radhakrishnan</span>
      </p>
      <div className="animate-fade-up flex flex-col sm:flex-row gap-4 justify-center pt-4" style={{ animationDelay: '0.8s' }}>
        <Link to="/auth/signup">
          <Button size="lg" className="bg-gold text-gold-foreground hover:bg-gold/90 text-lg px-8 py-6 rounded-xl font-semibold shadow-[0_0_30px_hsl(38_55%_58%/0.3)] hover:shadow-[0_0_50px_hsl(38_55%_58%/0.5)] transition-all">
            Become a Fellow <Sparkles className="h-5 w-5 ml-2" />
          </Button>
        </Link>
        <Link to="/tools/api-score">
          <Button size="lg" variant="outline" className="border-gold/30 text-gold hover:bg-gold/10 text-lg px-8 py-6 rounded-xl">
            Calculate Your API Score <Calculator className="h-5 w-5 ml-2" />
          </Button>
        </Link>
      </div>
    </div>
  );
}

/* ─── OPTION A: Heritage Slideshow ─── */
function HeroSlideshow() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % heritageImages.length);
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative h-screen flex items-center justify-center overflow-hidden">
      {heritageImages.map((img, i) => (
        <div
          key={i}
          className="absolute inset-0 transition-opacity duration-[1500ms] ease-in-out"
          style={{ opacity: i === current ? 1 : 0 }}
        >
          <img src={img.src} alt={img.label} className="w-full h-full object-cover" />
        </div>
      ))}
      <div className="absolute inset-0 bg-gradient-to-b from-navy/80 via-navy/55 to-navy/90" />

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <div key={i} className="absolute w-1 h-1 bg-gold/30 rounded-full"
            style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`, animation: `float ${3 + Math.random() * 4}s ease-in-out infinite`, animationDelay: `${Math.random() * 3}s` }}
          />
        ))}
      </div>

      <HeroContent />

      {/* Navigation */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3 z-20">
        <button onClick={() => setCurrent((p) => (p - 1 + heritageImages.length) % heritageImages.length)} className="text-gold/50 hover:text-gold transition-colors">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="flex gap-2">
          {heritageImages.map((_, i) => (
            <button key={i} onClick={() => setCurrent(i)}
              className={`h-2 rounded-full transition-all duration-300 ${i === current ? 'bg-gold w-6' : 'bg-warm/30 w-2 hover:bg-warm/50'}`}
            />
          ))}
        </div>
        <button onClick={() => setCurrent((p) => (p + 1) % heritageImages.length)} className="text-gold/50 hover:text-gold transition-colors">
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Current image label */}
      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20">
        <span className="text-warm/40 text-xs font-medium bg-navy/50 backdrop-blur-sm px-3 py-1 rounded-full">
          {heritageImages[current].label}
        </span>
      </div>
    </section>
  );
}

/* ─── OPTION B: Single Static per image ─── */
function HeroSingle({ index }: { index: number }) {
  const img = heritageImages[index];
  return (
    <section className="relative h-screen flex items-center justify-center overflow-hidden">
      <img src={img.src} alt={img.label} className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-b from-navy/80 via-navy/55 to-navy/90" />
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <div key={i} className="absolute w-1 h-1 bg-gold/30 rounded-full"
            style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`, animation: `float ${3 + Math.random() * 4}s ease-in-out infinite`, animationDelay: `${Math.random() * 3}s` }}
          />
        ))}
      </div>
      <HeroContent />
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 rounded-full border-2 border-gold/30 flex items-start justify-center p-1.5">
          <div className="w-1.5 h-3 bg-gold/50 rounded-full" />
        </div>
      </div>
    </section>
  );
}

/* ─── PREVIEW PAGE ─── */
export default function HeroPreview() {
  const [mode, setMode] = useState<'slideshow' | number>('slideshow');

  return (
    <div className="min-h-screen bg-background website-page">
      {/* Switcher bar */}
      <div className="fixed top-0 left-0 right-0 z-[100] bg-navy/95 backdrop-blur-xl border-b border-gold/20 px-4 py-3">
        <div className="container mx-auto flex flex-wrap items-center justify-center gap-2">
          <span className="text-warm/60 text-sm font-medium mr-2">Preview:</span>
          <button
            onClick={() => setMode('slideshow')}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${mode === 'slideshow' ? 'bg-gold text-gold-foreground' : 'bg-gold/10 text-gold border border-gold/20 hover:bg-gold/20'}`}
          >
            🎞️ All 5 Slideshow
          </button>
          {heritageImages.map((img, i) => (
            <button
              key={i}
              onClick={() => setMode(i)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${mode === i ? 'bg-gold text-gold-foreground' : 'bg-gold/10 text-gold border border-gold/20 hover:bg-gold/20'}`}
            >
              {img.label}
            </button>
          ))}
        </div>
      </div>

      {mode === 'slideshow' ? <HeroSlideshow /> : <HeroSingle index={mode} />}

      {/* Description */}
      <div className="bg-navy py-12">
        <div className="container mx-auto px-4 max-w-3xl text-center space-y-4">
          <h2 className="font-serif text-2xl font-bold text-warm">
            {mode === 'slideshow' ? '🎞️ Slideshow Mode — All 5 Images Auto-rotating' : `📸 ${heritageImages[mode as number].label}`}
          </h2>
          <p className="text-warm/60 leading-relaxed">
            {mode === 'slideshow'
              ? 'All 5 heritage images rotate every 4.5 seconds with smooth crossfade. Users can also click the dots or arrows to navigate manually.'
              : 'This single image as a static hero background. Click other tabs above to compare.'}
          </p>
          <p className="text-gold text-sm font-medium">Click each tab above to preview how each image looks as the hero background</p>
        </div>
      </div>
    </div>
  );
}
