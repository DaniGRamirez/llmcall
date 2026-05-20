import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import type { CallOptions } from "./call.js";

const SERVER_URL = "http://127.0.0.1:3456";

export async function isServerRunning(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 50);
    const res = await fetch(`${SERVER_URL}/health`, { signal: controller.signal });
    clearTimeout(timeout);
    return res.ok;
  } catch {
    return false;
  }
}

export async function callViaServer(
  prompt: string,
  options: CallOptions = {},
): Promise<string> {
  const res = await fetch(`${SERVER_URL}/call`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, ...options }),
  });

  const data = (await res.json()) as { result?: string; error?: string };
  if (!res.ok || data.error) {
    throw new Error(data.error ?? `Server returned ${res.status}`);
  }
  return data.result!;
}

export async function spawnServer(): Promise<void> {
  // Don't spawn if one is already running
  if (await isServerRunning()) return;

  const cliPath = fileURLToPath(new URL("./cli.js", import.meta.url));

  const child = spawn(process.execPath, [cliPath, "serve"], {
    detached: true,
    stdio: "ignore",
    windowsHide: true,
  });
  child.unref();
}
