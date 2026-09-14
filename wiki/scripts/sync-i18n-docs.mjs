// Đồng bộ docs/de/*.md và docs/vi/*.md (repo root, nguồn thật) sang
// wiki/i18n/<locale>/docusaurus-plugin-content-docs/current/ (nơi Docusaurus đọc
// nội dung dịch). Chạy lại script này mỗi khi sửa nội dung trong docs/de hoặc docs/vi.
import { cpSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const wikiRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const repoRoot = path.dirname(wikiRoot);

const locales = ['de', 'vi'];

for (const locale of locales) {
  const src = path.join(repoRoot, 'docs', locale);
  const dest = path.join(
    wikiRoot,
    'i18n',
    locale,
    'docusaurus-plugin-content-docs',
    'current',
  );

  mkdirSync(dest, { recursive: true });
  // xoá các .md cũ trong dest trước khi copy, để file bị xoá ở nguồn cũng biến mất ở đích
  for (const f of readdirSync(dest)) {
    if (f.endsWith('.md')) rmSync(path.join(dest, f));
  }

  for (const f of readdirSync(src)) {
    if (!f.endsWith('.md')) continue;
    cpSync(path.join(src, f), path.join(dest, f));
  }

  console.log(`[i18n:sync] docs/${locale} -> wiki/i18n/${locale}/docusaurus-plugin-content-docs/current`);
}
