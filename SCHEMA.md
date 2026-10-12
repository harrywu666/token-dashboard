# 看板数据约定
data/tokens.json: [{"id":"hotbot","name":"$HOTBOT","chain":"solana","group":"$HotBot调查小组"}]
data/<id>/periods.json: 按时间升序的数组，每期一条:
{
 "ts":"2026-10-12T21:23+08:00",
 "conclusion":["..."],                 // 结论要点
 "metrics":{ "<key>":{"value":5935,"source":"GMGN","fetched_at":"...","cached":false} },
   // 常用 key: holders, mcap_usd, liq_usd, top20_pct, followers, buys_1h, sells_1h, traders_1h, burns_24h, platform_eth
 "top20":[{"addr":"...","pct":3.1,"change":"add|reduce|exit|new|hold","delta_pct":0.2,"link":"https://gmgn.ai/..."}],
 "report_text":"群里发的原文"
}


> 实际数据以分析师 export.py 产出的 issues.json/latest.json 为准；页面在 index.html 内做字段适配。
