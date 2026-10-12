#!/usr/bin/env python3
"""Rebuild /workspace/dashboard/data from /workspace/hotbot and /workspace/torch. Idempotent; never guesses: missing => null."""
import json, re, glob, os
from datetime import datetime, timezone, timedelta
TZ = timezone(timedelta(hours=8)); W = "/workspace"; OUT = f"{W}/dashboard/data"
def L(p):
    try: return json.load(open(p))
    except Exception: return None
def iso(dt): return dt.astimezone(TZ).isoformat(timespec="minutes")
def ts_from_name(p):
    m = re.search(r"(\d{8})_(\d{4,6})", os.path.basename(p)); s = m.group(1)+m.group(2)
    return datetime.strptime(s[:12], "%Y%m%d%H%M").replace(tzinfo=TZ)
def parse_ts(s):
    if not s: return None
    s = re.sub(r"([+-]\d{2})(\d{2})$", r"\1:\2", s)
    try: return datetime.fromisoformat(s).astimezone(TZ)
    except Exception: return None
def short(a): return f"{a[:4]}…{a[-4:]}"
def num(x):
    try: return float(x)
    except Exception: return None
def nearest(items, dt, max_min=30):
    best = None
    for t, v in items:
        d = abs((t - dt).total_seconds())/60
        if d <= max_min and (best is None or d < best[0]): best = (d, t, v)
    return best

def diff_top20(issues):
    prev = None
    for it in issues:
        cur = {r["addr"]: r for r in it["top20"]}
        if prev is None:
            for r in it["top20"]: r["change"], r["delta_pct"] = None, None
        else:
            for r in it["top20"]:
                p = prev.get(r["addr"])
                if p is None: r["change"], r["delta_pct"] = "new", None
                else:
                    d = round(r["pct"] - p["pct"], 4); r["delta_pct"] = d
                    r["change"] = "added" if d > 0.0005 else "reduced" if d < -0.0005 else "same"
            for a, p in prev.items():
                if a not in cur:
                    it["top20"].append({"addr": a, "short": short(a), "pct": None, "change": "exited", "delta_pct": None, "prev_pct": p["pct"]})
        prev = {r["addr"]: r for r in it["top20"] if r["change"] != "exited"}
    p = None
    for it in issues:
        it["holders_delta"] = (it["holders"] - p) if (p is not None and it["holders"] is not None) else None
        if it["holders"] is not None: p = it["holders"]

def empty_x(handles):
    return {"followers": {h: None for h in handles}, "mentions_1h": None, "latest_post": None, "cached_from": None}

def x_cache(handles, dt):
    c = L(f"{W}/hotbot/x_cache.json")  # written by x_cache.py put; absent until first successful X pull
    x = empty_x(handles)
    if isinstance(c, dict):
        for h in handles:
            v = c.get(h) or c.get(h.lstrip("@"))
            if isinstance(v, dict) and "value" in v: x["followers"][h] = v["value"]; x["cached_from"] = v.get("ts")
            elif isinstance(v, (int, float)): x["followers"][h] = v
    return x

def hotbot():
    H = ["usehotbot", "elijahintek", "0xWhoismax", "clawpumptech"]
    snaps = sorted(glob.glob(f"{W}/hotbot/snapshots/top20_human_2*.json"))
    heat = L(f"{W}/hotbot/heat_latest.json"); heat_t = parse_ts(heat.get("ts")) if heat else None
    issues = []
    for p in snaps:
        d = L(p); dt = parse_ts(d.get("ts")) or ts_from_name(p); f = iso(dt)
        info = L(p.replace("top20_human_", "info_"))
        holders = (info or {}).get("holder_count", d.get("holder_count_ref"))
        liq = num((info or {}).get("liquidity")) if info else d.get("liq_ref_usd")
        mcap = d.get("mcap_ref_usd")
        if info and num((info.get("price") or {}).get("price")) and num(info.get("circulating_supply")):
            mcap = round(num(info["price"]["price"]) * num(info["circulating_supply"]))
        top = [{"addr": r["address"], "short": short(r["address"]), "pct": round(r["amount_percentage"]*100, 4)} for r in d["top20_human"]]
        issues.append({"ts": f, "holders": holders, "holders_delta": None, "mcap_usd": mcap,
            "liquidity_usd": round(liq, 2) if liq is not None else None, "top20": top,
            "top20_total_pct": round(sum(r["pct"] for r in top), 4),
            "excluded": [{"addr": e["address"], "reason": e["reason"]} for e in d.get("skipped_non_human", [])],
            "onchain_heat": None, "x": empty_x(H), "conclusion": [],
            "sources": {k: {"source": "GMGN", "fetched_at": f} for k in ["holders", "mcap_usd", "liquidity_usd", "top20"]}})
    if heat and heat_t and issues:
        # heat run attaches to the latest issue at/before it
        tgt = [i for i in issues if parse_ts(i["ts"]) <= heat_t] or issues
        it = tgt[-1]
        it["onchain_heat"] = {"buys": heat.get("buys"), "sells": heat.get("sells"), "unique_wallets": heat.get("unique_traders"),
            "net_flow": heat.get("net_token_flow"), "first_time_buyers": heat.get("first_seen_buyers"), "window_hours": heat.get("window_hours")}
        it["sources"]["onchain_heat"] = {"source": "Helius", "fetched_at": iso(heat_t)}
    if issues:
        issues[-1]["x"] = x_cache(H, None)
    diff_top20(issues); return issues

