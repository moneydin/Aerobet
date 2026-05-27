
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Banner } from '../types';

interface BannerCarouselProps {
  banners: Banner[];
  onOpenWallet: () => void;
  onOpenTournaments: () => void;
  onOpenSubscription: () => void;
}

const BannerCarousel: React.FC<BannerCarouselProps> = ({ banners, onOpenWallet, onOpenTournaments, onOpenSubscription }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const activeBanners = banners.filter(b => b.active);

  useEffect(() => {
    if (activeBanners.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeBanners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [activeBanners.length]);

  if (activeBanners.length === 0) return null;

  const handleAction = (action?: string) => {
    if (!action) return;
    if (action.startsWith('http')) {
      window.open(action, '_blank');
    } else if (action === 'wallet') {
      onOpenWallet();
    } else if (action === 'tournaments') {
      onOpenTournaments();
    } else if (action === 'subscription') {
      onOpenSubscription();
    }
  };

  const currentBanner = activeBanners[currentIndex];

  return (
    <div className="relative w-full h-32 md:h-40 overflow-hidden rounded-2xl border border-white/5 bg-[#141516] shadow-xl">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentBanner.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="absolute inset-0 flex items-center"
        >
          {/* Background Image with Gradient Overlay */}
          <div className="absolute inset-0 z-0">
            <img 
              src={currentBanner.image} 
              alt="" 
              className="w-full h-full object-cover opacity-20"
              referrerPolicy="no-referrer"
            />
            <div className={`absolute inset-0 bg-gradient-to-r ${currentBanner.color} opacity-40`} />
            <div className="absolute inset-0 bg-gradient-to-r from-[#141516] via-transparent to-transparent" />
          </div>

          {/* Content */}
          <div className="relative z-10 px-6 md:px-10 flex flex-col justify-center h-full max-w-2xl">
            <motion.span 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-[10px] font-black uppercase tracking-[0.3em] text-white/60 mb-1"
            >
              Destaque do Dia
            </motion.span>
            <motion.h2 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-xl md:text-3xl font-black italic uppercase tracking-tighter text-white leading-none mb-2"
            >
              {currentBanner.title}
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-xs md:text-sm text-white/70 font-medium mb-4 max-w-md line-clamp-1 md:line-clamp-none"
            >
              {currentBanner.subtitle}
            </motion.p>
            {currentBanner.hasButton && (
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 }}
                onClick={() => handleAction(currentBanner.buttonAction)}
                className={`w-fit px-6 py-2 rounded-xl bg-white text-black font-black uppercase text-[10px] tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg`}
              >
                {currentBanner.buttonText}
              </motion.button>
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Indicators */}
      {activeBanners.length > 1 && (
        <div className="absolute bottom-4 right-6 flex gap-1.5 z-20">
          {activeBanners.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`h-1 rounded-full transition-all duration-300 ${currentIndex === idx ? 'w-6 bg-white' : 'w-2 bg-white/20'}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default BannerCarousel;
