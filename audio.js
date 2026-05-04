//Звуки (Web Audio API)
const AudioContextClass =
  window.AudioContext || window.webkitAudioContext || null;

export function createAudioService() {
  let audioContext = null;
  let masterGain = null;
  let activeNodes = [];

  function getAudioContext() {
    if (!AudioContextClass) {
      return null;
    }

    if (!audioContext) {
      audioContext = new AudioContextClass();
      masterGain = audioContext.createGain();
      masterGain.gain.value = 0.14;
      masterGain.connect(audioContext.destination);
    }

    return audioContext;
  }

  function cleanupFinishedNodes() {
    activeNodes = activeNodes.filter((node) => {
      if (node.playbackState === "finished") {
        return false;
      }

      return true;
    });
  }

  function trackNode(node) {
    activeNodes.push(node);
    node.addEventListener(
      "ended",
      () => {
        cleanupFinishedNodes();
      },
      { once: true },
    );
  }

  function unlock() {
    const context = getAudioContext();

    if (!context || context.state !== "suspended") {
      return;
    }

    context.resume().catch(() => {});
  }

  function createEnvelope(gainNode, startTime, attack, decay, peak, sustain) {
    gainNode.gain.setValueAtTime(0.0001, startTime);
    gainNode.gain.linearRampToValueAtTime(peak, startTime + attack);
    gainNode.gain.exponentialRampToValueAtTime(
      Math.max(sustain, 0.0001),
      startTime + attack + decay,
    );
  }

  function playTone({
    start = 0,
    duration = 0.16,
    frequency = 440,
    frequencyEnd = frequency,
    type = "sine",
    volume = 0.2,
    attack = 0.01,
    decay = 0.08,
    sustain = 0.0001,
  }) {
    const context = getAudioContext();

    if (!context || !masterGain) {
      return;
    }

    const oscillator = context.createOscillator();
    const gainNode = context.createGain();
    const startTime = context.currentTime + start;
    const stopTime = startTime + duration;

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, startTime);
    oscillator.frequency.exponentialRampToValueAtTime(
      Math.max(frequencyEnd, 0.001),
      stopTime,
    );

    createEnvelope(gainNode, startTime, attack, decay, volume, sustain);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, stopTime);

    oscillator.connect(gainNode);
    gainNode.connect(masterGain);

    oscillator.start(startTime);
    oscillator.stop(stopTime + 0.02);
    trackNode(oscillator);
  }

  function playNoise({
    start = 0,
    duration = 0.12,
    volume = 0.12,
    filterFrequency = 1800,
    filterQ = 8,
  }) {
    const context = getAudioContext();

    if (!context || !masterGain) {
      return;
    }

    const sampleCount = Math.max(1, Math.floor(context.sampleRate * duration));
    const buffer = context.createBuffer(1, sampleCount, context.sampleRate);
    const data = buffer.getChannelData(0);

    for (let index = 0; index < sampleCount; index += 1) {
      data[index] = (Math.random() * 2 - 1) * (1 - index / sampleCount);
    }

    const source = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const gainNode = context.createGain();
    const startTime = context.currentTime + start;
    const stopTime = startTime + duration;

    source.buffer = buffer;
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(filterFrequency, startTime);
    filter.Q.value = filterQ;

    createEnvelope(gainNode, startTime, 0.004, 0.04, volume, 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, stopTime);

    source.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(masterGain);

    source.start(startTime);
    source.stop(stopTime + 0.02);
    trackNode(source);
  }

  function stopAll() {
    activeNodes.forEach((node) => {
      try {
        node.stop();
      } catch (error) {
        // Ignore nodes that have already been stopped.
      }
    });

    activeNodes = [];
  }

  function playCorrect() {
    unlock();
    playTone({
      duration: 0.12,
      frequency: 620,
      frequencyEnd: 760,
      type: "triangle",
      volume: 0.13,
      attack: 0.006,
      decay: 0.05,
      sustain: 0.03,
    });
    playTone({
      start: 0.08,
      duration: 0.16,
      frequency: 780,
      frequencyEnd: 980,
      type: "sine",
      volume: 0.12,
      attack: 0.006,
      decay: 0.08,
      sustain: 0.03,
    });
  }

  function playWrong() {
    unlock();
    playTone({
      duration: 0.14,
      frequency: 920,
      frequencyEnd: 340,
      type: "square",
      volume: 0.1,
      attack: 0.003,
      decay: 0.07,
      sustain: 0.02,
    });
    playNoise({
      start: 0.02,
      duration: 0.09,
      volume: 0.06,
      filterFrequency: 2400,
      filterQ: 10,
    });
  }

  function playWin() {
    unlock();
    playTone({
      duration: 0.18,
      frequency: 523.25,
      frequencyEnd: 523.25,
      type: "triangle",
      volume: 0.11,
      attack: 0.01,
      decay: 0.07,
      sustain: 0.04,
    });
    playTone({
      start: 0.1,
      duration: 0.18,
      frequency: 659.25,
      frequencyEnd: 659.25,
      type: "triangle",
      volume: 0.11,
      attack: 0.01,
      decay: 0.07,
      sustain: 0.04,
    });
    playTone({
      start: 0.2,
      duration: 0.24,
      frequency: 783.99,
      frequencyEnd: 1046.5,
      type: "sine",
      volume: 0.13,
      attack: 0.01,
      decay: 0.12,
      sustain: 0.05,
    });
  }

  function playLose() {
    unlock();
    playTone({
      duration: 0.22,
      frequency: 392,
      frequencyEnd: 300,
      type: "sawtooth",
      volume: 0.08,
      attack: 0.01,
      decay: 0.1,
      sustain: 0.03,
    });
    playTone({
      start: 0.14,
      duration: 0.28,
      frequency: 261.63,
      frequencyEnd: 180,
      type: "triangle",
      volume: 0.08,
      attack: 0.01,
      decay: 0.14,
      sustain: 0.02,
    });
  }

  return {
    unlock,
    playCorrect,
    playWrong,
    playWin,
    playLose,
    stopAll,
  };
}
