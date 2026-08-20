import { createServer } from "vite";

/**
 * Boots the Vite dev server in-process so capture/audit scripts are a single
 * command. Returns the resolved local URL plus a close handle.
 */
export async function startSite({ port = 0 } = {}) {
  const server = await createServer({
    configFile: "vite.config.ts",
    server: { port, strictPort: port !== 0 },
    logLevel: "warn",
  });

  await server.listen();
  const url = server.resolvedUrls?.local?.[0];
  if (!url) {
    await server.close();
    throw new Error("Vite did not report a local URL");
  }

  return { url: url.replace(/\/$/, ""), close: () => server.close() };
}

/**
 * Runs `fn` against a running site. If SITE_URL is set, reuses that instead of
 * booting a server (useful for pointing at a preview build or the deployed page).
 */
export async function withSite(fn) {
  const existing = process.env.SITE_URL;
  if (existing) return fn(existing.replace(/\/$/, ""));

  const site = await startSite();
  try {
    return await fn(site.url);
  } finally {
    await site.close();
  }
}
