
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface Banner {
  id: number;
  title: string;
  subtitle: string;
  image: string;
  color: string;
}

const AeroFantasyBanners: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const banners: Banner[] = [
    {
      id: 1,
      title: "LIGA DOS MULTIPLICADORES",
      subtitle: "Acumule os maiores multiplicadores em 10 voos e ganhe R$ 25.000.",
      image: "https://images.unsplash.com/photo-1596838132731-3301c3fd4317?q=80&w=2940&auto=format&fit=crop",
      color: "from-[#34b1e2] to-[#2096c4]"
    },
    {
      id: 2,
      title: "LIGA JACKPOT VELA",
      subtitle: "Acerte velas acima de 10x e concorra ao prêmio acumulado de R$ 10.000.",
      image: "https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=2942&auto=format&fit=crop",
      color: "from-[#e51a31] to-[#8b0010]"
    },
    {
      id: 3,
      title: "RANKING MENSAL",
      subtitle: "Os 10 melhores pilotos do mês dividem um prêmio de R$ 50.000.",
      image: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?q=80&w=2832&auto=format&fit=crop",
      color: "from-[#d97d1b] to-[#8b4513]"
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [banners.length]);

  return (
    <div className="relative w-full h-28 overflow-hidden rounded-xl border border-white/5 bg-[#141516] mb-4">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.6 }}
          className="absolute inset-0"
        >
          <img 
            src={banners[currentIndex].image} 
            alt="" 
            className="w-full h-full object-cover opacity-30"
            referrerPolicy="no-referrer"
          />
          <div className={`absolute inset-0 bg-gradient-to-r ${banners[currentIndex].color} opacity-40`} />
          <div className="absolute inset-0 bg-gradient-to-t from-[#141516] to-transparent" />
          
          <div className="absolute inset-0 flex flex-col justify-center px-6">
            <motion.h3 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-lg font-black italic uppercase tracking-tighter text-white leading-none mb-1"
            >
              {banners[currentIndex].title}
            </motion.h3>
            <motion.p 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-[10px] text-white/70 font-bold uppercase tracking-wider max-w-[80%]"
            >
              {banners[currentIndex].subtitle}
            </motion.p>
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="absolute bottom-2 right-4 flex gap-1">
        {banners.map((_, idx) => (
          <div
            key={idx}
            className={`h-1 rounded-full transition-all duration-300 ${currentIndex === idx ? 'w-4 bg-white' : 'w-1 bg-white/20'}`}
          />
        ))}
      </div>
    </div>
  );
};

export default AeroFantasyBanners;
