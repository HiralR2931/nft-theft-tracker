"""Generate 03_bulk_data.sql: realistic volume data that respects every key and constraint.

The rows build on 02_sample_data.sql, which uses IDs 001-010 in every table, so generated
IDs start at 011. Every foreign key points at a row that exists, dates follow the case
lifecycle (artwork created -> theft reported -> investigation -> resolution), and report
statuses agree with their investigations and resolutions.

Run from the repo root:  python3 database/generate_bulk_data.py
The output is deterministic: the same seed always produces the same file.
"""

import random
from datetime import date, datetime, timedelta
from pathlib import Path

SEED = 42
OUTPUT = Path(__file__).with_name("03_bulk_data.sql")

COUNTS = {
    "artists": 200,
    "artworks": 500,
    "collections": 100,
    "collectors": 200,
    "wallets": 200,
    "investigators": 50,
    "reports": 500,
    "transactions": 500,
    "collection_artworks": 300,
    "ownerships": 300,
}

START = date(2021, 1, 1)
END = date(2025, 6, 30)

NEW_PLATFORMS = [
    ("Objkt", "https://objkt.com"), ("Async Art", "https://async.art"),
    ("KnownOrigin", "https://knownorigin.io"), ("MakersPlace", "https://makersplace.com"),
    ("Mintable", "https://mintable.app"), ("Exchange.Art", "https://exchange.art"),
    ("Tensor", "https://tensor.trade"), ("Element", "https://element.market"),
    ("Manifold", "https://manifold.xyz"), ("Highlight", "https://highlight.xyz"),
]
NETWORKS = ["Ethereum", "Polygon", "Solana", "Avalanche", "Tezos"]
EXPERTISE = [
    "Blockchain Forensics", "Blockchain Analytics", "Copyright Law", "Cybercrime Investigation",
    "Digital Art Authentication", "Digital Forensics", "Intellectual Property",
    "NFT Fraud Investigation", "Smart Contract Security", "Transaction Analysis",
]
THEFT_TYPES = [
    "Artwork copied without permission", "Unauthorized minting detected", "Stolen and resold",
    "Copyright infringement", "Counterfeit NFT", "Fake listing found", "Metadata manipulation",
    "Plagiarism claim", "Wallet drained", "Smart contract exploit", "Identity theft of artist",
]
EVIDENCE_TYPES = [
    "Screenshot", "Transaction Log", "Wallet Trace", "Metadata", "Smart Contract",
    "Image Comparison", "Email", "Legal Document", "Video Recording",
]
# Outcomes per final report status, with the actions that fit each outcome.
OUTCOMES = {
    "Resolved": {
        "Recovered": ["Artwork taken down", "Original reinstated", "Fake NFT removed"],
        "Compensated": ["Artist compensated", "Settlement reached", "Financial recovery"],
    },
    "Closed": {
        "Dismissed": ["No evidence found", "Case dismissed"],
        "Ongoing": ["Legal action filed", "Platform cooperation"],
    },
}
ROLES = ["Assistant", "Consultant", "Forensic Analyst"]

rng = random.Random(SEED)


def ids(prefix, count, start=11, width=3):
    return [f"{prefix}{n:0{width}d}" for n in range(start, start + count)]


def rand_date(lo=START, hi=END):
    return lo + timedelta(days=rng.randint(0, max((hi - lo).days, 0)))


def rand_datetime(lo, hi=END):
    day = rand_date(lo, hi)
    return datetime(day.year, day.month, day.day, rng.randint(0, 23), rng.randint(0, 59), rng.randint(0, 59))


def sql(value):
    if value is None:
        return "NULL"
    if isinstance(value, bool):
        return "TRUE" if value else "FALSE"
    if isinstance(value, (int, float)):
        return str(value)
    if isinstance(value, datetime):
        return f"'{value:%Y-%m-%d %H:%M:%S}'"
    if isinstance(value, date):
        return f"'{value:%Y-%m-%d}'"
    return "'" + str(value).replace("\\", "\\\\").replace("'", "''") + "'"


def insert(table, rows, batch=100):
    lines = [f"-- {table} ({len(rows)} rows)"]
    for i in range(0, len(rows), batch):
        values = ",\n".join("(" + ", ".join(sql(v) for v in row) + ")" for row in rows[i:i + batch])
        lines.append(f"INSERT INTO {table} VALUES\n{values};")
    return "\n".join(lines) + "\n"


