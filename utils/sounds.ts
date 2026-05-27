
class SoundManager {
  private ctx: AudioContext | null = null;
  private engineOsc: OscillatorNode | null = null;
  private engineGain: GainNode | null = null;
  private isMuted: boolean = false;

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
    if (mute && this.engineGain) {
      this.engineGain.gain.setTargetAtTime(0, this.ctx!.currentTime, 0.05);
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

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.1, ctx.currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);

    whiteNoise.connect(noiseGain);
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
