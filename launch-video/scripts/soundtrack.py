"""Synthesizes the launch film's soundtrack from code: an upbeat 150 BPM beat plus sound effects.

Everything is generated here (no samples). The scene lengths and every sound cue come from
src/timeline.json, the same file the picture reads, so each sound lands on its frame.

    python scripts/soundtrack.py   ->   out/soundtrack.wav
"""
import json
import os

import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, lfilter

SR = 44100
rng = np.random.default_rng(7)

with open("src/timeline.json", encoding="utf8") as handle:
    timeline = json.load(handle)

BPM = timeline["bpm"]
BEAT = 60.0 / BPM

# --- When everything happens ------------------------------------------------------------------
starts: dict[str, float] = {}
cursor = 0.0
for scene in timeline["scenes"]:
    starts[scene["id"]] = cursor
    cursor += scene["seconds"]
TOTAL = cursor
cues = [(starts[c["scene"]] + c["at"], c["sfx"]) for c in timeline["cues"]]

LENGTH = int((TOTAL + 1.2) * SR)
music = np.zeros((LENGTH, 2))
sfx = np.zeros((LENGTH, 2))


def add(bus: np.ndarray, signal: np.ndarray, at: float, gain: float = 1.0, pan: float = 0.0) -> None:
    """Mixes a mono signal into a stereo bus at `at` seconds. pan runs from -1 (left) to 1 (right)."""
    start = int(at * SR)
    if start >= LENGTH or start < 0:
        return
    end = min(LENGTH, start + len(signal))
    chunk = signal[: end - start] * gain
    left = np.cos((pan + 1) * np.pi / 4)
    right = np.sin((pan + 1) * np.pi / 4)
    bus[start:end, 0] += chunk * left
    bus[start:end, 1] += chunk * right


def t_axis(seconds: float) -> np.ndarray:
    return np.arange(int(seconds * SR)) / SR


def lowpass(signal: np.ndarray, cutoff: float, order: int = 2) -> np.ndarray:
    b, a = butter(order, cutoff / (SR / 2), btype="low")
    return lfilter(b, a, signal)


def highpass(signal: np.ndarray, cutoff: float, order: int = 2) -> np.ndarray:
    b, a = butter(order, cutoff / (SR / 2), btype="high")
    return lfilter(b, a, signal)


def bandpass(signal: np.ndarray, low: float, high: float) -> np.ndarray:
    b, a = butter(2, [low / (SR / 2), high / (SR / 2)], btype="band")
    return lfilter(b, a, signal)


def noise(seconds: float) -> np.ndarray:
    return rng.uniform(-1, 1, int(seconds * SR))


# --- Drum and music voices --------------------------------------------------------------------
def kick() -> np.ndarray:
    t = t_axis(0.32)
    freq = 46 + 130 * np.exp(-t * 32)
    phase = 2 * np.pi * np.cumsum(freq) / SR
    return np.sin(phase) * np.exp(-t * 9) * 1.1


def hat(open_: bool = False) -> np.ndarray:
    t = t_axis(0.18 if open_ else 0.05)
    return highpass(noise(len(t) / SR), 7000) * np.exp(-t * (18 if open_ else 70)) * 0.5


def clap() -> np.ndarray:
    t = t_axis(0.22)
    body = bandpass(noise(0.22), 1200, 3800)
    bursts = sum(np.exp(-np.clip(t - d, 0, None) * 90) * (t >= d) for d in (0.0, 0.011, 0.023))
    return body * (bursts * 0.55 + np.exp(-t * 18) * 0.5)


def saw(freq: float, seconds: float, detune: float = 0.0) -> np.ndarray:
    t = t_axis(seconds)
    return 2 * ((t * freq * (1 + detune)) % 1.0) - 1


def bass(freq: float, seconds: float) -> np.ndarray:
    t = t_axis(seconds)
    body = lowpass(saw(freq, seconds) * 0.8 + np.sin(2 * np.pi * freq * t) * 0.9, 520)
    return body * np.minimum(1, t * 120) * np.exp(-t * 4.0)


def pluck(freq: float) -> np.ndarray:
    t = t_axis(0.34)
    tone = np.sin(2 * np.pi * freq * t) + 0.45 * np.sin(2 * np.pi * freq * 2 * t) + 0.18 * np.sin(2 * np.pi * freq * 3 * t)
    return tone * np.exp(-t * 11) * np.minimum(1, t * 600)


def stab(freqs: list[float], seconds: float) -> np.ndarray:
    voices = sum(saw(f, seconds, d) for f in freqs for d in (-0.004, 0.0, 0.004))
    t = t_axis(seconds)
    return lowpass(voices / (len(freqs) * 3), 2600) * np.exp(-t * 7) * np.minimum(1, t * 300)


