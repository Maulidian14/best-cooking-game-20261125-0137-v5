// All sound is synthesised with WebAudio — no audio files, no network.
// A tiny step sequencer plays a cheerful bass-and-pluck loop while cooking,
// and short blips cover chop, pickup, serve, strike and the order alarm.
// One file, one job: every noise the kitchen makes.
export function createAudio() {
  let context = null;
  let master = null;
  let muted = false;
  let musicTimer = 0;
  let step = 0;
  // C major pentatonic-ish walk: bass note then a pluck, eight steps a bar.
  const BASS = [130.81, 98.0, 110.0, 130.81, 146.83, 130.81, 98.0, 110.0];
  const PLUCK = [523.25, 659.25, 783.99, 659.25, 587.33, 783.99, 880.0, 659.25];

  function ensure() {
    if (context) return true;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      context = new AudioContext();
      master = context.createGain();
      master.gain.value = 0.5;
      master.connect(context.destination);
      return true;
    } catch {
      return false;
    }
  }

  function tone(freq, seconds, type, volume, when = 0) {
    if (!context || muted) return;
    const start = context.currentTime + when;
    const osc = context.createOscillator();
    const gain = context.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(volume, start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, start + seconds);
    osc.connect(gain);
    gain.connect(master);
    osc.start(start);
    osc.stop(start + seconds + 0.05);
  }

  function noiseBurst(seconds, volume, lowpass) {
    if (!context || muted) return;
    const start = context.currentTime;
    const length = Math.max(1, Math.floor(context.sampleRate * seconds));
    const buffer = context.createBuffer(1, length, context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
    const source = context.createBufferSource();
    source.buffer = buffer;
    const filter = context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = lowpass;
    const gain = context.createGain();
    gain.gain.value = volume;
    source.connect(filter);
    filter.connect(gain);
    gain.connect(master);
    source.start(start);
  }

  return {
    unlock() {
      if (ensure() && context.state === 'suspended') context.resume();
    },
    toggleMute() {
      muted = !muted;
      if (master) master.gain.value = muted ? 0 : 0.5;
      return muted;
    },
    isMuted() {
      return muted;
    },
    pickup() {
      tone(440, 0.08, 'triangle', 0.25);
      tone(660, 0.08, 'triangle', 0.2, 0.05);
    },
    place() {
      tone(330, 0.07, 'triangle', 0.22);
    },
    chop() {
      noiseBurst(0.09, 0.5, 900);
      tone(180, 0.06, 'square', 0.12);
    },
    chopDone() {
      tone(523.25, 0.1, 'triangle', 0.25);
      tone(783.99, 0.12, 'triangle', 0.22, 0.07);
    },
    sizzle() {
      noiseBurst(0.18, 0.12, 3200);
    },
    cookDone() {
      tone(659.25, 0.12, 'sine', 0.3);
      tone(880.0, 0.16, 'sine', 0.28, 0.09);
    },
    serve() {
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => tone(freq, 0.14, 'triangle', 0.26, i * 0.07));
    },
    wrong() {
      tone(220, 0.22, 'sawtooth', 0.22);
      tone(174, 0.3, 'sawtooth', 0.22, 0.12);
    },
    tick() {
      tone(980, 0.05, 'square', 0.14);
    },
    newOrder() {
      tone(392, 0.09, 'triangle', 0.2);
      tone(523.25, 0.09, 'triangle', 0.2, 0.08);
    },
    gameOver() {
      [392, 330, 262, 196].forEach((freq, i) => tone(freq, 0.22, 'triangle', 0.24, i * 0.16));
    },
    // Advance the music loop; call every frame with dt while playing.
    updateMusic(dt, playing) {
      if (!context || muted || !playing) return;
      musicTimer += dt;
      const stepSeconds = 0.24;
      while (musicTimer >= stepSeconds) {
        musicTimer -= stepSeconds;
        const i = step % 8;
        tone(BASS[i], 0.2, 'sine', 0.16);
        if (i % 2 === 0) tone(PLUCK[i], 0.16, 'triangle', 0.07);
        step += 1;
      }
    },
  };
}
