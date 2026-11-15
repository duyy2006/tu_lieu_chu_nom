/* Tạo thư mục public/ để Vercel phục vụ như website tĩnh.
   Không chạy khi phát triển cục bộ; npm start vẫn phục vụ trực tiếp từ thư mục gốc. */
import { cp, mkdir, rm, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'public');
const ITEMS = ['index.html', 'assets', 'data', 'images'];

async function exists(target) {
  try {
    await stat(target);
    return true;
  } catch {
    return false;
  }
}

await rm(OUT, { recursive: true, force: true });
await mkdir(OUT, { recursive: true });

for (const item of ITEMS) {
  const source = path.join(ROOT, item);
  if (!(await exists(source))) {
    throw new Error(`Thiếu tệp/thư mục cần cho bản deploy: ${item}`);
  }
  await cp(source, path.join(OUT, item), { recursive: true });
}

console.log(`Đã tạo public/ với: ${ITEMS.join(', ')}`);
