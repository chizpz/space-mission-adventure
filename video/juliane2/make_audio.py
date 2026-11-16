# Звуковой слой: синтез ffmpeg (шум и синусоиды) + голос. Результат: mix.wav
import subprocess, sys
TOTAL = 86.6
def env(spans):
    # spans: [(a, b, gain, fade)] -> выражение громкости с плавными краями
    parts = []
    for a, b, g, f in spans:
        parts.append(f"{g}*between(t,{a},{b})*min(1,(t-{a})/{f})*min(1,({b}-t)/{f})")
    return "+".join(parts)
def hit(times, g, decay):
    return "+".join(f"{g}*gte(t,{x})*exp(-(t-{x})*{decay})" for x in times)
layers = {
  # ветер при падении
  "anoisesrc=c=pink:a=0.6:d={T},bandpass=f=900:width_type=h:w=1400": env([(0, 6.45, 1.0, 0.3), (29.0, 31.9, 0.8, 0.3)]),
  # гул двигателей
  "anoisesrc=c=brown:a=0.8:d={T},lowpass=f=180": env([(19.1, 29.2, 0.6, 0.6)]),
  # гром и взрыв
  "anoisesrc=c=brown:a=1:d={T},lowpass=f=260": hit([21.6, 22.45], 0.5, 2.2) + "+" + hit([25.84, 26.83], 1.0, 1.6) + "+" + hit([29.08], 1.2, 1.2),
  # дождь
  "anoisesrc=c=white:a=0.25:d={T},highpass=f=2500,lowpass=f=8000": env([(20.9, 31.8, 0.35, 0.5), (37.5, 41.0, 0.5, 0.4), (51.9, 53.5, 0.3, 0.3), (66.0, 68.2, 0.45, 0.3)]),
  # лесной фон
  "anoisesrc=c=pink:a=0.25:d={T},lowpass=f=1200,highpass=f=200": env([(31.8, 40.8, 1.1, 1.0), (45.9, 78.1, 1.1, 1.0)]),
  # самолёт над кронами
  "anoisesrc=c=brown:a=0.8:d={T},lowpass=f=300": env([(53.5, 58.8, 0.45, 1.2)]),
  # вжух на склейке «Это не кино»
  "anoisesrc=c=white:a=0.5:d={T},bandpass=f=3000:width_type=h:w=2500": env([(6.1, 6.7, 0.6, 0.25)]),
}
sines = {
  # сердцебиение на «Мёртвых»
  "sin(2*PI*55*t)": "+".join(f"0.25*gte(t,{x})*exp(-(t-{x})*14)" for i in range(4) for x in [61.6 + i * 0.8, 61.6 + i * 0.8 + 0.22]),
  # финальный аккорд
  "0.5*sin(2*PI*110*t)+0.35*sin(2*PI*164.8*t)+0.25*sin(2*PI*220*t)": env([(78.0, 86.6, 0.1, 1.5)]),
  # тёплый пэд во флешбэке
  "0.5*sin(2*PI*130.8*t)+0.3*sin(2*PI*196*t)": env([(40.85, 45.9, 0.07, 0.6)]),
}
args = ["ffmpeg", "-y", "-loglevel", "error", "-i", "voice.mp3"]
fc = []; labels = []
n = 1
for src, vol in layers.items():
    args += ["-f", "lavfi", "-i", src.replace("{T}", str(TOTAL)) + ",aformat=sample_rates=44100:channel_layouts=stereo"]
    fc.append(f"[{n}]volume='{vol}':eval=frame[l{n}]"); labels.append(f"[l{n}]"); n += 1
for expr, vol in sines.items():
    args += ["-f", "lavfi", "-i", f"aevalsrc='{expr}':s=44100:d={TOTAL},aformat=channel_layouts=stereo"]
    fc.append(f"[{n}]volume='{vol}':eval=frame[l{n}]"); labels.append(f"[l{n}]"); n += 1
fc.append("[0]aformat=sample_rates=44100:channel_layouts=stereo,apad=whole_dur=%s[v]" % TOTAL)
fc.append("".join(labels) + f"amix=inputs={len(labels)}:normalize=0,volume=1.0,lowpass=f=12000[bed]")
fc.append("[bed][v]sidechaincompress=threshold=0.05:ratio=3:attack=20:release=300[duck]")
fc.append("[0]aformat=sample_rates=44100:channel_layouts=stereo,apad=whole_dur=%s,volume=1.41[v2]" % TOTAL)
fc.append("[duck][v2]amix=inputs=2:normalize=0,alimiter=limit=0.95:level=false[out]")
import os
if os.environ.get("BED_ONLY"): fc = fc[:-2] + ["[duck]anull[out]"]
args += ["-filter_complex", ";".join(fc), "-map", "[out]", "-t", str(TOTAL), os.environ.get("OUT", "mix.wav")]
subprocess.run(args, check=True)
