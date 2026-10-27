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

function startServer() {
  console.log('Файл знайдено, тут буде запуск сервера');
}

// перевірка існування файлу через колбек
fs.access(options.input, (err) => {
  if (err) {
    console.error('Cannot find input file');
    process.exit(1);
  }
  startServer();
});