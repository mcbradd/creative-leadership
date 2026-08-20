import { spawn } from "node:child_process";
import { once } from "node:events";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

const targetUrl = process.argv[2] ?? "https://mcbradd.github.io/creative-leadership/?release=241239a";
const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const profile = await mkdtemp(path.join(tmpdir(), "bs-hero-repro-"));

class CdpClient {
  constructor(url) {
    this.nextId = 1;
    this.pending = new Map();
    this.listeners = new Set();
    this.socket = new WebSocket(url);
  }

  async open() {
    await new Promise((resolve, reject) => {
      this.socket.addEventListener("open", resolve, { once: true });
      this.socket.addEventListener("error", reject, { once: true });
    });
    this.socket.addEventListener("message", ({ data }) => {
      const message = JSON.parse(data);
      if (message.id) {
        const pending = this.pending.get(message.id);
        if (!pending) return;
        this.pending.delete(message.id);
        if (message.error) pending.reject(new Error(message.error.message));
        else pending.resolve(message.result);
        return;
      }
      for (const listener of this.listeners) listener(message);
    });
  }

  send(method, params = {}, sessionId) {
    const id = this.nextId++;
    const message = { id, method, params };
    if (sessionId) message.sessionId = sessionId;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.socket.send(JSON.stringify(message));
    });
  }

  waitFor(method, sessionId, timeoutMs = 10_000) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.listeners.delete(listener);
        reject(new Error(`Timed out waiting for ${method}`));
      }, timeoutMs);
      const listener = (message) => {
        if (message.method !== method || message.sessionId !== sessionId) return;
        clearTimeout(timeout);
        this.listeners.delete(listener);
        resolve(message.params);
      };
      this.listeners.add(listener);
    });
  }

  close() {
    this.socket.close();
  }
}

const delay = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function waitForPortFile() {
  const portFile = path.join(profile, "DevToolsActivePort");
  for (let attempt = 0; attempt < 100; attempt += 1) {
    try {
      const [port] = (await readFile(portFile, "utf8")).trim().split(/\r?\n/);
      return Number(port);
    } catch {
      await delay(50);
    }
  }
  throw new Error("Chrome did not publish a DevTools port");
}

const chrome = spawn(chromePath, [
  "--headless=new",
  "--disable-background-networking",
  "--disable-default-apps",
  "--disable-extensions",
  "--disable-features=Translate",
  "--enable-unsafe-swiftshader",
  "--no-default-browser-check",
  "--no-first-run",
  "--remote-debugging-port=0",
  "--use-angle=swiftshader",
  "--window-size=1265,720",
  `--user-data-dir=${profile}`,
  "about:blank",
], { stdio: "ignore" });

let client;
try {
  const port = await waitForPortFile();
  const version = await fetch(`http://127.0.0.1:${port}/json/version`).then((response) => response.json());
  client = new CdpClient(version.webSocketDebuggerUrl);
  await client.open();

  const { targetId } = await client.send("Target.createTarget", { url: "about:blank" });
  const { sessionId } = await client.send("Target.attachToTarget", { targetId, flatten: true });
  await client.send("Page.enable", {}, sessionId);
  await client.send("Runtime.enable", {}, sessionId);
  await client.send("Log.enable", {}, sessionId);
  await client.send("Page.addScriptToEvaluateOnNewDocument", {
    source: `window.addEventListener("webglcontextlost", () => console.error("[hero-repro] webglcontextlost"), true);`,
  }, sessionId);
  const diagnostics = [];
  client.listeners.add((message) => {
    if (message.sessionId !== sessionId) return;
    if (message.method === "Log.entryAdded") diagnostics.push(message.params.entry.text);
    if (message.method === "Runtime.exceptionThrown") diagnostics.push(message.params.exceptionDetails.text);
    if (message.method === "Runtime.consoleAPICalled") {
      diagnostics.push(message.params.args.map((argument) => argument.value ?? argument.description ?? argument.type).join(" "));
    }
  });

  const evaluate = async (expression) => {
    const result = await client.send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true }, sessionId);
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
    return result.result.value;
  };

  const navigate = client.waitFor("Page.loadEventFired", sessionId);
  await client.send("Page.navigate", { url: targetUrl }, sessionId);
  await navigate;
  await delay(1_000);

  const arm = await evaluate(`(() => {
    document.documentElement.style.scrollBehavior = "auto";
    const hero = document.querySelector("#top");
    const distance = Math.max(1, hero.offsetHeight - innerHeight);
    const maxScroll = Math.max(0, document.documentElement.scrollHeight - innerHeight);
    const target = distance > 1 ? distance * 0.98 : Math.min(maxScroll, innerHeight * 1.25);
    scrollTo(0, Math.round(target));
    return { scrollY, distance, target };
  })()`);
  await delay(1_000);

  const beforeReload = await evaluate(`(() => ({
    scrollY,
    heroTravel: Math.max(1, document.querySelector("#top").offsetHeight - innerHeight),
    phase: document.querySelector("#top").dataset.phase,
    static: document.querySelector("#top").dataset.static,
    enhanced: document.querySelector("#top").dataset.enhanced,
    canvas: Boolean(document.querySelector(".hero-cinematic canvas")),
  }))()`);

  const reload = client.waitFor("Page.loadEventFired", sessionId);
  await client.send("Runtime.evaluate", { expression: "location.reload()" }, sessionId);
  await reload;
  await delay(1_000);

  const readState = `(() => {
    const hero = document.querySelector("#top");
    const poster = document.querySelector(".hero-poster");
    const payoff = document.querySelector(".hero-payoff");
    return {
      scrollY,
      heroTravel: Math.max(1, hero.offsetHeight - innerHeight),
      phase: hero.dataset.phase,
      posterOpacity: getComputedStyle(poster).opacity,
      payoffOpacity: getComputedStyle(payoff).opacity,
    };
  })()`;
  const restored = await evaluate(readState);
  await evaluate(`scrollTo(0, 0)`);
  await delay(250);
  const recovered = await evaluate(readState);

  const restoredCopyVisible = Number(restored.posterOpacity) > 0.95 || Number(restored.payoffOpacity) > 0.95;
  const recoveredCopyVisible =
    (recovered.phase === "poster" && Number(recovered.posterOpacity) > 0.95) ||
    (recovered.phase === "payoff" && Number(recovered.payoffOpacity) > 0.95);
  const regressed = Math.abs(restored.scrollY - arm.scrollY) > 64 || !restoredCopyVisible || !recoveredCopyVisible;
  console.log(JSON.stringify({ targetUrl, arm, beforeReload, restored, recovered, diagnostics, regressed }, null, 2));
  if (regressed) {
    console.error("FAIL: native scroll restoration produced a hidden or inconsistent hero state.");
    process.exitCode = 1;
  } else {
    console.log("PASS: native scroll restoration keeps the viewer's position and always exposes readable DOM copy.");
  }
} finally {
  client?.close();
  chrome.kill();
  if (chrome.exitCode === null) {
    await Promise.race([once(chrome, "exit"), delay(2_000)]);
  }
  const resolvedProfile = path.resolve(profile);
  const resolvedTemp = path.resolve(tmpdir());
  if (resolvedProfile.startsWith(`${resolvedTemp}${path.sep}`) && path.basename(resolvedProfile).startsWith("bs-hero-repro-")) {
    await rm(resolvedProfile, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
  }
}
