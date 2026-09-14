# Prompt: FX Banking Wiki — Deploy via GitHub Pages (Docusaurus)

## Context

Đây là project **FX Banking Wiki** — tài liệu kỹ thuật mô tả nghiệp vụ
Foreign Exchange (FX) trong hệ thống ngân hàng, **khác với** project
"FintechSaaS Expense Platform" (nếu repo cũ có prompt Docusaurus khác,
đừng nhầm — đây là bộ docs/config riêng, domain riêng).

Toàn bộ nội dung `docs/*.md`, `sidebars.ts`, `docusaurus.config.ts` đã
được soạn sẵn (đính kèm/đã có trong thư mục làm việc) — nhiệm vụ của
Claude Code là **scaffold Docusaurus, gắn đúng các file này vào, và
deploy**, không phải viết lại nội dung.

Cấu trúc repo mong muốn sau khi xong:
```
repo-root/
├── docs/                    ← 10 file .md ĐÃ CÓ SẴN, không sửa nội dung
│   ├── 00-overview.md
│   ├── 01-hulft-file-parsing.md
│   ├── 02-webshokin-screen.md
│   ├── 03-tenpo-approval.md
│   ├── 04-bizforex-exchange.md
│   ├── 05-core-banking-accounting.md
│   ├── 06-swift-hulft-messaging.md
│   ├── 07-settlement-sync.md
│   ├── 08-design-principles.md
│   └── 09-interview-prep.md
├── sidebars.ts              ← ĐÃ CÓ SẴN, copy vào wiki/ sau khi scaffold
├── docusaurus.config.ts     ← ĐÃ CÓ SẴN (bản draft, cần điền {GITHUB_USERNAME}/{REPO_NAME})
└── .github/
    └── workflows/
        └── wiki-deploy.yml  ← sẽ tạo mới
```

**Quan trọng:** mỗi file trong `docs/` đã có frontmatter `id` khớp chính
xác với `sidebars.ts` — xem bảng đối chiếu ở Step 4 trước khi động vào
gì. Không đổi `id`, không đổi tên file trừ khi có lý do rõ ràng.

---

## Step 1 — Tìm repo name

```bash
git remote get-url origin
# Ví dụ: https://github.com/{USERNAME}/{REPO}.git
# → GitHub Pages URL = https://{USERNAME}.github.io/{REPO}
```

Lưu `{GITHUB_USERNAME}` và `{REPO_NAME}` — dùng ở Step 3.

---

## Step 2 — Khởi tạo Docusaurus

```bash
npx create-docusaurus@latest wiki classic --typescript
cd wiki
rm -rf docs blog src/pages/index.*
```

---

## Step 3 — Đặt `docusaurus.config.ts`

Copy file `docusaurus.config.ts` đã soạn sẵn vào `wiki/docusaurus.config.ts`,
sau đó thay `{GITHUB_USERNAME}` và `{REPO_NAME}` bằng giá trị thật lấy
từ Step 1 (xuất hiện ở 6 chỗ: `url`, `baseUrl`, `organizationName`,
`projectName`, `editUrl`, navbar GitHub link).

File này đã cấu hình sẵn:
- `title: 'FX Banking Wiki'`, `tagline: 'Foreign exchange banking platform — built for German compliance'`
- `markdown.mermaid: true` + theme `@docusaurus/theme-mermaid` — **bắt buộc**,
  vì `03-tenpo-approval.md` và `05-core-banking-accounting.md` có sơ đồ mermaid
- `docs.path: '../docs'`, `routeBasePath: '/'` — site root = docs, không phải `/docs/`
- search local (`@easyops-cn/docusaurus-search-local`), không dùng Algolia
- `prism.additionalLanguages: ['java', 'sql', 'bash', 'xml']`

Nếu muốn đổi title/tagline sang tên khác (repo name gợi ý trước đó:
`FX Settlement Platform`, `LedgerBridge FX`...), sửa 2 dòng đầu file —
không ảnh hưởng phần còn lại.

---

## Step 4 — Đặt `sidebars.ts`

Copy file `sidebars.ts` đã soạn sẵn vào `wiki/sidebars.ts`.

Bảng đối chiếu `id` (frontmatter trong `docs/*.md`) ↔ sidebar item —
dùng để verify không lệch:

| File | `id` trong frontmatter | Category trong sidebar |
|---|---|---|
| `00-overview.md` | `overview` | 1. Overview |
| `01-hulft-file-parsing.md` | `hulft-file-parsing` | 2. Input Layer |
| `02-webshokin-screen.md` | `webshokin-screen` | 3. Front & Branch |
| `03-tenpo-approval.md` | `tenpo-approval` | 3. Front & Branch |
| `04-bizforex-exchange.md` | `bizforex-exchange` | 4. Exchange & Accounting |
| `05-core-banking-accounting.md` | `cbs-accounting` | 4. Exchange & Accounting |
| `06-swift-hulft-messaging.md` | `swift-hulft-messaging` | 5. Messaging & Sync |
| `07-settlement-sync.md` | `settlement-sync` | 5. Messaging & Sync |
| `08-design-principles.md` | `design-principles` | 6. Foundations |
| `09-interview-prep.md` | `interview-prep` | 7. Reference |

Không cần thêm frontmatter — 10 file đã có sẵn `id`/`title`/`sidebar_position`.

---

## Step 5 — Copy `docs/*.md` vào repo root

Nếu chưa có, copy 10 file `.md` đã soạn vào `docs/` ở **repo root** (ngang
hàng `wiki/`, không phải trong `wiki/docs/`) — đúng như path `'../docs'`
đã khai trong config.

---

## Step 6 — Install dependencies

