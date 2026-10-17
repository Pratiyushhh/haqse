import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * In production Vercel serves `api/ai.ts` as a serverless function.
 * In dev there is no Vercel runtime, so we mount the exact same handler as
 * Vite middleware. One implementation, two environments - no drift, and the
 * Gemini key stays server-side in both.
 */
function aiGateway(): Plugin {
  return {
    name: 'haqse-ai-gateway',
    configureServer(server) {
      server.middlewares.use('/api/ai', async (req, res) => {
        const chunks: Buffer[] = [];
        for await (const c of req) chunks.push(c as Buffer);
        const body = chunks.length ? JSON.parse(Buffer.concat(chunks).toString()) : {};
        const { default: handler } = await server.ssrLoadModule('/api/ai.ts');
        let status = 200;
        const shim = {
          status(code: number) { status = code; return shim; },
          json(payload: unknown) {
            res.statusCode = status;
            res.setHeader('content-type', 'application/json');
            res.end(JSON.stringify(payload));
          },
        };
        await handler({ method: req.method, body }, shim);
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), aiGateway()],
  build: { target: 'es2022' },
});
