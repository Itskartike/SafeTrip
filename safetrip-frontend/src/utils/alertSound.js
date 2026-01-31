/**
 * Emergency Alert Sound Utility
 * Generates and plays emergency siren sounds using Web Audio API
 */

class AlertSound {
  constructor() {
    this.audioContext = null;
    this.oscillator = null;
    this.gainNode = null;
    this.isPlaying = false;
  }

  /**
   * Initialize audio context (must be called after user interaction)
   */
  init() {
    if (!this.audioContext) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.audioContext = new AudioContext();
    }
  }

  /**
   * Play emergency siren sound
   * Creates a two-tone siren effect
   */
  playSiren(duration = 3000) {
    try {
      this.init();

      if (this.isPlaying) {
        this.stop();
      }

      this.isPlaying = true;

      // Create oscillator for siren sound
      this.oscillator = this.audioContext.createOscillator();
      this.gainNode = this.audioContext.createGain();

      // Connect nodes
      this.oscillator.connect(this.gainNode);
      this.gainNode.connect(this.audioContext.destination);

      // Siren frequencies (two-tone)
      const freq1 = 800; // Hz
      const freq2 = 1000; // Hz
      const cycleDuration = 0.5; // seconds per cycle

      // Set initial frequency
      this.oscillator.frequency.setValueAtTime(
        freq1,
        this.audioContext.currentTime
      );

      // Create siren effect by alternating frequencies
      const cycles = Math.floor(duration / 1000 / cycleDuration);
      for (let i = 0; i < cycles; i++) {
        const time = this.audioContext.currentTime + i * cycleDuration;
        const freq = i % 2 === 0 ? freq2 : freq1;
        this.oscillator.frequency.setValueAtTime(freq, time);
      }

      // Volume envelope
      this.gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
      this.gainNode.gain.linearRampToValueAtTime(
        0.3,
        this.audioContext.currentTime + 0.1
      );
      this.gainNode.gain.setValueAtTime(
        0.3,
        this.audioContext.currentTime + duration / 1000 - 0.1
      );
      this.gainNode.gain.linearRampToValueAtTime(
        0,
        this.audioContext.currentTime + duration / 1000
      );

      // Start and stop
      this.oscillator.start(this.audioContext.currentTime);
      this.oscillator.stop(this.audioContext.currentTime + duration / 1000);

      // Cleanup after sound finishes
      setTimeout(() => {
        this.isPlaying = false;
      }, duration);
    } catch (error) {
      console.error("Error playing alert sound:", error);
      this.isPlaying = false;
    }
  }

  /**
   * Play a simple beep sound
   */
  playBeep(frequency = 800, duration = 200) {
    try {
      this.init();

      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = "sine";

      gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(
        0.3,
        this.audioContext.currentTime + 0.01
      );
      gainNode.gain.linearRampToValueAtTime(
        0,
        this.audioContext.currentTime + duration / 1000
      );

      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + duration / 1000);
    } catch (error) {
      console.error("Error playing beep sound:", error);
    }
  }

  /**
   * Play triple beep alert (like emergency broadcasts)
   */
  playTripleBeep() {
    this.playBeep(800, 200);
    setTimeout(() => this.playBeep(800, 200), 300);
    setTimeout(() => this.playBeep(800, 400), 600);
  }

  /**
   * Play urgent alert pattern
   */
  playUrgentAlert() {
    const pattern = [
      { freq: 1000, duration: 100, delay: 0 },
      { freq: 800, duration: 100, delay: 150 },
      { freq: 1000, duration: 100, delay: 300 },
      { freq: 800, duration: 100, delay: 450 },
      { freq: 1000, duration: 300, delay: 600 },
    ];

    pattern.forEach(({ freq, duration, delay }) => {
      setTimeout(() => this.playBeep(freq, duration), delay);
    });
  }

  /**
   * Stop currently playing sound
   */
  stop() {
    try {
      if (this.oscillator) {
        this.oscillator.stop();
        this.oscillator.disconnect();
        this.oscillator = null;
      }
      if (this.gainNode) {
        this.gainNode.disconnect();
        this.gainNode = null;
      }
      this.isPlaying = false;
    } catch (error) {
      // Oscillator may have already stopped
      this.isPlaying = false;
    }
  }

  /**
   * Play browser notification sound (fallback)
   */
  playNotificationSound() {
    try {
      // Try to use the system notification sound
      const audio = new Audio(
        "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBzGH0fPTgjMGHm7A7+OZVA0LVK3n77BdGAg+l9v0xnMpBSuAzvLXiDUIGGS76+iaTBELTqnm8LJgGwY2j9b00YA2Bxtz0O/ilEcODla47vCrYBoINI/W9NCBOAccdM3v45ZID0la1PDTgjYHG3LQ7+OWRw4OVrjv8Kx"
      );
      audio.play().catch(() => {
        // If audio doesn't play, use Web Audio API as fallback
        this.playUrgentAlert();
      });
    } catch (error) {
      console.error("Error playing notification sound:", error);
      this.playUrgentAlert();
    }
  }
}

// Singleton instance
const alertSound = new AlertSound();

export default alertSound;