def midi(note: int) -> float:
    return 440.0 * 2 ** ((note - 69) / 12)


# C major, I V vi IV: bright and bouncy. Each bar is four beats (1.6 seconds at 150 BPM).
CHORDS = [
    {"root": 36, "tones": [60, 64, 67]},  # C
    {"root": 43, "tones": [59, 62, 67]},  # G
    {"root": 33, "tones": [60, 64, 69]},  # Am
    {"root": 41, "tones": [60, 65, 69]},  # F
]
PENTATONIC_OFFSETS = [0, 2, 4, 7, 9, 12, 14, 16]


def build_music() -> None:
    kick_s, clap_s, hat_s, hat_o = kick(), clap(), hat(), hat(True)
    full_start = starts["logo"]
    arp_start = starts["upload"]
    stab_start = starts["upload"]
    beat_count = int(TOTAL / BEAT) + 1

    for beat in range(beat_count):
        t = beat * BEAT
        bar = int(t / (BEAT * 4))
        chord = CHORDS[bar % 4]
        in_beat = beat % 4

        if t < full_start:
            # The hook: a nervous heartbeat that builds, before the beat drops with the logo.
            lift = 0.25 + 0.5 * (t / full_start)
            if beat % 2 == 0:
                add(music, lowpass(kick_s, 300), t, 0.5 * lift, 0)
            if t > full_start - 1.6 and beat % 1 == 0:
                add(music, hat_s, t, 0.35 * lift, 0.3)
            continue

        # The drop: a kick on every beat, claps on 2 and 4, hats on the off-beat.
        add(music, kick_s, t, 0.95, 0)
        if in_beat in (1, 3):
            add(music, clap_s, t, 0.5, 0.05)
        add(music, hat_s, t + BEAT / 2, 0.55, 0.35)
        add(music, hat_s, t, 0.22, -0.25)
        if in_beat == 3:
            add(music, hat_o, t + BEAT * 0.75, 0.3, -0.3)

        # Bass: a bouncing eighth-note line on the root and its octave.
        for step, octave in enumerate((0, 12)):
            add(music, bass(midi(chord["root"] + octave), BEAT * 0.45), t + step * BEAT / 2, 0.62, 0)

        # Chord stabs on the off-beats (from the upload scene on).
        if t >= stab_start and in_beat in (1, 3):
            add(music, stab([midi(n) for n in chord["tones"]], BEAT * 0.8), t + BEAT / 2, 0.34, 0.1)

        # A sparkling arpeggio in sixteenth notes (from the upload scene on).
        if t >= arp_start:
            for sixteenth in range(4):
                tone = chord["tones"][(beat * 4 + sixteenth) % 3] + 12
                offset = PENTATONIC_OFFSETS[(beat * 4 + sixteenth * 3) % len(PENTATONIC_OFFSETS)] % 12
                note = tone + (12 if sixteenth % 2 else 0) if sixteenth != 2 else tone + offset
                add(music, pluck(midi(note)), t + sixteenth * BEAT / 4, 0.2, -0.35 + 0.23 * sixteenth)

    # A last big chord with the end scene, so the film finishes on a high.
    end_start = starts["end"]
    for freq in [midi(n) for n in (48, 60, 64, 67, 72)]:
        add(music, saw(freq, 2.8, 0.003) * np.exp(-t_axis(2.8) * 1.3) * 0.12, end_start, 1.0, 0)


# --- Sound effects ----------------------------------------------------------------------------
def pop() -> np.ndarray:
    t = t_axis(0.16)
    freq = 520 + 780 * (1 - np.exp(-t * 38))
    return np.sin(2 * np.pi * np.cumsum(freq) / SR) * np.exp(-t * 24) * 0.9


def whoosh() -> np.ndarray:
    length = 0.55
    t = t_axis(length)
    dark, bright = lowpass(noise(length), 700), highpass(noise(length), 2500)
    swell = np.sin(np.pi * np.clip(t / length, 0, 1)) ** 1.6
    mix = dark * (1 - t / length) + bright * (t / length) * 0.7
    return mix * swell * 0.9


def thud() -> np.ndarray:
    t = t_axis(0.3)
    return (np.sin(2 * np.pi * np.cumsum(95 * np.exp(-t * 7) + 40) / SR) * np.exp(-t * 13) + bandpass(noise(0.3), 800, 3000) * np.exp(-t * 60) * 0.5) * 1.1