def torch():
    cfg = L(f"{W}/torch/config.json") or {}
    H = [cfg.get("x_official", "Torchpaddotfun")]
    snaps = sorted(p for p in glob.glob(f"{W}/torch/snapshots/top20_human_2*.json") if "refiltered" not in p)
    vols = [(ts_from_name(p), L(p)) for p in glob.glob(f"{W}/torch/volume_2*.json")]
    vols = [(t, v) for t, v in vols if v and v.get("approx_hours") == 1.0]
    b24 = L(f"{W}/torch/burns24.json"); b24_t = datetime.fromtimestamp(b24["head_ts"], TZ) if b24 and b24.get("head_ts") else None
    excl_reason = {a.lower(): k for k, a in cfg.items() if isinstance(a, str) and a.startswith("0x")}
    for a in cfg.get("burn_executors", []): excl_reason[a.lower()] = "burn_executor"
    issues = []
    for p in snaps:
        dt = ts_from_name(p); f = iso(dt)
        rf = p.replace(".json", "_refiltered.json"); d = L(rf) if os.path.exists(rf) else L(p)
        raw = L(p)
        info = L(p.replace("top20_human_", "info_")) or {}
        price = num((info.get("price") or {}).get("price")); sup = num(info.get("circulating_supply"))
        top = [{"addr": r["address"], "short": short(r["address"]), "pct": round(r["pct"], 4)} for r in d["top20_human"]]
        exc = []
        for e in raw.get("excluded", []):
            if isinstance(e, dict): exc.append({"addr": e["address"], "reason": e["reason"]})
            else:
                a = e[0]; exc.append({"addr": a, "reason": "dead/burn" if a.lower().endswith("dead") else "pool (uniswap_v4)"})
        for a, k in excl_reason.items():
            if k in ("token", "factory"): continue
            if not any(x["addr"].lower() == a for x in exc): exc.append({"addr": a, "reason": f"project/{k} (config exclude list)"})
        src = {k: {"source": "GMGN", "fetched_at": f} for k in ["holders", "mcap_usd", "liquidity_usd", "top20"]}
        src["top20_filter"] = {"source": "RPC", "fetched_at": f}
        it = {"ts": f, "holders": info.get("holder_count"), "holders_delta": None,
            "mcap_usd": round(price*sup) if price and sup else None,
            "liquidity_usd": round(num(info.get("liquidity")), 2) if num(info.get("liquidity")) else None,
            "top20": top, "top20_total_pct": round(sum(r["pct"] for r in top), 4), "excluded": exc,
            "onchain_heat": None, "burns": None, "platform_volume": None, "x": empty_x(H), "conclusion": [], "sources": src}
        v = nearest(vols, dt)
        if v:
            lp = v[2]["launchpad"]
            it["platform_volume"] = {"window_hours": v[2]["approx_hours"], "new_launches": lp.get("new_launches"),
                "settled_events": lp.get("settled_events"), "settled_eth_out": lp.get("settled_eth_out"),
                "treasury_torch": (v[2].get("balances") or {}).get("treasury_torch"), "lower_bound": True}
            src["platform_volume"] = {"source": "RPC", "fetched_at": iso(v[1])}
        if b24_t and nearest([(ts_from_name(q), q) for q in snaps], b24_t) and nearest([(ts_from_name(q), q) for q in snaps], b24_t)[2] == p:
            it["burns"] = {"window_hours": b24["hours"], "count": b24["burn_txs"], "amount": round(b24["burned"], 2), "last_1h": None}
            src["burns"] = {"source": "RPC", "fetched_at": iso(b24_t)}
        issues.append(it)
    diff_top20(issues); return issues

def main():
    hb = L(f"{W}/hotbot/snapshots/info_20261012_2123.json") or {}
    cfg = L(f"{W}/torch/config.json") or {}
    tokens = [
        {"id": "hotbot", "name": "Hot Bot ($HOTBOT)", "chain": "solana", "ca": hb.get("address", "8nnaeWCw8mUypcGAgbmSuzAT85uWx4UN12adDrMhXrGF"),
         "group_name": "$HotBot调查小组", "x_accounts": ["usehotbot", "elijahintek", "0xWhoismax", "clawpumptech"]},
        {"id": "torch", "name": "Torch ($TORCH)", "chain": "robinhood (chainId 4663)", "ca": cfg.get("token"),
         "group_name": "$TORCH调查小组", "x_accounts": [cfg.get("x_official", "Torchpaddotfun")]}]
    os.makedirs(OUT, exist_ok=True)
    def W_(p, o):
        tmp = p + ".tmp"; json.dump(o, open(tmp, "w"), ensure_ascii=False, indent=2); os.replace(tmp, p)
    W_(f"{OUT}/tokens.json", tokens)
    for tid, fn in [("hotbot", hotbot), ("torch", torch)]:
        os.makedirs(f"{OUT}/{tid}", exist_ok=True); iss = fn()
        W_(f"{OUT}/{tid}/issues.json", iss); W_(f"{OUT}/{tid}/latest.json", iss[-1] if iss else None)
        print(tid, len(iss), "issues")
main()
