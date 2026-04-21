import React from 'react';

interface AffiliateBannerProps {
  message: string;
  link: string;
  cta: string;
  type?: 'storm' | 'heat' | 'cold' | 'neutral';
}

export default function AffiliateBanner({ message, link, cta, type = 'neutral' }: AffiliateBannerProps) {
  const styles = {
    storm: 'bg-gradient-to-r from-slate-900 to-blue-900 border-blue-400/30 text-blue-100',
    heat: 'bg-gradient-to-r from-orange-600 to-red-600 border-orange-400/30 text-white',
    cold: 'bg-gradient-to-r from-blue-400 to-cyan-400 border-white/30 text-slate-900',
    neutral: 'bg-slate-900/80 border-white/10 text-white/90'
  };

  return (
    <div className={`w-full border-b backdrop-blur-md px-4 py-3 sticky top-0 z-[60] transition-all animate-in fade-in slide-in-from-top duration-500 ${styles[type]}`}>
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-center gap-4 text-center md:text-left">
        <div className="flex items-center gap-2">
          <span className="text-xl">
             {type === 'storm' && '🌪️'}
             {type === 'heat' && '🔥'}
             {type === 'cold' && '❄️'}
             {type === 'neutral' && '📢'}
          </span>
          <p className="text-xs md:text-sm font-black uppercase tracking-tight leading-tight">
            {message}
          </p>
        </div>
        <a 
          href={link} 
          target="_blank" 
          rel="noopener noreferrer"
          className="bg-white text-black px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-transform whitespace-nowrap shadow-xl"
        >
          {cta} →
        </a>
      </div>
    </div>
  );
}