def click() -> np.ndarray:
    t = t_axis(0.08)
    return (highpass(noise(0.08), 2500) * np.exp(-t * 120) * 0.9) + np.sin(2 * np.pi * 1800 * t) * np.exp(-t * 90) * 0.5


def tick() -> np.ndarray:
    t = t_axis(0.07)
    return np.sin(2 * np.pi * 1500 * t) * np.exp(-t * 70) * 0.7


def ding() -> np.ndarray:
    t = t_axis(1.1)
    tone = np.sin(2 * np.pi * 1319 * t) + 0.55 * np.sin(2 * np.pi * 1760 * t) + 0.3 * np.sin(2 * np.pi * 2637 * t)
    return tone * np.exp(-t * 4.2) * np.minimum(1, t * 800) * 0.55


def sweep() -> np.ndarray:
    length = 1.3
    t = t_axis(length)
    freq = 330 * 2 ** (t / length * 2.6)
    shimmer = 0.75 + 0.25 * np.sin(2 * np.pi * 14 * t)
    return np.sin(2 * np.pi * np.cumsum(freq) / SR) * shimmer * np.sin(np.pi * np.clip(t / length, 0, 1)) ** 0.7 * 0.45


def typing() -> np.ndarray:
    out = np.zeros(int(1.2 * SR))
    for at in np.cumsum(rng.uniform(0.045, 0.085, 14)):
        if at < 1.1:
            piece = click() * 0.55
            start = int(at * SR)
            out[start : start + len(piece)] += piece[: len(out) - start]
    return out


def riser() -> np.ndarray:
    length = 1.6
    t = t_axis(length)
    grow = (t / length) ** 2.2
    freq = 180 * 2 ** (t / length * 3.3)
    tone = np.sin(2 * np.pi * np.cumsum(freq) / SR) * 0.5
    hiss = highpass(noise(length), 1800) * 0.9
    return (tone + hiss) * grow * 0.7


def boom(length: float = 1.0) -> np.ndarray:
    t = t_axis(length)
    low = np.sin(2 * np.pi * np.cumsum(58 * np.exp(-t * 3.2) + 32) / SR) * np.exp(-t * 3.4)
    crash = highpass(noise(length), 3000) * np.exp(-t * 4.5) * 0.45
    return (low + crash) * 1.1


def slam() -> np.ndarray:
    return boom(0.9) * 1.0


def impact() -> np.ndarray:
    t = t_axis(1.2)
    shimmer = (np.sin(2 * np.pi * 880 * t) + np.sin(2 * np.pi * 1318 * t) * 0.6) * np.exp(-t * 3) * 0.16
    return boom(1.2) + shimmer


def sparkle() -> np.ndarray:
    out = np.zeros(int(0.9 * SR))
    for at in np.sort(rng.uniform(0, 0.45, 11)):
        freq = float(rng.choice([2093, 2637, 3136, 3520, 4186, 5274]))
        t = t_axis(0.3)
        piece = np.sin(2 * np.pi * freq * t) * np.exp(-t * 13) * 0.32
        start = int(at * SR)
        out[start : start + len(piece)] += piece[: len(out) - start]
    return out


VOICES = {
    "pop": (pop, 0.8), "whoosh": (whoosh, 0.7), "thud": (thud, 0.9), "click": (click, 0.8), "tick": (tick, 0.7),
    "ding": (ding, 0.85), "sweep": (sweep, 0.8), "typing": (typing, 0.8), "riser": (riser, 0.9), "slam": (slam, 1.0),
    "impact": (impact, 1.0), "sparkle": (sparkle, 0.8),
}


def build_sfx() -> None:
    for index, (at, name) in enumerate(cues):
        make, gain = VOICES[name]
        # A touch of left-right movement, so repeated sounds are not identical.
        pan = ((index * 37) % 7 - 3) / 12
        add(sfx, make(), at, gain, pan)


# --- Mix and write ----------------------------------------------------------------------------
build_music()
build_sfx()

# Fade the whole thing out over the last second and a bit.
fade = np.ones(LENGTH)
tail = int(1.3 * SR)
fade[-tail:] = np.linspace(1, 0, tail) ** 1.5
mix = (music * 0.62 + sfx * 0.85) * fade[:, None]

# Gentle glue: soft clipping, then normalise the peak.
mix = np.tanh(mix * 1.25) / np.tanh(1.25)
mix = mix / max(1e-9, np.max(np.abs(mix))) * 0.84

os.makedirs("out", exist_ok=True)
wavfile.write("out/soundtrack.wav", SR, (mix * 32767).astype(np.int16))
print(f"Wrote out/soundtrack.wav: {LENGTH / SR:.1f} seconds, {len(cues)} cues, {BPM} BPM")
