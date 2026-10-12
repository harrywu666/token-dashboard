# 代币调查看板

GitHub Pages：https://harrywu666.github.io/token-dashboard/

## 结构
- `app/` — React + Vite + Tailwind + shadcn 风格源码（`base: /token-dashboard/`）
- `data/` — 运行时 JSON（分析师每小时覆盖并 `publish.sh` 推送，**无需重新 build**）
- `index.html` + `assets/` — 构建产物（Pages 从 main 根目录发布）
- `publish.sh` — 只提交 `data/`
- `build.sh` — 构建并把产物拷到仓库根目录

## 本地构建
```bash
./build.sh
# 预览（需带 base path）
mkdir -p /tmp/tdash/token-dashboard && cp -r index.html assets data .nojekyll /tmp/tdash/token-dashboard/
cd /tmp/tdash && python3 -m http.server 8787
# 打开 http://127.0.0.1:8787/token-dashboard/
```
