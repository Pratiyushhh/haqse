import { defineConfig, loadEnv, type Plugin } from 'vite';
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

export default defineConfig(({ mode }) => {
  // Vite only exposes VITE_-prefixed variables to client code, and it does not
  // populate process.env at all. The dev gateway runs in the Vite process, so
  // the server-side key is loaded here explicitly. The '' prefix means "load
  // everything from .env", and because the value is only ever read inside
  // api/ai.ts it still never reaches the browser bundle.
  // On Vercel this block does nothing - the platform sets process.env itself.
  const env = loadEnv(mode, process.cwd(), '');
  if (env.ANTHROPIC_API_KEY) process.env.ANTHROPIC_API_KEY = env.ANTHROPIC_API_KEY;

  return {
    plugins: [react(), aiGateway()],
    build: { target: 'es2022' },
  };
});
