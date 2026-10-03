import React from 'react';
import { useLandingConfig, DEFAULT_LANDING_CONFIG } from '../src/utils/landingConfig';

interface ModeSelectionPortalProps {
  onSelectMode: (mode: 'aerogame' | 'aerobet' | 'aerofantasy') => void;
  onSelectCabineMode?: () => void;
  onOpenStore: () => void;
  onOpenHangar: () => void;
}

export const ModeSelectionPortal: React.FC<ModeSelectionPortalProps> = ({
  onSelectMode,
  onSelectCabineMode,
  onOpenStore,
  onOpenHangar
}) => {
  const { config } = useLandingConfig();

  const aerobetImg = config.aerobetImage || DEFAULT_LANDING_CONFIG.aerobetImage;
  const aerofantasyImg = config.aerofantasyImage || DEFAULT_LANDING_CONFIG.aerofantasyImage;

  return (
    <div className="w-full flex-1 flex flex-col font-sans text-white select-none pb-12 overflow-y-auto relative z-10">
      {/* Background Image Layer if configured */}
      {config.backgroundImage && (
        <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
          <img
            src={config.backgroundImage}
            alt="Landing Background"
            className="w-full h-full object-cover transition-all duration-700"
            style={{
              filter: config.backgroundBlur > 0 ? `blur(${config.backgroundBlur}px)` : undefined,
              transform: config.backgroundBlur > 0 ? 'scale(1.05)' : undefined,
            }}
          />
          <div
            className="absolute inset-0 bg-[#09090b]"
            style={{ opacity: config.backgroundOpacity ?? 0.5 }}
          />
        </div>
      )}

      {/* Dynamic Keyframes for ambient lighting */}
      <style>{`
        @keyframes pulseGlowRed {
          0%, 100% { box-shadow: 0 0 25px rgba(229, 26, 49, 0.25); }
          50% { box-shadow: 0 0 55px rgba(229, 26, 49, 0.5); }
        }
        @keyframes pulseGlowBlue {
          0%, 100% { box-shadow: 0 0 25px rgba(52, 177, 226, 0.25); }
          50% { box-shadow: 0 0 55px rgba(52, 177, 226, 0.5); }
        }
      `}</style>

      {/* Hero Presentation Banner */}
      <section className="relative rounded-3xl overflow-hidden border border-white/10 bg-gradient-to-b from-[#16171b] via-[#0d0e11] to-[#08090a] p-6 sm:p-10 shadow-2xl mb-8 text-center sm:text-left">
        {config.heroBannerImage && (
          <div className="absolute inset-0 z-0">
            <img
              src={config.heroBannerImage}
              alt="Hero Banner"
              className="w-full h-full object-cover opacity-25"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#16171b] via-[#16171b]/60 to-transparent" />
          </div>
        )}
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-red-600/15 blur-[120px] pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-sky-500/15 blur-[120px] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.04)_0%,transparent_70%)] pointer-events-none" />

        <div className="relative z-10 max-w-4xl space-y-3">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-red-600/20 to-sky-500/20 border border-white/10 px-3.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-white/80">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            <span>Portal de Entrada Oficial Aerofantasy</span>
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
          </div>

          <h1 className="text-2xl sm:text-4xl md:text-5xl font-black italic uppercase tracking-tighter text-white leading-tight">
            Escolha seu <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#e51a31] via-red-400 to-[#34b1e2]">Modo de Jogo</span>
          </h1>

          <p className="text-xs sm:text-sm md:text-base text-white/70 leading-relaxed font-medium">
            Seja bem-vindo a bordo! O Aerofantasy oferece duas modalidades exclusivas: a intensidade do crash game tradicional com multiplicador em tempo real e saques imediatos (<strong className="text-red-400">AeroGame</strong>) e a arena esportiva de campeonatos e ligas competitivas por pontuação (<strong className="text-sky-400">AeroFantasy</strong>). Clique no modo desejado para entrar diretamente:
          </p>
        </div>
      </section>

      {/* THE TWO GRAND MODES (CARDS) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10 items-stretch">
        
        {/* ============================================================== */}
        {/* CARD 1: MODO AEROGAME (Crash Clássico) */}
        {/* ============================================================== */}
        <div className="relative rounded-3xl border border-red-500/30 bg-gradient-to-b from-[#1a0a0d] via-[#120709] to-[#090304] overflow-hidden flex flex-col justify-between shadow-2xl transition-all duration-300 hover:border-red-500 group" style={{ animation: 'pulseGlowRed 8s infinite ease-in-out' }}>
          {/* Visual Header Image */}
          <div className="h-56 sm:h-64 relative overflow-hidden">
            <img 
              src={aerobetImg} 
              alt="Modo AeroGame" 
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700 brightness-90"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1a0a0d] via-[#1a0a0d]/40 to-transparent" />
            
            <div className="absolute top-4 left-4 bg-red-600/90 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg shadow-lg border border-red-400/40">
              Crash Multiplayer ao Vivo
            </div>

            <div className="absolute top-4 right-4 bg-black/70 backdrop-blur-md text-emerald-400 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border border-emerald-500/30 flex items-center gap-1.5 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Decolagens Contínuas
            </div>

            <div className="absolute bottom-4 left-5 right-5 text-left">
              <span className="text-[11px] font-bold uppercase tracking-widest text-red-400 block mb-0.5">Adrenalina Pura & Controle Manual</span>
              <h2 className="text-3xl sm:text-4xl font-black italic uppercase tracking-tighter text-white drop-shadow-md">
                AEROGAME <span className="text-red-500 text-2xl font-black">CRASH</span>
              </h2>
            </div>
          </div>

          {/* Content Body */}
          <div className="p-6 sm:p-8 flex-1 flex flex-col justify-between space-y-6">
            <div className="space-y-4 text-left">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-white/50 mb-1.5">O Que É Este Modo</h3>
                <p className="text-xs sm:text-sm text-white/80 leading-relaxed font-medium">
                  O clássico jogo de multiplicador em tempo real. A cada nova rodada, o caça supersônico decola e a curva sobe de 1.00x até mais de 100x+. Você tem controle absoluto sobre o momento de ejetar (<strong className="text-red-400">Cashout</strong>). Se sair antes do jato sumir, seu ganho é creditado no mesmo instante!
                </p>
              </div>

              {/* Key Mechanics */}
              <div className="space-y-2.5 pt-2 border-t border-white/5">
                <h3 className="text-xs font-bold uppercase tracking-widest text-white/50">Mecânicas Principais</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  <div className="bg-white/5 rounded-xl p-3 border border-white/5 flex flex-col gap-1">
                    <span className="font-black text-red-400 uppercase text-[11px]">⚡ Ejetar no Milissegundo</span>
                    <span className="text-white/60 text-[11px] leading-snug">Você decide o segundo exato de sair com 1 clique ou programa o auto-cashout.</span>
                  </div>

                  <div className="bg-white/5 rounded-xl p-3 border border-white/5 flex flex-col gap-1">
                    <span className="font-black text-red-400 uppercase text-[11px]">🎰 Painel Duplo de Apostas</span>
                    <span className="text-white/60 text-[11px] leading-snug">Faça 2 apostas simultâneas (uma conservadora e uma arrojada na mesma rodada).</span>
                  </div>

                  <div className="bg-white/5 rounded-xl p-3 border border-white/5 flex flex-col gap-1">
                    <span className="font-black text-red-400 uppercase text-[11px]">🤖 Gestão & Estratégias</span>
                    <span className="text-white/60 text-[11px] leading-snug">Automações com Martingale, Soros e limites rígidos de Stop-Loss e Stop-Win.</span>
                  </div>

                  <div className="bg-white/5 rounded-xl p-3 border border-white/5 flex flex-col gap-1">
                    <span className="font-black text-red-400 uppercase text-[11px]">🔄 Ritmo Frenético</span>
                    <span className="text-white/60 text-[11px] leading-snug">Uma nova decolagem acontece a cada poucos segundos com centenas de pilotos.</span>
                  </div>
                </div>
              </div>

              {/* Recommendation */}
              <div className="p-3.5 bg-red-950/20 border border-red-500/20 rounded-xl text-xs">
                <span className="font-bold text-red-400 uppercase text-[10px] block mb-1">Para quem é recomendado:</span>
                <p className="text-white/70 text-[11.5px] leading-relaxed">
                  Pilotos que querem ação imediata, controle total sobre o tempo da aposta e resultados segundo a segundo com retiradas diretas.
                </p>
              </div>
            </div>

            {/* 2 Modos de Operação no AeroGame: Solo vs Cabine */}
            <div className="pt-2 space-y-3">
              <div className="flex items-center justify-between border-t border-white/10 pt-3">
                <span className="text-[11px] font-black uppercase tracking-wider text-white/70">
                  Escolha como operar no AeroGame:
                </span>
                <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 font-bold">
                  2 Modos Disponíveis
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Opção 1: Modo Solo (Tradicional) */}
                <button
                  type="button"
                  onClick={() => {
                    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
                    onSelectMode('aerogame');
                  }}
                  className="p-3.5 rounded-2xl bg-gradient-to-b from-red-600/20 via-red-950/40 to-black/60 hover:from-red-600/35 hover:to-red-900/40 border border-red-500/40 hover:border-red-400 text-left transition-all active:scale-95 cursor-pointer flex flex-col justify-between group/solo shadow-lg"
                >
                  <div className="space-y-1 mb-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase text-white flex items-center gap-1.5">
                        <span>🚀</span>
                        <span>Modo Solo</span>
                      </span>
                      <span className="text-[9px] font-bold uppercase text-red-300 bg-red-500/20 px-1.5 py-0.5 rounded">
                        Tradicional
                      </span>
                    </div>
                    <p className="text-[11px] text-white/60 leading-snug">
                      Voo individual com 2 slots de aposta e sua banca própria da carteira.
                    </p>
                  </div>
                  <span className="text-[10px] font-black uppercase text-red-400 group-hover/solo:translate-x-1 transition-transform flex items-center gap-1">
                    Jogar Solo Agora →
                  </span>
                </button>

                {/* Opção 2: Modo Cabine (Piloto & Copiloto Co-Op) */}
                <button
                  type="button"
                  onClick={() => {
                    if (onSelectCabineMode) {
                      onSelectCabineMode();
                    } else {
                      onSelectMode('aerogame');
                    }
                  }}
                  className="p-3.5 rounded-2xl bg-gradient-to-b from-cyan-600/25 via-blue-950/40 to-black/60 hover:from-cyan-600/40 hover:to-blue-900/40 border border-cyan-400/50 hover:border-cyan-300 text-left transition-all active:scale-95 cursor-pointer flex flex-col justify-between group/cabine shadow-[0_0_20px_rgba(6,182,212,0.25)] relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 px-2 py-0.5 bg-gradient-to-r from-cyan-400 to-teal-400 text-black text-[8px] font-black uppercase tracking-wider rounded-bl-lg font-mono">
                    NOVO • CO-OP
                  </div>

                  <div className="space-y-1 mb-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase text-cyan-300 flex items-center gap-1.5">
                        <span>👥</span>
                        <span>Modo Cabine</span>
                      </span>
                    </div>
                    <p className="text-[11px] text-cyan-100/70 leading-snug">
                      Piloto & Copiloto: banca compartilhada 50/50, 1 slot cada e chat privado!
                    </p>
                  </div>
                  <span className="text-[10px] font-black uppercase text-cyan-300 group-hover/cabine:translate-x-1 transition-transform flex items-center gap-1">
                    Criar / Entrar em Cabine →
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* CARD 2: MODO AEROFANTASY (Ligas & Torneios) */}
        {/* ============================================================== */}
        <div className="relative rounded-3xl border border-sky-500/30 bg-gradient-to-b from-[#0a151e] via-[#070e14] to-[#04080c] overflow-hidden flex flex-col justify-between shadow-2xl transition-all duration-300 hover:border-sky-400 group" style={{ animation: 'pulseGlowBlue 8s infinite ease-in-out' }}>
          {/* Visual Header Image */}
          <div className="h-56 sm:h-64 relative overflow-hidden">
            <img 
              src={aerofantasyImg} 
              alt="Modo AeroFantasy" 
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700 brightness-90"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a151e] via-[#0a151e]/40 to-transparent" />
            
            <div className="absolute top-4 left-4 bg-sky-600/90 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg shadow-lg border border-sky-400/40">
              Arena Esports de Torneios
            </div>

            <div className="absolute top-4 right-4 bg-black/70 backdrop-blur-md text-amber-400 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border border-amber-500/30 flex items-center gap-1.5 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              Premiação Acumulada
            </div>

            <div className="absolute bottom-4 left-5 right-5 text-left">
              <span className="text-[11px] font-bold uppercase tracking-widest text-sky-400 block mb-0.5">Estratégia, Ranking & Campeonatos</span>
              <h2 className="text-3xl sm:text-4xl font-black italic uppercase tracking-tighter text-white drop-shadow-md">
                AEROFANTASY <span className="text-sky-400 text-2xl font-black">LIGAS</span>
              </h2>
            </div>
          </div>

          {/* Content Body */}
          <div className="p-6 sm:p-8 flex-1 flex flex-col justify-between space-y-6">
            <div className="space-y-4 text-left">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-white/50 mb-1.5">O Que É Este Modo</h3>
                <p className="text-xs sm:text-sm text-white/80 leading-relaxed font-medium">
                  A arena esportiva e competitiva do Aerofantasy. Em vez de rodadas soltas, você entra em campeonatos diários e semanais, recebe uma cota fixa de voos táticos por ticket e busca cravar os multiplicadores mais altos para somar pontos no placar geral. Os líderes dividem a piscina de prêmios acumulada!
                </p>
              </div>

              {/* Key Mechanics */}
              <div className="space-y-2.5 pt-2 border-t border-white/5">
                <h3 className="text-xs font-bold uppercase tracking-widest text-white/50">Mecânicas Principais</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  <div className="bg-white/5 rounded-xl p-3 border border-white/5 flex flex-col gap-1">
                    <span className="font-black text-sky-400 uppercase text-[11px]">🏆 Ligas e Arenas Ativas</span>
                    <span className="text-white/60 text-[11px] leading-snug">Participe de torneios gratuitos (Freeroll) ou campeonatos com ingressos acessíveis.</span>
                  </div>

                  <div className="bg-white/5 rounded-xl p-3 border border-white/5 flex flex-col gap-1">
                    <span className="font-black text-sky-400 uppercase text-[11px]">🎯 Voos Táticos por Ticket</span>
                    <span className="text-white/60 text-[11px] leading-snug">Cada ticket concede voos contados. O objetivo é maximizar os pontos totais obtidos.</span>
                  </div>

                  <div className="bg-white/5 rounded-xl p-3 border border-white/5 flex flex-col gap-1">
                    <span className="font-black text-sky-400 uppercase text-[11px]">💰 Divisão do Prize Pool</span>
                    <span className="text-white/60 text-[11px] leading-snug">Ao término da rodada, a premiação acumulada é dividida entre os líderes do ranking.</span>
                  </div>

                  <div className="bg-white/5 rounded-xl p-3 border border-white/5 flex flex-col gap-1">
                    <span className="font-black text-sky-400 uppercase text-[11px]">👥 Disputa PvP em Tempo Real</span>
                    <span className="text-white/60 text-[11px] leading-snug">Acompanhe sua posição no placar contra outros pilotos ao vivo a cada voo completado.</span>
                  </div>
                </div>
              </div>

              {/* Recommendation */}
              <div className="p-3.5 bg-sky-950/20 border border-sky-500/20 rounded-xl text-xs">
                <span className="font-bold text-sky-400 uppercase text-[10px] block mb-1">Para quem é recomendado:</span>
                <p className="text-white/70 text-[11.5px] leading-relaxed">
                  Pilotos competitivos e estrategistas que gostam de torneios estruturados, fantasy leagues e disputar o topo do placar por grandes premiações acumuladas.
                </p>
              </div>
            </div>

            {/* Action Button */}
            <div className="pt-2">
              <button
                onClick={() => {
                  window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
                  onSelectMode('aerofantasy');
                }}
                className="w-full py-4 px-6 bg-gradient-to-r from-sky-600 via-[#34b1e2] to-sky-600 hover:from-sky-500 hover:to-sky-700 active:scale-95 transition-all text-white font-black italic text-sm sm:text-base uppercase tracking-wider rounded-2xl shadow-[0_0_30px_rgba(52,177,226,0.5)] cursor-pointer flex items-center justify-center gap-2 group-hover:brightness-110"
              >
                <span>Entrar no Modo AeroFantasy (Ver Torneios)</span>
                <span className="text-lg">🏆</span>
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Bottom Section: Custom Aircraft Fleet & Hangar Intro */}
      <footer className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-r from-[#18191c] via-[#121315] to-[#18191c] p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
        {config.hangarBannerImage && (
          <div className="absolute inset-0 z-0 pointer-events-none">
            <img
              src={config.hangarBannerImage}
              alt="Hangar Banner"
              className="w-full h-full object-cover opacity-20"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#18191c]/90 via-[#121315]/80 to-[#18191c]/90" />
          </div>
        )}
        <div className="flex items-center gap-4 text-left relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-2xl shrink-0">
            ✈️
          </div>
          <div>
            <h4 className="text-sm font-black text-white uppercase tracking-tight">Personalize Sua Aeronave</h4>
            <p className="text-xs text-white/60 mt-0.5 max-w-xl">
              Equipe fuselagens lendárias como o <strong>Soberano Dourado</strong>, <strong>Sombra de Elite</strong> ou <strong>Tempestade de Prata</strong> e personalize as cores e o rastro da sua turbina para todos os modos!
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto shrink-0 justify-end relative z-10">
          <button
            onClick={() => {
              window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
              onOpenHangar();
            }}
            className="flex-1 md:flex-none px-5 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all active:scale-95 cursor-pointer"
          >
            Abrir Hangar
          </button>
          <button
            onClick={() => {
              window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
              onOpenStore();
            }}
            className="flex-1 md:flex-none px-5 py-3 bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase tracking-wider rounded-xl transition-all active:scale-95 shadow-lg cursor-pointer"
          >
            Loja de Skins
          </button>
        </div>
      </footer>
    </div>
  );
};

export default ModeSelectionPortal;
