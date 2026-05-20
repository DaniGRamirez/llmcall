import { createServer } from "node:http";
import { call } from "./call.js";
import type { CallOptions } from "./call.js";

const DEFAULT_PORT = 3456;
const IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 min

export function startServer(port = DEFAULT_PORT): void {
  let idleTimer: ReturnType<typeof setTimeout>;

  const resetIdle = () => {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      process.stderr.write("llmcall server: idle timeout, shutting down\n");
      process.exit(0);
    }, IDLE_TIMEOUT_MS);
  };

  const server = createServer(async (req, res) => {
    resetIdle();

    if (req.method === "GET" && req.url === "/health") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: true }));
      return;
    }

    if (req.method === "POST" && req.url === "/call") {
      let body = "";
      for await (const chunk of req) body += chunk;

      try {
        const { prompt, ...options } = JSON.parse(body) as { prompt: string } & CallOptions;
        const result = await call(prompt, options);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ result }));
      } catch (err: any) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: err.message }));
      }
      return;
    }

    res.writeHead(404);
    res.end("Not found");
  });

  server.on("error", (err: NodeJS.ErrnoException) => {
    if (err.code === "EADDRINUSE") {
      // Another server already running — exit silently
      process.exit(0);
    }
    process.stderr.write(`llmcall server error: ${err.message}\n`);
    process.exit(1);
  });

  server.listen(port, "127.0.0.1", () => {
    process.stderr.write(`llmcall server listening on http://127.0.0.1:${port}\n`);
    resetIdle();
  });
}
