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

## 缓存说明
- 数据请求使用 `cache: 'no-store'` + `?t=` 时间戳，普通刷新即可看到最新 `data/`。
- 每次 `./build.sh` 会写根目录 `version.json`；客户端在加载/切回前台时比对版本，变化则自动 `reload`（首次只记录，不循环刷新）。
- `index.html` 带有 Cache-Control meta；**GitHub Pages 可能仍忽略 HTTP 缓存头**，版本检测是主要兜底。
