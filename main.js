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

// відправка JSON-відповіді
function send(res, status, payload) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
}

function startServer() {
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost');

    if (url.pathname !== '/') {
      send(res, 404, { error: 'Маршрут не знайдено' });
      return;
    }

    send(res, 200, { message: 'Тут будуть дані' });
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