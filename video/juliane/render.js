// Рендер: node render.js [preview t1,t2,...] -> кадры; без аргументов -> out.mp4
const { chromium } = require("playwright");
const { spawn } = require("child_process");
const path = require("path");
const FPS = 30;
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  await page.goto("file://" + path.join(__dirname, "scene.html"));
  await page.evaluate(() => window.ready);
  const total = await page.evaluate(() => TOTAL);
  if (process.argv[2] === "preview") {
    const outDir = process.argv[4] || __dirname;
    for (const t of process.argv[3].split(",").map(Number)) {
      // прогоняем немного кадров перед t, чтобы счётчики были в верном состоянии
      await page.evaluate((t) => { for (let x = Math.max(0, t - 0.5); x < t; x += 1 / 30) render(x); render(t); }, t);
      await page.locator("canvas").screenshot({ path: path.join(outDir, `prev_${t.toFixed(2)}.png`) });
    }
    await browser.close(); return;
  }
  const out = path.join(__dirname, "juliane.mp4");
  const ff = spawn("ffmpeg", ["-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", String(FPS), "-c:v", "mjpeg", "-i", "-",
    "-i", path.join(__dirname, "voice.mp3"), "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-pix_fmt", "yuv420p",
    "-c:a", "aac", "-b:a", "160k", "-af", "apad", "-t", String(total), "-movflags", "+faststart", out], { stdio: ["pipe", "inherit", "inherit"] });
  const n = Math.round(total * FPS);
  for (let i = 0; i < n; i++) {
    const b64 = await page.evaluate((t) => { render(t); return document.getElementById("c").toDataURL("image/jpeg", 0.93).split(",")[1]; }, i / FPS);
    if (!ff.stdin.write(Buffer.from(b64, "base64"))) await new Promise((r) => ff.stdin.once("drain", r));
    if (i % 150 === 0) console.log(`кадр ${i}/${n}`);
  }
  ff.stdin.end();
  await new Promise((r) => ff.on("close", r));
  await browser.close();
  console.log("готово:", out);
})();
