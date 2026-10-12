#!/bin/bash
# 导出后运行：把 data/ 推到 GitHub Pages
cd /workspace/dashboard || exit 1
git add data && git -c user.name=harrywu666 -c user.email=harrywu666@users.noreply.github.com commit -qm "data $(date +%F_%H%M)" && git push -q && echo pushed || echo "no change"