def main():
    tables = []

    # Artists and their artworks
    artists = []
    for n, artist_id in enumerate(ids("ART", COUNTS["artists"]), start=11):
        registered = rand_date(START, date(2023, 12, 31))
        status = rng.choices(["Verified", "Pending", "Unverified"], [5, 2, 3])[0]
        artists.append((artist_id, f"Artist_{n}", f"0xArtistWallet{n:04d}abcdef",
                        f"artist{n}@nftmail.com", status, registered))
    tables.append(insert("ARTIST", artists))

    artworks = []
    for n, artwork_id in enumerate(ids("AWK", COUNTS["artworks"]), start=11):
        artist = rng.choice(artists)
        created = rand_date(artist[5], date(2024, 12, 31))
        artworks.append((artwork_id, artist[0], f"NFT_Artwork_{n}", created,
                         f"QmHash{n:06d}abcdefghijklmnop", f"Digital artwork number {n} by {artist[1]}."))
    tables.append(insert("ARTWORK", artworks))

    collections = []
    for n, collection_id in enumerate(ids("COLL", COUNTS["collections"]), start=11):
        artist = rng.choice(artists)
        collections.append((collection_id, artist[0], f"Collection_{n}", f"0xContract{n:06d}abcdef",
                            rng.choice(NETWORKS), rng.randint(10, 10000), rand_date(artist[5])))
    tables.append(insert("NFT_COLLECTION", collections))

    pairs = set()
    while len(pairs) < COUNTS["collection_artworks"]:
        pairs.add((rng.choice(collections)[0], rng.choice(artworks)))
    collection_launch = {c[0]: c[6] for c in collections}
    tables.append(insert("COLLECTION_ARTWORK", [
        (cid, art[0], rand_date(max(art[3], collection_launch[cid])))
        for cid, art in sorted(pairs, key=lambda p: (p[0], p[1][0]))
    ]))

    # Collectors and ownership history
    collectors = []
    for n, collector_id in enumerate(ids("COL", COUNTS["collectors"]), start=11):
        collectors.append((collector_id, f"collector_{n}", f"0xCollectorWallet{n:04d}xyz",
                           f"collector{n}@nftbuyer.com", rand_date(START, date(2023, 12, 31)),
                           round(rng.uniform(0, 100), 1)))
    tables.append(insert("COLLECTOR", collectors))

    ownerships = []
    seen = set()
    while len(ownerships) < COUNTS["ownerships"]:
        collector, artwork = rng.choice(collectors), rng.choice(artworks)
        bought = rand_date(max(collector[4], artwork[3]))
        if (collector[0], artwork[0], bought) in seen:
            continue
        seen.add((collector[0], artwork[0], bought))
        ownerships.append([collector[0], artwork[0], bought, round(rng.uniform(0.05, 50), 4), False])
    # The most recent buyer of each artwork is its current owner.
    latest = {}
    for row in ownerships:
        if row[1] not in latest or row[2] > latest[row[1]][2]:
            latest[row[1]] = row
    for row in latest.values():
        row[4] = True
    tables.append(insert("COLLECTOR_OWNERSHIP", [tuple(r) for r in ownerships]))

    # Platforms: the sample data has PLT001-PLT010
    platforms = [(f"PLT{n:03d}", name, url, rng.choice(["Verified", "Pending", "Unverified"]),
                  f"+1-555-{n:04d}", f"support@{url.split('//')[1]}")
                 for n, (name, url) in enumerate(NEW_PLATFORMS, start=11)]
    tables.append(insert("PLATFORM", platforms))
    platform_ids = [f"PLT{n:03d}" for n in range(1, 11)] + [p[0] for p in platforms]

    # Suspicious wallets and their transactions
    wallets = []
    for n, wallet_id in enumerate(ids("WAL", COUNTS["wallets"]), start=11):
        risk = rng.choices(["Low", "Medium", "High", "Critical"], [3, 3, 2, 2])[0]
        status = {"Critical": ["Blocked", "Monitoring"], "High": ["Active", "Monitoring", "Blocked"],
                  "Medium": ["Active", "Monitoring"], "Low": ["Active", "Monitoring", "Cleared"]}[risk]
        wallets.append([wallet_id, f"0xSuspicious{n:06d}wallet", risk,
                        rand_date(START, date(2024, 6, 30)), None, rng.choice(status)])

    transactions = []
    for n, txn_id in enumerate(ids("TXN", COUNTS["transactions"]), start=11):
        wallet, artwork = rng.choice(wallets), rng.choice(artworks)
        when = rand_datetime(max(wallet[3], artwork[3]))
        counterparty = f"0xCounterparty{n:06d}"
        sender, receiver = (wallet[1], counterparty) if rng.random() < 0.5 else (counterparty, wallet[1])
        block = 14_000_000 + (when.date() - START).days * 7_000 + rng.randint(0, 6_999)
        transactions.append((txn_id, artwork[0], wallet[0], block, sender, receiver,
                             f"0xTxHash{n:06d}abcdef", when, round(rng.uniform(0.01, 250), 8)))
        wallet[4] = max(wallet[4] or when.date(), when.date())
    tables.append(insert("SUSPICIOUS_WALLET", [tuple(w) for w in wallets]))
    tables.append(insert("TRANSACTION", transactions))

    # Investigators
    investigators = []
    for n, investigator_id in enumerate(ids("INV", COUNTS["investigators"]), start=11):
        investigators.append((investigator_id, f"Investigator_{n}", f"BADGE{n:03d}",
                              f"inv{n}@agency.com", rng.choice(EXPERTISE), rand_date(START, date(2022, 12, 31))))
    tables.append(insert("INVESTIGATOR", investigators))

    # Theft reports and their full lifecycle
    reports, platform_reports, investigations, assignments, evidence, resolutions = [], [], [], [], [], []
    evidence_n = 11
    for n, report_id in enumerate(ids("RPT", COUNTS["reports"]), start=11):
        artwork = rng.choice(artworks)
        reported = rand_datetime(artwork[3] + timedelta(days=1), date(2025, 3, 31))
        status = rng.choice(["Open", "Under Investigation", "Resolved", "Closed"])
        platform = rng.choice(platform_ids)
        reports.append((report_id, artwork[0], artwork[1], platform, reported, status,
                        rng.choice(THEFT_TYPES), f"https://fake-site.com/stolen{n}"))
        platform_reports.append((platform, report_id, reported.date()))
        if status == "Open":
            continue

        investigation_id = f"INVS{n:03d}"
        started = reported.date() + timedelta(days=rng.randint(0, 14))
        finished = status in ("Resolved", "Closed")
        ended = started + timedelta(days=rng.randint(7, 120)) if finished else None
        investigations.append((
            investigation_id, report_id, started, ended,
            rng.choices(["Low", "Medium", "High", "Critical"], [2, 4, 3, 1])[0],
            "Completed" if finished else rng.choices(["Active", "Pending", "Suspended"], [6, 3, 1])[0],
            f"Investigation notes for {report_id}.",
        ))

        team = rng.sample(investigators, rng.randint(1, 3))
        for i, investigator in enumerate(team):
            role = "Lead" if i == 0 else rng.choice(ROLES)
            assignments.append((investigation_id, investigator[0],
                                max(started, investigator[5]), role))

        for _ in range(rng.randint(0, 2)):
            evidence.append((f"EV{evidence_n:03d}", investigation_id, rng.choice(EVIDENCE_TYPES),
                             f"0xEvidenceHash{evidence_n:06d}abcdef",
                             rand_datetime(started, ended or END),
                             f"Evidence collected for {report_id}.",
                             f"https://evidence-store.com/file{evidence_n}"))
            evidence_n += 1

        if finished:
            outcome = rng.choice(list(OUTCOMES[status]))
            resolutions.append((f"RES{n:03d}", report_id, team[0][0], ended, outcome,
                                rng.choice(OUTCOMES[status][outcome]), f"Resolution notes for {report_id}."))

    tables += [
        insert("THEFT_REPORT", reports),
        insert("PLATFORM_REPORTS", platform_reports),
        insert("INVESTIGATION", investigations),
        insert("INVESTIGATION_ASSIGNMENT", assignments),
        insert("EVIDENCE", evidence),
        insert("RESOLUTION", resolutions),
    ]

    header = (
        "-- Bulk data generated by database/generate_bulk_data.py. Do not edit by hand.\n"
        "-- Load after 01_schema.sql and 02_sample_data.sql. Foreign-key checks stay on,\n"
        "-- so any broken reference fails the load instead of slipping in silently.\n"
        "USE NFT_Theft_Database;\n\n"
    )
    OUTPUT.write_text(header + "\n".join(tables))
    print(f"Wrote {OUTPUT.name}: {sum(t.count(chr(10) + '(') for t in tables)} rows")


if __name__ == "__main__":
    main()
