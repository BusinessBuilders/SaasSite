#!/usr/bin/env python3
"""Create or refresh the Stripe products, prices and Payment Links for every
offer in src/utils/offers.json, on the BUSINESS BUILDER Stripe account.

This file is NOT run on this machine directly: scripts/stripe-offers.sh ships
it to the BB VPS over SSH (that is the only place the live key exists), runs
it there, and writes the resulting links back into offers.json. It uses only
the Python standard library so the VPS needs nothing installed.

Idempotent. Run it twice and the second run changes nothing:
  - product  : found by metadata bb_offer=<slug>, else created
  - prices   : found by lookup_key bb-<slug>-setup / bb-<slug>-monthly; if the
               amount on the sheet changed, a new price is created, the lookup
               key moves to it, and the old price is archived
  - link     : found by metadata bb_offer=<slug> among active Payment Links; if
               its prices no longer match, it is deactivated and a new one made

Any Stripe error stops the run with the message. Nothing is retried quietly.

Inputs (environment):
  ENVFILE      path of the env file holding STRIPE_SECRET_KEY=sk_live_…
  OFFERS_JSON  the {"groups": [...], "offers": [...]} document as a JSON string
Output: one JSON object on stdout, {slug: {product, setupPrice, monthlyPrice,
  paymentLinkId, paymentLink}}. Everything else goes to stderr.
"""
import base64
import json
import os
import re
import sys
import urllib.error
import urllib.parse
import urllib.request

API = "https://api.stripe.com/v1"

# The monthly plan bills from the day of purchase, alongside the one-time
# build. A deferred first charge was tested (subscription_data trial_period_days)
# and rejected: Stripe then labels the page "Try <offer>", "30 days free" and
# "Pay and start trial", which is the banned word and calls a build period a
# free trial. Do not reintroduce it.


def log(msg):
    print(msg, file=sys.stderr, flush=True)


def read_key(envfile):
    key = None
    with open(envfile, encoding="utf-8") as fh:
        for line in fh:
            m = re.match(r'^STRIPE_SECRET_KEY=["\']?(sk_[A-Za-z0-9_]+)', line.strip())
            if m:
                key = m.group(1)
    if not key:
        sys.exit(f"no STRIPE_SECRET_KEY=sk_… line in {envfile}")
    return key


class Stripe:
    def __init__(self, key):
        self.auth = "Basic " + base64.b64encode(f"{key}:".encode()).decode()

    def call(self, method, path, params=None):
        params = params or {}
        if method == "GET":
            url = f"{API}/{path}" + ("?" + urllib.parse.urlencode(params, doseq=True) if params else "")
            data = None
        else:
            url = f"{API}/{path}"
            data = urllib.parse.urlencode(params, doseq=True).encode()
        req = urllib.request.Request(url, data=data, method=method)
        req.add_header("Authorization", self.auth)
        try:
            with urllib.request.urlopen(req, timeout=60) as resp:
                return json.load(resp)
        except urllib.error.HTTPError as err:
            body = err.read().decode(errors="replace")
            try:
                message = json.loads(body)["error"]["message"]
            except Exception:
                message = body[:500]
            sys.exit(f"Stripe {method} {path} failed ({err.code}): {message}")

    def get(self, path, **params):
        return self.call("GET", path, params)

    def post(self, path, **params):
        return self.call("POST", path, params)


def list_all(stripe, path, **params):
    """Every object from a paginated list endpoint (list endpoints are read-
    your-writes consistent; the /search endpoints lag by up to a minute and
    once created a duplicate product here, so they are not used)."""
    out = []
    starting_after = None
    while True:
        page_params = dict(params, limit=100)
        if starting_after:
            page_params["starting_after"] = starting_after
        page = stripe.get(path, **page_params)
        out.extend(page["data"])
        if not page["has_more"]:
            return out
        starting_after = page["data"][-1]["id"]


def ensure_product(stripe, offer, all_products):
    matches = [p for p in all_products if (p.get("metadata") or {}).get("bb_offer") == offer["slug"]]
    description = ". ".join([offer["tagline"], *offer["inclusions"]]) + "."
    if len(matches) > 1:
        # Keep the oldest, archive the rest so the catalog has one product per offer.
        matches.sort(key=lambda p: p["created"])
        for dup in matches[1:]:
            stripe.post(f"products/{dup['id']}", active="false")
            log(f"  product dup      {dup['id']} archived")
    if matches:
        product = matches[0]
        if product["name"] != offer["name"] or (product.get("description") or "") != description or not product["active"]:
            product = stripe.post(f"products/{product['id']}", name=offer["name"], description=description, active="true")
            log(f"  product updated  {product['id']}")
        else:
            log(f"  product ok       {product['id']}")
        return product
    product = stripe.post(
        "products",
        name=offer["name"],
        description=description,
        **{"metadata[bb_offer]": offer["slug"], "metadata[bb_group]": offer["group"]},
    )
    log(f"  product created  {product['id']}")
    return product


