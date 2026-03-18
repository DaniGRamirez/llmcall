interface HtmlBenchmarkResult {
  provider: string;
  model: string;
  response?: string;
  durationMs: number;
  error?: string;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export function generateBenchmarkHtml(prompt: string, results: HtmlBenchmarkResult[]): string {
  const succeeded = results.filter((r) => !r.error);
  const avgMs = succeeded.length > 0
    ? succeeded.reduce((sum, r) => sum + r.durationMs, 0) / succeeded.length
    : 0;
  const fastest = succeeded[0];

  const cards = results.map((r) => `
    <div class="card ${r.error ? "error" : "ok"}">
      <div class="card-header">
        <span class="provider">${escapeHtml(r.provider)}</span>
        <span class="model">${escapeHtml(r.model)}</span>
        <span class="time">${r.error ? "error" : formatDuration(r.durationMs)}</span>
      </div>
      <div class="card-body">
        ${r.error
          ? `<div class="error-msg">${escapeHtml(r.error)}</div>`
          : `<pre>${escapeHtml(r.response || "")}</pre>`
        }
      </div>
    </div>
  `).join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>llmcall benchmark</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f5f5f5; padding: 24px; color: #333; }
  .header { margin-bottom: 24px; }
  .header h1 { font-size: 20px; margin-bottom: 8px; }
  .header .prompt { background: #fff; padding: 12px; border-radius: 6px; border: 1px solid #ddd; font-family: monospace; white-space: pre-wrap; }
  .summary { display: flex; gap: 24px; margin-bottom: 24px; padding: 12px 16px; background: #fff; border-radius: 6px; border: 1px solid #ddd; }
  .summary .stat { font-size: 14px; }
  .summary .stat strong { font-size: 16px; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(400px, 1fr)); gap: 16px; }
  .card { background: #fff; border-radius: 8px; border: 1px solid #ddd; overflow: hidden; }
  .card.error { border-color: #e74c3c; }
  .card-header { display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; background: #fafafa; border-bottom: 1px solid #eee; font-size: 13px; }
  .card.error .card-header { background: #fdf0ef; }
  .provider { font-weight: 600; color: #555; }
  .model { font-family: monospace; color: #333; }
  .time { font-weight: 600; color: #27ae60; }
  .card.error .time { color: #e74c3c; }
  .card-body { padding: 14px; max-height: 400px; overflow-y: auto; }
  .card-body pre { white-space: pre-wrap; font-size: 13px; line-height: 1.5; }
  .error-msg { color: #e74c3c; font-style: italic; }
  .date { color: #999; font-size: 12px; margin-top: 4px; }
</style>
</head>
<body>
  <div class="header">
    <h1>llmcall benchmark</h1>
    <div class="date">${new Date().toISOString()}</div>
    <div class="prompt">${escapeHtml(prompt)}</div>
  </div>
  <div class="summary">
    <div class="stat"><strong>${succeeded.length}/${results.length}</strong> succeeded</div>
    <div class="stat">Avg: <strong>${formatDuration(avgMs)}</strong></div>
    ${fastest ? `<div class="stat">Fastest: <strong>${escapeHtml(fastest.provider)}/${escapeHtml(fastest.model)}</strong> (${formatDuration(fastest.durationMs)})</div>` : ""}
  </div>
  <div class="grid">
    ${cards}
  </div>
</body>
</html>`;
}
