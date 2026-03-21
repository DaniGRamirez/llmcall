# Performance: CLI Overhead y Alternativas

## El problema

Cada invocación de `llmCall` arranca un proceso Node nuevo. En Windows:

| Componente | Tiempo |
|------------|--------|
| Node.js startup | ~400ms |
| Module loading (yargs, ai SDK, providers) | ~400ms |
| Ollama API call (modelo warm) | ~500ms |
| **Total CLI** | **~1.3-1.5s** |
| **Ollama API directo (fetch)** | **~500-750ms** |

El overhead del CLI es ~800ms que no aporta nada cuando el llamador ya es un proceso Node (ej: un servidor HTTP).

## Evidencia (2026-03-21)

Medido en el hub dashboard de cerebro-nervio:

```bash
# Via llmCall CLI
time llmCall "test" --system "UNA frase" --tier local
# real 0m1.389s

# Via fetch directo a ollama
time curl -s http://localhost:11434/api/generate -d '{"model":"llama3.2:3b","prompt":"test","system":"UNA frase","stream":false}'
# real 0m0.746s
```

El hub tuvo que bypassear llmCall y llamar a ollama directo para TTS en tiempo real.

## Soluciones propuestas

### 1. Exportar como librería (mínimo esfuerzo)

`llmCall` ya tiene todo el código modular. Solo falta exportar la función principal:

```typescript
// src/index.ts
export { call } from "./call.js";
export { createProvider } from "./factory.js";
export { selectModel } from "./selector.js";
```

Uso:
```typescript
import { call } from "llmcall";

const result = await call("resumir esto", {
  system: "UNA frase en español",
  tier: "local"
});
```

**Beneficio**: elimina 800ms de overhead. El consumidor no spawneá un proceso — importa la función.

**Esfuerzo**: bajo. El CLI ya separa la lógica en `call()` / `factory` / `selector`. Solo falta el export.

### 2. Modo servidor (mayor beneficio)

```bash
llmCall serve --port 3456
```

Levanta un HTTP server que acepta requests:

```bash
curl -X POST http://localhost:3456/call \
  -d '{"prompt":"test","system":"UNA frase","tier":"local"}'
```

**Beneficio**: proceso Node warm, zero startup overhead. Ideal para integraciones que hacen muchas llamadas (TTS, pipelines).

**Esfuerzo**: medio. Necesita un servidor HTTP minimal (como el hub dashboard) + las mismas rutas que el CLI.

### 3. Cache de provider (quick win)

El selector resuelve el provider en cada llamada (`isAvailable()` checkea el filesystem). Cachear el provider resuelto entre llamadas ahorraría ~100ms.

## Prioridad recomendada

1. **Exportar como librería** — quick win, mayor impacto
2. **Cache de provider** — trivial, complementario
3. **Modo servidor** — solo si hay consumidores externos (no Node)

## Contexto

El caso de uso que motivó esto: el hub dashboard de cerebro-nervio necesita TTS en tiempo real (~2s budget total). El pipeline es:

```
agent message → llmCall (humanize+translate) → vf say (TTS)
```

Con llmCall CLI: 1.5s + 0.5s = 2s (ajustado)
Con ollama directo: 0.7s + 0.5s = 1.2s (aceptable)
Con librería importada: ~0.6s + 0.5s = 1.1s (ideal)
