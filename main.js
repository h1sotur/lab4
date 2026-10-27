import http from 'node:http';
import fs from 'node:fs';
import { Command } from 'commander';

const program = new Command();
program
  .helpOption('--help', 'показати довідку')
  .requiredOption('-i, --input <path>', 'шлях до файлу даних')
  .requiredOption('-h, --host <address>', 'адреса сервера')
  .requiredOption('-p, --port <number>', 'порт сервера')
  .option('-o, --output <path>', 'файл для останньої відповіді');

program.parse();
const options = program.opts();

// число з файлу: рядок -> число; null, порожнє, не число -> null
function toNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isNaN(n) ? null : n;
}

// відправка JSON-відповіді; якщо задано --output, відповідь також пишеться у файл
function send(res, status, payload) {
  const body = JSON.stringify(payload);

  const finish = (code, text) => {
    res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(text);
  };

  if (!options.output) {
    finish(status, body);
    return;
  }

  fs.writeFile(options.output, body, (err) => {
    if (err) {
      finish(500, JSON.stringify({ error: 'Помилка запису у вихідний файл' }));
      return;
    }
    finish(status, body);
  });
}

function startServer() {
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost');

    if (url.pathname !== '/') {
      send(res, 404, { error: 'Маршрут не знайдено' });
      return;
    }

    // прапорці: увімкнено лише при значенні рівно "true"
    const showMfo = url.searchParams.get('mfo') === 'true';
    const onlyNormal = url.searchParams.get('normal') === 'true';

    // файл читається на кожен запит
    fs.readFile(options.input, 'utf8', (err, text) => {
      if (err) {
        send(res, 500, { error: 'Не вдалося прочитати файл даних' });
        return;
      }

      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        send(res, 500, { error: 'Файл даних пошкоджено' });
        return;
      }

      if (!Array.isArray(data)) {
        send(res, 500, { error: 'Файл даних має неправильну структуру' });
        return;
      }

      const result = data
        .filter((item) => item !== null && typeof item === 'object')
        .filter((item) => !onlyNormal || toNumber(item.COD_STATE) === 1)
        .map((item) => {
          const row = {};
          if (showMfo) row.mfo_code = toNumber(item.MFO);
          row.name = item.SHORTNAME ?? null;
          row.state_code = toNumber(item.COD_STATE);
          return row;
        });

      send(res, 200, result);
    });
  });

  server.listen(Number(options.port), options.host, () => {
    console.log(`Сервер: http://${options.host}:${options.port}`);
  });
}

fs.access(options.input, (err) => {
  if (err) {
    console.error('Cannot find input file');
    process.exit(1);
  }
  startServer();
});