```bash
cd wiki
npm install
npm install @easyops-cn/docusaurus-search-local
npm install @docusaurus/theme-mermaid
```

---

## Step 7 — Custom CSS `wiki/src/css/custom.css`

Thêm vào cuối file (giữ phần Docusaurus tự gen):

```css
:root {
  --ifm-color-primary: #1B4B91;
  --ifm-color-primary-dark: #163C74;
  --ifm-color-primary-darker: #11305C;
  --ifm-color-primary-darkest: #0C2140;
  --ifm-color-primary-light: #2E63B8;
  --ifm-color-primary-lighter: #4C7ECF;
  --ifm-color-primary-lightest: #A9C4EA;
  --ifm-code-font-size: 90%;
}

[data-theme='dark'] {
  --ifm-background-color: #16181d;
}

.prism-code {
  font-size: 13px;
}

table {
  display: table;
  width: 100%;
}

/* mermaid diagram wrapper — tránh tràn ngang trên mobile */
.docusaurus-mermaid-container {
  overflow-x: auto;
}
```

(Màu primary chọn tông xanh navy — khác với tím `#534AB7` của project
Expense Platform, để 2 wiki không bị nhầm nhìn giống nhau nếu để cạnh
nhau trên CV.)

---

## Step 8 — Verify build local

```bash
cd wiki
npm run build
npm run serve
```

Checklist:
- Mở `http://localhost:3000/{REPO_NAME}/` — trang chủ load được
- Sidebar hiện đủ 7 category, 10 page, đúng thứ tự như bảng Step 4
- Vào `tenpo-approval` và `cbs-accounting` — verify **mermaid diagram
  render đúng**, không bị lỗi "Loading..." treo hoặc syntax error
- Search hoạt động (gõ thử "Kanryo" hoặc "Denpyo")
- Code block Java/SQL/XML có syntax highlighting
- Không có warning `onBrokenLinks` nào trong log build

---

## Step 9 — GitHub Actions workflow

Tạo `.github/workflows/wiki-deploy.yml` tại repo root:

```yaml
name: Deploy FX Banking Wiki to GitHub Pages

on:
  push:
    branches:
      - main
    paths:
      - 'docs/**'
      - 'wiki/**'
  workflow_dispatch:

permissions:
  contents: write

jobs:
  deploy:
    name: Build and deploy Docusaurus
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
          cache-dependency-path: wiki/package-lock.json

      - name: Install dependencies
        run: cd wiki && npm ci

      - name: Build
        run: cd wiki && npm run build

      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v4
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./wiki/build
          keep_files: false
```

---

## Step 10 — Enable GitHub Pages

Trên GitHub UI:
1. Repo → Settings → Pages
2. Source: **"Deploy from a branch"**
3. Branch: **`gh-pages`** / folder: **`/ (root)`**
4. Save

`gh-pages` branch sẽ tự tạo sau lần Actions chạy đầu tiên. Có thể
trigger thủ công qua "Run workflow" trong tab Actions.

---

## Step 11 — Verify sau deploy

```
✓ https://{GITHUB_USERNAME}.github.io/{REPO_NAME}/
✓ https://{GITHUB_USERNAME}.github.io/{REPO_NAME}/tenpo-approval    (mermaid render)
✓ https://{GITHUB_USERNAME}.github.io/{REPO_NAME}/cbs-accounting    (mermaid render)
✓ Search hoạt động (offline, không cần key)
✓ Sidebar đủ 7 categories, 10 pages
✓ Không còn xuất hiện "BeSTA"/"Contimex" ở bất kỳ đâu ngoại trừ đúng
  1 chỗ "(vd: BeSTA)" trong trang overview
```

---

## README.md — nội dung dùng sẵn (đã duyệt, dán thẳng)

**GitHub repo description** (About section, ~150 ký tự):
```
Technical wiki: end-to-end FX transaction processing in core banking — branch order entry, exchange calc, accounting, SWIFT settlement.
```

**README.md — đoạn mở đầu (English):**
```
Technical documentation covering the end-to-end foreign exchange (FX) transaction flow in a banking system — from order entry at the branch counter, branch-level approval control, and exchange rate calculation, through to accounting entries and reconciliation with the downstream core banking system. It goes deep into real-world enterprise integration patterns: batch file processing (HULFT), interbank messaging (SWIFT), and the design principles behind financial systems (rollback, idempotency, reconciliation).
```

**Docusaurus tagline:**
```
Foreign exchange banking platform — built for German compliance
```

Lưu ý khi viết phần còn lại của README: định vị đây là **"Technical
Documentation / Domain Knowledge"**, không phải "Personal Project" kiểu
build app from scratch — tránh gây hiểu lầm khi phỏng vấn hỏi sâu.

---

## Không làm trong prompt này

- Không đụng vào project Expense Platform (nếu 2 project chung 1 repo,
  không sửa `docs/` hay `wiki/` của project đó)
- Không setup i18n (en/de) — xem prompt riêng `DOCUSAURUS-I18N-PROMPT.md`,
  chỉ làm sau khi bước deploy cơ bản này chạy ổn
- Không thêm GIF/video — làm sau qua GitHub Releases (xem phần cuối
  `DOCUSAURUS-DEPLOY-PROMPT.md` gốc nếu cần tham khảo lại cách làm)
- Không custom domain

## Output cần báo lại

1. URL GitHub Pages chính xác
2. Kết quả `npm run build` (có lỗi/warning không)
3. Confirm 10 pages generate đủ, đúng thứ tự sidebar
4. Confirm 2 trang có mermaid (`tenpo-approval`, `cbs-accounting`) render đúng, không lỗi