def ensure_price(stripe, product, offer, kind, dollars):
    """kind = 'setup' (one-time) or 'monthly' (recurring)."""
    lookup_key = f"bb-{offer['slug']}-{kind}"
    unit_amount = int(dollars) * 100
    nickname = f"{offer['name']}: " + ("one-time build" if kind == "setup" else "monthly care")
    existing = stripe.get("prices", **{"lookup_keys[]": lookup_key, "limit": 1})
    if existing["data"]:
        price = existing["data"][0]
        same_amount = price["unit_amount"] == unit_amount and price["currency"] == "usd"
        same_kind = (price.get("recurring") is not None) == (kind == "monthly")
        if same_amount and same_kind and price["active"] and price["product"] == product["id"]:
            log(f"  price ok         {lookup_key} {price['id']}")
            return price
        log(f"  price changed    {lookup_key}: {price['unit_amount']/100:.0f} -> {dollars}; archiving {price['id']}")
        old_id = price["id"]
    else:
        old_id = None
    params = {
        "product": product["id"],
        "currency": "usd",
        "unit_amount": unit_amount,
        "nickname": nickname,
        "lookup_key": lookup_key,
        "transfer_lookup_key": "true",
        "metadata[bb_offer]": offer["slug"],
        "metadata[bb_kind]": kind,
    }
    if kind == "monthly":
        params["recurring[interval]"] = "month"
    price = stripe.post("prices", **params)
    log(f"  price created    {lookup_key} {price['id']}")
    if old_id:
        stripe.post(f"prices/{old_id}", active="false")
    return price


def archive_stray_prices(stripe, product, keep_ids):
    """Any active price on one of OUR products that is not the current setup or
    monthly price is a leftover from an earlier run; archive it so the Stripe
    catalog shows exactly what the website sells."""
    for price in list_all(stripe, "prices", product=product["id"], active="true"):
        if price["id"] not in keep_ids:
            stripe.post(f"prices/{price['id']}", active="false")
            log(f"  price stray      {price['id']} archived")


def find_payment_link(stripe, slug):
    starting_after = None
    while True:
        params = {"active": "true", "limit": 100}
        if starting_after:
            params["starting_after"] = starting_after
        page = stripe.get("payment_links", **params)
        for link in page["data"]:
            if (link.get("metadata") or {}).get("bb_offer") == slug:
                return link
        if not page["has_more"]:
            return None
        starting_after = page["data"][-1]["id"]


def link_price_ids(stripe, link):
    items = stripe.get(f"payment_links/{link['id']}/line_items", limit=10)
    return sorted(item["price"]["id"] for item in items["data"])


def ensure_payment_link(stripe, offer, group, setup_price, monthly_price):
    wanted = sorted(p["id"] for p in [setup_price, monthly_price] if p)
    existing = find_payment_link(stripe, offer["slug"])
    if existing:
        no_trial = not (existing.get("subscription_data") or {}).get("trial_period_days")
        if link_price_ids(stripe, existing) == wanted and no_trial:
            log(f"  link ok          {existing['id']} {existing['url']}")
            return existing
        log(f"  link outdated    {existing['id']}; deactivating")
        stripe.post(f"payment_links/{existing['id']}", active="false")

    params = {
        "line_items[0][price]": monthly_price["id"],
        "line_items[0][quantity]": 1,
        "phone_number_collection[enabled]": "true",
        "after_completion[type]": "hosted_confirmation",
        "after_completion[hosted_confirmation][custom_message]": group["confirmation"],
        "metadata[bb_offer]": offer["slug"],
        "metadata[bb_source]": "website",
        "subscription_data[metadata][bb_offer]": offer["slug"],
        "subscription_data[metadata][bb_source]": "website",
    }
    if setup_price:
        params["line_items[1][price]"] = setup_price["id"]
        params["line_items[1][quantity]"] = 1
        params["subscription_data[description]"] = f"{offer['name']}: monthly care, ${offer['monthly']:,}/month"
        params["custom_text[submit][message]"] = (
            f"Today you pay the one-time build of ${offer['setup']:,} plus the first month of care, "
            f"${offer['monthly']:,}. Care then bills ${offer['monthly']:,} a month."
        )
    else:
        params["subscription_data[description]"] = f"{offer['name']}: ${offer['monthly']:,}/month"
        params["custom_text[submit][message]"] = (
            f"Billed ${offer['monthly']:,} a month from today, per calendar month."
        )
    link = stripe.post("payment_links", **params)
    log(f"  link created     {link['id']} {link['url']}")
    return link


def main():
    envfile = os.environ.get("ENVFILE") or sys.exit("ENVFILE not set")
    raw = os.environ.get("OFFERS_JSON") or sys.exit("OFFERS_JSON not set")
    doc = json.loads(raw)
    groups = {g["id"]: g for g in doc["groups"]}
    stripe = Stripe(read_key(envfile))

    account = stripe.get("account")
    log(f"Stripe account {account['id']} ({account.get('settings', {}).get('dashboard', {}).get('display_name')})")
    if account["id"] != "acct_1TBfLr5tpUECPmtu":
        sys.exit("refusing: this is not the Business Builder Stripe account")

    all_products = list_all(stripe, "products", active="true")
    result = {}
    for offer in doc["offers"]:
        log(f"{offer['slug']}")
        product = ensure_product(stripe, offer, all_products)
        setup_price = ensure_price(stripe, product, offer, "setup", offer["setup"]) if offer["setup"] else None
        monthly_price = ensure_price(stripe, product, offer, "monthly", offer["monthly"])
        archive_stray_prices(stripe, product, {p["id"] for p in [setup_price, monthly_price] if p})
        link = ensure_payment_link(stripe, offer, groups[offer["group"]], setup_price, monthly_price)
        result[offer["slug"]] = {
            "product": product["id"],
            "setupPrice": setup_price["id"] if setup_price else None,
            "monthlyPrice": monthly_price["id"],
            "paymentLinkId": link["id"],
            "paymentLink": link["url"],
        }
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
