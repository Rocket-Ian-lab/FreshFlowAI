// public/promo.html(자동재생 소개 영상 페이지) → FreshFlow_소개영상.mp4 렌더링
// 실행: node tools/render_promo.cjs   (Chrome, ffmpeg 필요. 경로는 환경변수 CHROME / FFMPEG로 변경 가능)
// 방식: Chrome headless + CDP Page.startScreencast로 프레임을 받아 ffmpeg concat(실제 프레임 간격)으로 인코딩
const http = require("http"), fs = require("fs"), path = require("path"), os = require("os");
const { spawn, execFileSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const PUB = path.join(ROOT, "public");
const OUT = process.env.OUT || path.join(ROOT, "FreshFlow_소개영상.mp4");
const WORK = fs.mkdtempSync(path.join(os.tmpdir(), "ffpromo-"));
const CHROME = process.env.CHROME || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const FFMPEG = process.env.FFMPEG || "C:\\Users\\arron\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-8.1.1-full_build\\bin\\ffmpeg.exe";
const PORT = 8899, DBG = 9333, W = 1920, H = 1080;
const CAPTURE_MS = Number(process.env.CAPTURE_MS || 63500); // END 60s + 시작 지연 + 여유

const MIME = { ".html": "text/html; charset=utf-8", ".mp4": "video/mp4", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".woff2": "font/woff2" };
function serve() {
  return new Promise((res) => {
    const srv = http.createServer((req, rsp) => {
      const u = decodeURIComponent(req.url.split("?")[0]);
      const fp = path.join(PUB, u === "/" ? "promo.html" : u);
      if (!fp.startsWith(PUB) || !fs.existsSync(fp) || fs.statSync(fp).isDirectory()) { rsp.writeHead(404); return rsp.end("nf"); }
      const size = fs.statSync(fp).size, type = MIME[path.extname(fp).toLowerCase()] || "application/octet-stream";
      const range = req.headers.range;
      if (range) { // 비디오 Range 지원
        const [s, e] = range.replace("bytes=", "").split("-"); const start = Number(s), end = e ? Number(e) : size - 1;
        rsp.writeHead(206, { "Content-Type": type, "Content-Range": `bytes ${start}-${end}/${size}`, "Accept-Ranges": "bytes", "Content-Length": end - start + 1 });
        return fs.createReadStream(fp, { start, end }).pipe(rsp);
      }
      rsp.writeHead(200, { "Content-Type": type, "Content-Length": size, "Accept-Ranges": "bytes" });
      fs.createReadStream(fp).pipe(rsp);
    });
    srv.listen(PORT, "127.0.0.1", () => res(srv));
  });
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const frameDir = path.join(WORK, "frames"); fs.mkdirSync(frameDir, { recursive: true });
  const prof = path.join(WORK, "profile");
  const srv = await serve();
  const chrome = spawn(CHROME, [
    "--headless=new", `--remote-debugging-port=${DBG}`, `--window-size=${W},${H}`, `--user-data-dir=${prof}`,
    "--no-first-run", "--no-default-browser-check", "--hide-scrollbars", "--mute-audio",
    "--autoplay-policy=no-user-gesture-required", "--disable-background-timer-throttling", "--disable-renderer-backgrounding",
    "--lang=ko-KR", "about:blank",
  ], { stdio: "ignore" });
  let targets;
  for (let i = 0; i < 50; i++) { try { targets = await (await fetch(`http://127.0.0.1:${DBG}/json/list`)).json(); if (targets.length) break; } catch (e) {} await sleep(200); }
  const page = targets.find((t) => t.type === "page");
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((r) => (ws.onopen = r));
  let id = 0; const pending = new Map();
  const send = (method, params = {}) => new Promise((res, rej) => { const i = ++id; pending.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method, params })); });
  const frames = []; let n = 0;
  ws.onmessage = (ev) => {
    const m = JSON.parse(ev.data);
    if (m.id && pending.has(m.id)) { const p = pending.get(m.id); pending.delete(m.id); m.error ? p.rej(new Error(m.error.message)) : p.res(m.result); return; }
    if (m.method === "Page.screencastFrame") {
      const { data, metadata, sessionId } = m.params;
      const f = path.join(frameDir, `f${String(++n).padStart(5, "0")}.jpg`);
      fs.writeFileSync(f, Buffer.from(data, "base64")); frames.push({ f, t: metadata.timestamp });
      send("Page.screencastFrameAck", { sessionId }).catch(() => {});
    }
  };
  await send("Page.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: W, height: H, deviceScaleFactor: 1, mobile: false });
  await send("Page.navigate", { url: `http://127.0.0.1:${PORT}/promo.html` });
  await sleep(300);
  // 녹화용: 안내 문구·다시재생 버튼 숨김
  await send("Runtime.evaluate", { expression: `(()=>{const s=document.createElement('style');s.textContent='.hint,#replay{display:none!important}';document.head.appendChild(s);})()` });
  await send("Page.startScreencast", { format: "jpeg", quality: 88, maxWidth: W, maxHeight: H, everyNthFrame: 1 });
  const t0 = Date.now();
  while (Date.now() - t0 < CAPTURE_MS) await sleep(500);
  await send("Page.stopScreencast").catch(() => {});
  ws.close(); chrome.kill(); srv.close();
  console.log(`captured ${frames.length} frames over ${(frames.at(-1).t - frames[0].t).toFixed(1)}s`);
  const lines = [];
  for (let i = 0; i < frames.length; i++) {
    const d = i < frames.length - 1 ? Math.max(0.001, frames[i + 1].t - frames[i].t) : 1 / 30;
    lines.push(`file '${frames[i].f.replace(/\\/g, "/")}'`, `duration ${d.toFixed(4)}`);
  }
  lines.push(`file '${frames.at(-1).f.replace(/\\/g, "/")}'`);
  const list = path.join(WORK, "list.txt"); fs.writeFileSync(list, lines.join("\n"));
  execFileSync(FFMPEG, ["-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", list, "-vf", `fps=30,scale=${W}:${H},format=yuv420p`, "-c:v", "libx264", "-crf", "20", "-preset", "medium", "-movflags", "+faststart", OUT], { stdio: "inherit" });
  console.log("written:", OUT);
  await sleep(500);
  try { fs.rmSync(WORK, { recursive: true, force: true }); } catch (e) {}
}
main().catch((e) => { console.error(e); process.exit(1); });
