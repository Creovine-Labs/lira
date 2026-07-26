#!/usr/bin/env python3
"""Update the _dmarc TXT record for liraintelligence.com.

Only change: point the aggregate-report address (rua) at a real mailbox
(info@liraintelligence.com) instead of the dead lira@ address. Policy stays
p=none (monitor-only) with relaxed SPF/DKIM alignment. Touches nothing else.
"""
import json, glob, urllib.request, urllib.error

ZONE = "be35455d0d94be7a6121981ee4e0331d"
CB = "https://api.cloudflare.com/client/v4"
NEW_DMARC = "v=DMARC1; p=none; rua=mailto:info@liraintelligence.com; aspf=r; adkim=r"

def _token():
    for p in glob.glob("/private/tmp/claude-*/**/scratchpad/.cf-token", recursive=True):
        return open(p).read().strip()
    raise SystemExit("Cloudflare token file not found")

TOKEN = _token()

def cf(method, path, body=None):
    req = urllib.request.Request(CB + path, method=method,
        headers={"Authorization": "Bearer " + TOKEN, "Content-Type": "application/json"})
    data = json.dumps(body).encode() if body else None
    try:
        with urllib.request.urlopen(req, data) as r:
            return json.load(r)
    except urllib.error.HTTPError as e:
        return json.load(e)

recs = cf("GET", f"/zones/{ZONE}/dns_records?per_page=100")["result"]
dmarc = [r for r in recs if r["type"] == "TXT" and r["name"] == "_dmarc.liraintelligence.com"]
assert len(dmarc) == 1, f"expected exactly one _dmarc record, found {len(dmarc)} — aborting"

print("BEFORE:", dmarc[0]["content"])
res = cf("PUT", f"/zones/{ZONE}/dns_records/{dmarc[0]['id']}",
         {"type": "TXT", "name": "_dmarc.liraintelligence.com", "content": NEW_DMARC, "ttl": 1})
print("update ->", res.get("success"), "" if res.get("success") else res.get("errors"))

after = [r for r in cf("GET", f"/zones/{ZONE}/dns_records?per_page=100")["result"]
         if r["type"] == "TXT" and r["name"] == "_dmarc.liraintelligence.com"]
print("AFTER: ", after[0]["content"] if after else "(missing)")
