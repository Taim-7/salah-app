import { createServer } from 'node:http';
import { createReadStream, mkdirSync, statSync, chmodSync } from 'node:fs';
import { homedir } from 'node:os';
import { resolve, extname } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { createReminderService } from './service.mjs';

const port = Number(process.env.SALAH_PORT ?? 8080);
const host = process.env.SALAH_BIND ?? '127.0.0.1';
const publicURL = new URL(process.env.SALAH_ORIGIN ?? `http://localhost:${port}/`);
if (publicURL.search || publicURL.hash || publicURL.username || publicURL.password ||
    (publicURL.protocol !== 'https:' && !/^http:\/\/(?:localhost|127\.0\.0\.1)(?::|\/)/.test(publicURL.href))) {
  throw Error('Set SALAH_ORIGIN to the public HTTPS address for Salah. Use localhost for local testing.');
}
const mount = publicURL.pathname.endsWith('/') ? publicURL.pathname : publicURL.pathname + '/';
const data = resolve(process.env.SALAH_DATA_DIR ?? resolve(homedir(), '.salah-notifications'));
mkdirSync(data, { recursive: true, mode: 0o700 });
const databasePath = resolve(data, 'notifications.sqlite');
const database = new DatabaseSync(databasePath);
chmodSync(databasePath, 0o600);
database.exec('PRAGMA journal_mode = WAL;');
const reminders = createReminderService({ database, origin: publicURL.origin, subject: process.env.SALAH_CONTACT });

const mime = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.webmanifest': 'application/manifest+json; charset=utf-8'
};
const publicFile = /^(?:index\.html|styles\.css|(?:app|region|solar|providers|timetable|audio|sw|reminders)\.js|manifest(?:-[a-z-]+)?\.webmanifest|install\/(?:[a-z-]+\.html|icon\.js)|icons\/(?:[a-z]+\/)*[a-z0-9-]+\.png|vendor\/magvar\/[A-Za-z0-9]+\.mjs)$/;

function serveFile(request, response, path) {
  if (!['GET', 'HEAD'].includes(request.method)) { response.writeHead(405).end(); return; }
  const relative = path || 'index.html';
  if (!publicFile.test(relative)) { response.writeHead(404).end(); return; }
  const file = resolve(import.meta.dirname, '..', relative);
  const info = statSync(file, { throwIfNoEntry: false });
  if (!info?.isFile()) { response.writeHead(404).end(); return; }
  response.writeHead(200, {
    'Content-Type': mime[extname(file)], 'Content-Length': info.size,
    'Cache-Control': 'no-cache', 'X-Content-Type-Options': 'nosniff'
  });
  if (request.method === 'HEAD') response.end();
  else createReadStream(file).on('error', () => response.destroy()).pipe(response);
}

const server = createServer({ requestTimeout: 15_000 }, async (request, response) => {
  try {
    const url = new URL(request.url, publicURL);
    if (url.origin !== publicURL.origin) { response.writeHead(400).end(); return; }
    if (url.pathname === mount.slice(0, -1)) { response.writeHead(308, { Location: mount + url.search }).end(); return; }
    if (!url.pathname.startsWith(mount)) { response.writeHead(404).end(); return; }
    const path = decodeURIComponent(url.pathname.slice(mount.length));
    if (path === 'api/reminders' || path.startsWith('api/reminders/')) {
      await reminders.handle(request, response, path.slice('api/reminders'.length));
    } else serveFile(request, response, path);
  } catch (error) {
    if (!response.headersSent) response.writeHead(error instanceof URIError ? 400 : 500);
    response.end();
  }
});

server.listen(port, host, () => {
  console.log(`Salah is listening on ${host}:${port}${mount}`);
  const dispatch = () => reminders.dispatch().catch(() => console.error('Could not check notification times.'));
  void dispatch();
  setInterval(dispatch, 15_000).unref();
});
