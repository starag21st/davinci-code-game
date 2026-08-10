/**
 * Da Vinci Code - Web Audio API Sound System
 * Generates rich procedural audio for all game events without external asset dependencies.
 */

export class SoundManager {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }

  // 1. 주사위 굴리기 효과음 (따르르륵 - 1.6초 풍성한 사운드)
  playDiceRoll() {
    if (this.muted) return;
    this.initContext();

    for (let i = 0; i < 16; i++) {
      setTimeout(() => {
        if (this.muted) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(280 + Math.random() * 450, this.ctx.currentTime);

        gain.gain.setValueAtTime(0.14, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.09);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.09);
      }, i * 95);
    }
  }

  // 2. 카드를 바닥패에서 뽑는 효과음 (찰칵)
  playDrawTile() {
    if (this.muted) return;
    this.initContext();

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(120, this.ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.12);
  }

  // 3. 버튼 클릭 / 타일 지목 선택 효과음 (또각)
  playSelect() {
    if (this.muted) return;
    this.initContext();

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, this.ctx.currentTime);

    gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.05);
  }

  // 4. 추측 성공 효과음 (딩동댕! 밝은 아르페지오)
  playSuccess() {
    if (this.muted) return;
    this.initContext();

    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        if (this.muted) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

        gain.gain.setValueAtTime(0.22, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.35);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.35);
      }, idx * 90);
    });
  }

  // 5. 추측 실패 효과음 (떽! 저음 경고음)
  playFail() {
    if (this.muted) return;
    this.initContext();

    const notes = [220.00, 174.61];
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        if (this.muted) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

        gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.4);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.4);
      }, idx * 140);
    });
  }

  // 6. 게임 승리 효과음 (웅장한 팡파레)
  playVictory() {
    if (this.muted) return;
    this.initContext();

    const melody = [
      { f: 523.25, d: 0.15 },
      { f: 659.25, d: 0.15 },
      { f: 783.99, d: 0.15 },
      { f: 1046.50, d: 0.5 }
    ];

    let delay = 0;
    melody.forEach(item => {
      setTimeout(() => {
        if (this.muted) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(item.f, this.ctx.currentTime);

        gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + item.d);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + item.d);
      }, delay);
      delay += item.d * 1000 * 0.8;
    });
  }

  // 7. 게임 패배 효과음
  playDefeat() {
    if (this.muted) return;
    this.initContext();

    const melody = [
      { f: 392.00, d: 0.25 },
      { f: 349.23, d: 0.25 },
      { f: 329.63, d: 0.25 },
      { f: 261.63, d: 0.6 }
    ];

    let delay = 0;
    melody.forEach(item => {
      setTimeout(() => {
        if (this.muted) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(item.f, this.ctx.currentTime);

        gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + item.d);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + item.d);
      }, delay);
      delay += item.d * 1000 * 0.9;
    });
  }
}
