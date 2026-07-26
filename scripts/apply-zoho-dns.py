#!/usr/bin/env python3
"""Apply Zoho-mail DNS records to the liraintelligence.com Cloudflare zone.

One-shot, idempotent-ish:
  - remove the (dead old-account) SES root MX
  - add Zoho MX (mx/mx2/mx3.zoho.com)
  - add Zoho to the root SPF include list (keep Resend + amazonses)
  - publish the Zoho DKIM record (selector `zmail`)

Reads the Cloudflare API token from the locked session file. Leaves the
reply./send. SES subdomains and all web records untouched.
"""
import json, glob, os, urllib.request, urllib.error

ZONE = "be35455d0d94be7a6121981ee4e0331d"
CB = "https://api.cloudflare.com/client/v4"
NEW_SPF = "v=spf1 include:zohomail.com include:amazonses.com include:_spf.resend.com ~all"
DKIM_SELECTOR = "zmail"
DKIM_VALUE = ("v=DKIM1; k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCAD74WnMBd1UCVIoIv6"
              "DqrezG4uRbV3vPwRLm20wymvLhWctLyzmi2hwpQUhnjtsii14OU9sZ7XvOo9/vPXaLHPorigAjRDvYxwl"
              "AIFcjRRQuAmaY7XSMyJXDDbRjtAgzJzxNPRkehX+33vD3I7io79xu/I7rrpjoIP3zIX1CzhQIDAQAB")

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
root_mx = [r for r in recs if r["type"] == "MX" and r["name"] == "liraintelligence.com"]
root_spf = [r for r in recs if r["type"] == "TXT" and r["name"] == "liraintelligence.com" and "v=spf1" in r["content"]]
assert len(root_spf) == 1 and len(root_mx) >= 1, "unexpected root records — aborting"

print("--- applying ---")
for r in root_mx:
    if "amazon" in r["content"]:
        print("delete SES MX", r["content"], "->", cf("DELETE", f"/zones/{ZONE}/dns_records/{r['id']}").get("success"))
for host, prio in [("mx.zoho.com", 10), ("mx2.zoho.com", 20), ("mx3.zoho.com", 50)]:
    print(f"add MX {host} {prio} ->", cf("POST", f"/zones/{ZONE}/dns_records",
        {"type": "MX", "name": "liraintelligence.com", "content": host, "priority": prio, "ttl": 1}).get("success"))
print("update SPF ->", cf("PUT", f"/zones/{ZONE}/dns_records/{root_spf[0]['id']}",
    {"type": "TXT", "name": "liraintelligence.com", "content": NEW_SPF, "ttl": 1}).get("success"))
dkim_name = f"{DKIM_SELECTOR}._domainkey.liraintelligence.com"
existing = [r for r in recs if r["type"] == "TXT" and r["name"] == dkim_name]
if existing:
    print("update DKIM ->", cf("PUT", f"/zones/{ZONE}/dns_records/{existing[0]['id']}",
        {"type": "TXT", "name": dkim_name, "content": DKIM_VALUE, "ttl": 1}).get("success"))
else:
    print("add DKIM ->", cf("POST", f"/zones/{ZONE}/dns_records",
        {"type": "TXT", "name": dkim_name, "content": DKIM_VALUE, "ttl": 1}).get("success"))

print("\n--- AFTER ---")
recs = cf("GET", f"/zones/{ZONE}/dns_records?per_page=100")["result"]
for r in sorted(recs, key=lambda x: (x["type"], x.get("priority") or 0)):
    if r["type"] == "MX" and r["name"] == "liraintelligence.com":
        print(f"MX  -> {r['content']}  prio={r['priority']}")
for r in recs:
    if r["type"] == "TXT" and ((r["name"] == "liraintelligence.com" and "spf1" in r["content"]) or r["name"] == dkim_name):
        print(f"TXT {r['name']} -> {r['content'][:55]}...")
