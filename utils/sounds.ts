
class SoundManager {
  private ctx: AudioContext | null = null;
  private engineOsc: OscillatorNode | null = null;
  private engineGain: GainNode | null = null;
  private isMuted: boolean = false;
  private takeoffTimeout: any = null;
  private cabinOsc: OscillatorNode | null = null;
  private cabinGain: GainNode | null = null;

  private init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setMute(mute: boolean) {
    this.isMuted = mute;
    if (mute) {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      if (this.engineGain) {
        this.engineGain.gain.setTargetAtTime(0, this.ctx!.currentTime, 0.05);
      }
    }
  }

  // Som do motor que sobe de tom
  startEngine(multiplier: number) {
    if (this.isMuted) return;
    this.init();
    const ctx = this.ctx!;

    if (!this.engineOsc) {
      this.engineOsc = ctx.createOscillator();
      this.engineGain = ctx.createGain();
      
      this.engineOsc.type = 'sawtooth';
      this.engineGain.gain.value = 0;
      
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 400;

      this.engineOsc.connect(filter);
      filter.connect(this.engineGain);
      this.engineGain.connect(ctx.destination);
      
      this.engineOsc.start();
    }

    const baseFreq = 60;
    const targetFreq = baseFreq + (Math.log10(multiplier) * 120);
    this.engineOsc.frequency.setTargetAtTime(targetFreq, ctx.currentTime, 0.1);
    this.engineGain!.gain.setTargetAtTime(0.08, ctx.currentTime, 0.1);
  }

  stopEngine() {
    if (this.engineGain) {
      this.engineGain.gain.setTargetAtTime(0, this.ctx!.currentTime, 0.1);
    }
  }

