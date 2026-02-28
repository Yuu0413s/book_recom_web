import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { booksRoute } from './routes/books';
import { searchRoute } from './routes/search';
import { embeddingsRoute } from './routes/embeddings';
import { syncRoute } from './routes/sync';
import { syncAllSources } from './sync/book-sync';

export type Env = {
  DB: D1Database;
  VECTORIZE: VectorizeIndex;
  GEMINI_API_KEY: string;
};

const app = new Hono<{ Bindings: Env }>();

app.use(
  '/api/*',
  cors({
    origin: (origin) => {
      // ローカル開発 と Cloudflare Pages を許可
      if (!origin) return '*';
      if (origin.startsWith('http://localhost:')) return origin;
      if (origin.endsWith('.pages.dev')) return origin;
      return null;
    },
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    allowHeaders: ['Content-Type'],
  })
);

app.route('/api/books', booksRoute);
app.route('/api/search', searchRoute);
app.route('/api/embeddings', embeddingsRoute);
app.route('/api/sync', syncRoute);

app.get('/', (c) => c.json({ status: 'ok', service: 'book-recom-api' }));

export default {
  fetch: app.fetch,
  async scheduled(_event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(syncAllSources(env));
  },
};
