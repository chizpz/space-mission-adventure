# Звук: синтез ffmpeg (шум, синусоиды) под голос. Результат: mix.wav
import subprocess, os
TOTAL = 96.4
def env(spans):
    return "+".join(f"{g}*between(t,{a},{b})*min(1,(t-{a})/{f})*min(1,({b}-t)/{f})" for a, b, g, f in spans)
def hits(times, g, decay):
    return "+".join(f"{g}*gte(t,{x})*exp(-(t-{x})*{decay})" for x in times)
steps = [21.8 + i * 0.34 for i in range(int((27.4 - 21.8) / 0.34))]
beats = [x for i in range(12) for x in (57.6 + i * 1.05, 57.6 + i * 1.05 + 0.24) if x < 70.4]
ticks = [73.62 + i * 0.12 for i in range(int((76.0 - 73.62) / 0.12))]
noise = {
  # ветер всё время, ночью сильнее
  "anoisesrc=c=pink:a=0.6:d={T},bandpass=f=700:width_type=h:w=1100": env([(0, 52.4, 0.6, 1.0), (52.4, 76.1, 0.45, 1.0), (76.1, 96.4, 0.35, 1.0)]),
  # хруст снега при беге
  "anoisesrc=c=white:a=0.8:d={T},highpass=f=1200,lowpass=f=6000": hits(steps, 0.7, 18),
  # вжух отправки сообщения
  "anoisesrc=c=white:a=0.5:d={T},bandpass=f=2500:width_type=h:w=2000": env([(47.0, 47.5, 0.3, 0.2)]),
  # щелчки счёта
  "anoisesrc=c=white:a=0.6:d={T},highpass=f=3000": hits(ticks, 0.12, 60),
}
sines = {
  # гудки вызова 425 Гц: длинный гудок, потом короткие «занято»
  "sin(2*PI*425*t)": env([(18.7, 19.7, 0.1, 0.03)]) + "+" + "+".join(f"0.1*between(t,{20.15 + i * 0.7},{20.5 + i * 0.7})" for i in range(2)),
  # выключение телефона
  "sin(2*PI*90*t)": hits([48.4], 0.4, 8),
  # сердцебиение в опасной зоне
  "sin(2*PI*55*t)": hits(beats, 0.22, 14),
  # низкий тревожный гул ночью
  "0.6*sin(2*PI*49*t)+0.4*sin(2*PI*73.5*t)": env([(52.4, 76.1, 0.06, 1.5)]),
  # тёплый аккорд в финале
  "0.5*sin(2*PI*130.8*t)+0.35*sin(2*PI*196*t)+0.25*sin(2*PI*261.6*t)": env([(85.2, 96.4, 0.06, 1.5)]),
}
args = ["ffmpeg", "-y", "-loglevel", "error", "-i", "voice.mp3"]
fc, labels, n = [], [], 1
for src, vol in noise.items():
    args += ["-f", "lavfi", "-i", src.replace("{T}", str(TOTAL)) + ",aformat=sample_rates=44100:channel_layouts=stereo"]
    fc.append(f"[{n}]volume='{vol}':eval=frame[l{n}]"); labels.append(f"[l{n}]"); n += 1
for expr, vol in sines.items():
    args += ["-f", "lavfi", "-i", f"aevalsrc='{expr}':s=44100:d={TOTAL},aformat=channel_layouts=stereo"]
    fc.append(f"[{n}]volume='{vol}':eval=frame[l{n}]"); labels.append(f"[l{n}]"); n += 1
fc.append(f"[0]aformat=sample_rates=44100:channel_layouts=stereo,apad=whole_dur={TOTAL}[v]")
fc.append("".join(labels) + f"amix=inputs={len(labels)}:normalize=0,lowpass=f=12000[bed]")
fc.append("[bed][v]sidechaincompress=threshold=0.05:ratio=3:attack=20:release=300[duck]")
fc.append(f"[0]aformat=sample_rates=44100:channel_layouts=stereo,apad=whole_dur={TOTAL},volume=1.41[v2]")
fc.append("[duck][v2]amix=inputs=2:normalize=0,alimiter=limit=0.95:level=false[out]")
if os.environ.get("BED_ONLY"): fc = fc[:-2] + ["[duck]anull[out]"]
args += ["-filter_complex", ";".join(fc), "-map", "[out]", "-t", str(TOTAL), os.environ.get("OUT", "mix.wav")]
subprocess.run(args, check=True)