  playTakeoff() {
    if (this.isMuted) return;
    this.init();
    this.stopEngine();
    const ctx = this.ctx!;
    
    // Whoosh / Takeoff sound
    const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 2.0, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < ctx.sampleRate * 2.0; i++) {
        output[i] = (Math.random() * 2 - 1) * (1 - i / (ctx.sampleRate * 2.0)); // Fading out noise
    }
    
    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(400, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(3000, ctx.currentTime + 1.5);
    
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0, ctx.currentTime);
    noiseGain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.5);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 2.0);
    
    whiteNoise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    whiteNoise.start();
  }

  private getPortugueseVoices(): { female: SpeechSynthesisVoice | null, male: SpeechSynthesisVoice | null } {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      return { female: null, male: null };
    }
    const voices = window.speechSynthesis.getVoices();
    const ptVoices = voices.filter(v => v.lang.toLowerCase().startsWith('pt'));
    
    if (ptVoices.length === 0) {
      return { female: null, male: null };
    }
    
    let female: SpeechSynthesisVoice | null = null;
    let male: SpeechSynthesisVoice | null = null;
    
    // Procura por voz feminina por palavras-chave comuns
    for (const v of ptVoices) {
      const name = v.name.toLowerCase();
      if (name.includes('maria') || name.includes('heloisa') || name.includes('luciana') || 
          name.includes('francisca') || name.includes('vitoria') || name.includes('joana') || 
          name.includes('zira') || name.includes('female') || name.includes('mulher') || 
          name.includes('google')) {
        female = v;
        break;
      }
    }
    
    // Procura por voz masculina por palavras-chave comuns
    for (const v of ptVoices) {
      const name = v.name.toLowerCase();
      if (name.includes('daniel') || name.includes('ricardo') || name.includes('antonio') || 
          name.includes('felipe') || name.includes('thiago') || name.includes('male') || 
          name.includes('homem') || name.includes('captain')) {
        male = v;
        break;
      }
    }
    
    // Fallbacks inteligentes
    if (!female) female = ptVoices[0];
    if (!male) male = ptVoices.find(v => v !== female) || ptVoices[0];
    
    return { female, male };
  }

  stopTakeoffSequence() {
    if (this.takeoffTimeout) {
      clearTimeout(this.takeoffTimeout);
      this.takeoffTimeout = null;
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    if (this.cabinOsc) {
      try {
        this.cabinOsc.stop();
      } catch (e) {}
      this.cabinOsc = null;
    }
    if (this.cabinGain) {
      try {
        this.cabinGain.disconnect();
      } catch (e) {}
      this.cabinGain = null;
    }
  }

  async playTakeoffSequence(): Promise<void> {
    // Efetua stop para limpar sequências anteriores e garantir que não toque duplicado
    this.stopTakeoffSequence();

    if (this.isMuted) return;
    
    // Efeito de cabine (rumble de baixa frequência)
    this.playCabinEffect();

    return new Promise((resolve) => {
        let resolved = false;
        const doResolve = () => {
          if (!resolved) {
            resolved = true;
            resolve();
          }
        };

        // Timeout de fallback para evitar que o avião trave se a API do browser falhar ou travar
        const failSafeId = setTimeout(doResolve, 7000);

        const voices = this.getPortugueseVoices();

        const u1 = new SpeechSynthesisUtterance("Atenção tripulação, Preparar para decolagem!");
        u1.lang = 'pt-BR';
        u1.rate = 1.05; // Velocidade levemente maior para ser profissional
        u1.pitch = 1.25; // Pitch agudo e feminino
        if (voices.female) {
            u1.voice = voices.female;
        }

        u1.onend = () => {
            if (this.isMuted || resolved) {
                clearTimeout(failSafeId);
                doResolve();
                return;
            }
            // Agenda a voz masculina do capitão com 1 segundo de intervalo pós vocal feminina
            this.takeoffTimeout = setTimeout(() => {
                if (this.isMuted || resolved) {
                    clearTimeout(failSafeId);
                    doResolve();
                    return;
                }
                const u2 = new SpeechSynthesisUtterance("Decolagem autorizada");
                u2.lang = 'pt-BR';
                u2.rate = 0.92; // Ritmo do capitão, mais focado
                u2.pitch = 0.82; // Pitch grave e masculino
                if (voices.male) {
                    u2.voice = voices.male;
                }
                u2.onend = () => {
                    clearTimeout(failSafeId);
                    doResolve();
                };
                u2.onerror = () => {
                    clearTimeout(failSafeId);
                    doResolve();
                };
                window.speechSynthesis.speak(u2);
            }, 1000);
        };

        u1.onerror = () => {
            clearTimeout(failSafeId);
            doResolve();
        };

        window.speechSynthesis.speak(u1);
    });
  }

  playCabinEffect() {
    if (this.isMuted) return;
    this.init();
    const ctx = this.ctx!;
    
    if (this.cabinOsc) {
      try { this.cabinOsc.stop(); } catch (e) {}
      this.cabinOsc = null;
    }

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(60, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(30, ctx.currentTime + 5);
    
    gain.gain.setValueAtTime(0.05, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 5);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    this.cabinOsc = osc;
    this.cabinGain = gain;

    osc.start();
    osc.stop(ctx.currentTime + 5);
  }

  playFlyAway() {
    if (this.isMuted) return;
    this.init();
    this.stopEngine();
    const ctx = this.ctx!;

    const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 1.0, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < ctx.sampleRate * 1.0; i++) {
        output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.6);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.15, ctx.currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);

    whiteNoise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    whiteNoise.start();
  }

  playCrash() {
    if (this.isMuted) return;
    this.init();
    this.stopEngine();
    const ctx = this.ctx!;

    const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < ctx.sampleRate * 0.5; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(500, ctx.currentTime);
    
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.1, ctx.currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

    whiteNoise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    whiteNoise.start();
  }

  playCashout() {
    if (this.isMuted) return;
    this.init();
    const ctx = this.ctx!;
    
    const playTone = (freq: number, startTime: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(0.2, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + 0.3);
    };

    playTone(523.25, ctx.currentTime); // C5
    playTone(659.25, ctx.currentTime + 0.1); // E5
    playTone(783.99, ctx.currentTime + 0.2); // G5
  }

  playClick() {
    if (this.isMuted) return;
    this.init();
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'square';
    osc.frequency.setValueAtTime(150, ctx.currentTime);
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.05);
  }

  playAlert() {
    if (this.isMuted) return;
    this.init();
    const ctx = this.ctx!;
    
    // "Ding" sound (High pitch bell)
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
    
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.5);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 1.5);
  }

  playWheelTick() {
    if (this.isMuted) return;
    this.init();
    const ctx = this.ctx!;
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.05);
    
    gain.gain.setValueAtTime(0.05, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.05);
  }

  playFanfare() {
    if (this.isMuted) return;
    this.init();
    const ctx = this.ctx!;
    
    const now = ctx.currentTime;
    [0, 0.15, 0.3, 0.6].forEach((offset, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        // Acorde Maior (C Major arpeggioish)
        const freqs = [523.25, 659.25, 783.99, 1046.50];
        osc.frequency.value = freqs[i];
        
        gain.gain.setValueAtTime(0.1, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.8);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + offset);
        osc.stop(now + offset + 0.8);
    });
  }
}

export const sounds = new SoundManager();
