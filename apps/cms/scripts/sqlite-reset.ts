import { copyFileSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import path from 'node:path';

/**
 * Zero-setup mode. Copies the committed demo database to .tmp/ so that runs
 * never modify the file in Git. Without a demo file, Strapi starts empty and
 * the bootstrap seed fills it.
 */
const root = process.cwd();
const source = path.join(root, 'database', 'demo.sqlite');
const target = path.join(root, '.tmp', 'data.db');

mkdirSync(path.dirname(target), { recursive: true });
rmSync(target, { force: true });
if (existsSync(source)) {
  copyFileSync(source, target);
  console.log(`sqlite: ${path.relative(root, source)} → ${path.relative(root, target)}`);
} else {
  console.log('sqlite: no demo database found, Strapi will seed a fresh one');
}
