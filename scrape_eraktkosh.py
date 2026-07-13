#!/usr/bin/env python3
"""
eRaktKosh Blood Availability Scraper
=====================================
Scrapes https://eraktkosh.mohfw.gov.in for live blood stock data across all
Indian states and saves aggregated results to backend/data/eraktkosh_stock.json

Usage:
    python scrape_eraktkosh.py            # run once
    python scrape_eraktkosh.py --schedule # run once + every 6 hours

Output: backend/data/eraktkosh_stock.json
"""

import argparse
import json
import logging
import os
import re
import sys
import time
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path

import requests

BASE_URL = "https://eraktkosh.mohfw.gov.in/eraktkoshPortal"
OUTPUT_FILE = Path(__file__).parent / "backend" / "data" / "eraktkosh_stock.json"
SCHEDULE_INTERVAL_HOURS = 6
REQUEST_DELAY = 0.4  # seconds between state requests (be polite)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)s  %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger(__name__)


def make_session() -> requests.Session:
    s = requests.Session()
    s.headers.update({
        "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120",
        "Accept": "application/json",
        "Referer": "https://eraktkosh.mohfw.gov.in/eraktkoshPortal/",
    })
    return s


def fetch_master_data(session: requests.Session) -> dict:
    """Returns statesWithDistricts, bloodGroups, componentList."""
    resp = session.post(
        f"{BASE_URL}/eraktkosh/master/all",
        json={"hospitalCode": 100},
        timeout=30,
    )
    resp.raise_for_status()
    return resp.json()


def fetch_state_availability(session: requests.Session, state_code: str) -> list:
    """Returns all blood bank availability records for a state."""
    resp = session.get(
        f"{BASE_URL}/eraktkosh/blood-availability",
        params={"stateCode": state_code},
        timeout=60,
    )
    resp.raise_for_status()
    return resp.json() or []


def parse_qty_string(qty_str: str) -> dict:
    """
    Parses "A+Ve : 5, B-Ve : 2, O+Ve : 10" → {"A+": 5, "B-": 2, "O+": 10}
    Normalizes blood group names: "A+Ve" → "A+", "Oh+VE" → "O+", etc.
    """
    if not qty_str or not qty_str.strip():
        return {}

    result = {}
    for part in qty_str.split(","):
        part = part.strip()
        m = re.match(r"([A-Za-z+\-Oo]+(?:\+Ve|-Ve|\+VE|-VE|h\+VE|h-VE)?)\s*:\s*(\d+)", part)
        if not m:
            continue
        raw_group, qty = m.group(1).strip(), int(m.group(2))
        if qty == 0:
            continue
        normalized = normalize_blood_group(raw_group)
        if normalized:
            result[normalized] = result.get(normalized, 0) + qty
    return result


def normalize_blood_group(raw: str) -> str:
    """Normalize eRaktKosh blood group labels to standard ABO/Rh notation."""
    mapping = {
        "A+Ve": "A+", "A-Ve": "A-",
        "B+Ve": "B+", "B-Ve": "B-",
        "AB+Ve": "AB+", "AB-Ve": "AB-",
        "O+Ve": "O+", "O-Ve": "O-",
        "Oh+VE": "Oh+", "Oh-VE": "Oh-",  # Bombay blood group
        "A+VE": "A+", "A-VE": "A-",
        "B+VE": "B+", "B-VE": "B-",
        "AB+VE": "AB+", "AB-VE": "AB-",
        "O+VE": "O+", "O-VE": "O-",
    }
    return mapping.get(raw, None)


def scrape_all() -> dict:
    """
    Main scrape: iterates all 36 states, pulls blood availability,
    and returns aggregated structure.
    """
    session = make_session()

    log.info("Fetching master data (states + blood groups)...")
    master = fetch_master_data(session)
    states = master.get("statesWithDistricts", [])
    log.info(f"Found {len(states)} states/UTs")

    # Aggregated results structure:
    # {
    #   "scraped_at": "ISO timestamp",
    #   "states": {
    #     "Karnataka": {
    #       "stateCode": "29",
    #       "total_banks": 291,
    #       "live_banks": 87,
    #       "blood_stock": {
    #         "Packed Red Blood Cells": {"A+": 1250, "B+": 430, ...},
    #         "Fresh Frozen Plasma": {...},
    #         ...
    #       },
    #       "aggregated": {"A+": 2100, "B+": 780, ...},  # across all components
    #       "hospitals": [
    #         {"code": "15042", "name": "...", "district": "...", "live": true,
    #          "updated": "2026-06-12 22:00:00", "blood_stock": {...}}
    #       ]
    #     }
    #   }
    # }

    output = {
        "scraped_at": datetime.now(timezone.utc).isoformat(),
        "source": "eraktkosh.mohfw.gov.in",
        "total_banks_scraped": 0,
        "total_live_banks": 0,
        "states": {},
    }

    for state in states:
        state_code = state["stateCode"]
        state_name = state["stateName"]

        try:
            records = fetch_state_availability(session, state_code)
        except Exception as e:
            log.warning(f"  {state_name}: FAILED — {e}")
            time.sleep(REQUEST_DELAY * 2)
            continue

        state_data = {
            "stateCode": state_code,
            "total_banks": len(records),
            "live_banks": 0,
            "blood_stock": defaultdict(lambda: defaultdict(int)),
            "aggregated": defaultdict(int),
            "hospitals": [],
        }

        for rec in records:
            is_live = rec.get("offline") == "0"
            if is_live:
                state_data["live_banks"] += 1

            hosp_stock: dict[str, dict[str, int]] = {}
            for comp_name, comp_data in (rec.get("components") or {}).items():
                avail = comp_data.get("available_WithQty", "") or ""
                parsed = parse_qty_string(avail)
                if parsed:
                    hosp_stock[comp_name] = parsed
                    for bg, qty in parsed.items():
                        state_data["blood_stock"][comp_name][bg] += qty
                        state_data["aggregated"][bg] += qty

            state_data["hospitals"].append({
                "code": str(rec.get("hospitalCode", "")),
                "name": rec.get("hospitalname", ""),
                "address": rec.get("hospitaladd", ""),
                "live": is_live,
                "updated": rec.get("entrydate", ""),
                "blood_stock": hosp_stock,
            })

        # Convert defaultdicts to plain dicts for JSON serialization
        state_data["blood_stock"] = {
            comp: dict(bg_map)
            for comp, bg_map in state_data["blood_stock"].items()
        }
        state_data["aggregated"] = dict(state_data["aggregated"])

        output["states"][state_name] = state_data
        output["total_banks_scraped"] += len(records)
        output["total_live_banks"] += state_data["live_banks"]

        live_label = f"{state_data['live_banks']} live" if state_data["live_banks"] else "all offline"
        log.info(f"  {state_name}: {len(records)} banks ({live_label})")

        time.sleep(REQUEST_DELAY)

    return output


def save(data: dict, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w") as f:
        json.dump(data, f, indent=2)
    size_kb = path.stat().st_size / 1024
    log.info(f"Saved → {path}  ({size_kb:.1f} KB)")


def run_once() -> None:
    log.info("=== eRaktKosh scraper starting ===")
    start = time.time()
    data = scrape_all()
    elapsed = time.time() - start
    log.info(
        f"Done in {elapsed:.1f}s — "
        f"{data['total_banks_scraped']} banks, "
        f"{data['total_live_banks']} live"
    )
    save(data, OUTPUT_FILE)


def run_scheduled(interval_hours: int = SCHEDULE_INTERVAL_HOURS) -> None:
    """Run immediately, then every interval_hours hours."""
    try:
        from apscheduler.schedulers.blocking import BlockingScheduler
        from apscheduler.triggers.interval import IntervalTrigger
        HAS_APScheduler = True
    except ImportError:
        HAS_APScheduler = False

    if HAS_APScheduler:
        log.info(f"Scheduler: running now + every {interval_hours}h via APScheduler")
        run_once()
        scheduler = BlockingScheduler()
        scheduler.add_job(run_once, IntervalTrigger(hours=interval_hours))
        try:
            scheduler.start()
        except (KeyboardInterrupt, SystemExit):
            log.info("Scheduler stopped.")
    else:
        # Fallback: simple sleep loop (no apscheduler installed)
        log.warning(
            "apscheduler not installed. Using simple sleep loop. "
            "Install with: pip install apscheduler"
        )
        while True:
            run_once()
            next_run = datetime.now(timezone.utc).replace(microsecond=0)
            log.info(f"Next run in {interval_hours}h. Press Ctrl+C to stop.")
            time.sleep(interval_hours * 3600)


def main() -> None:
    parser = argparse.ArgumentParser(description="Scrape eRaktKosh blood availability")
    parser.add_argument(
        "--schedule",
        action="store_true",
        help=f"Run continuously every {SCHEDULE_INTERVAL_HOURS} hours (default: run once)",
    )
    parser.add_argument(
        "--interval",
        type=int,
        default=SCHEDULE_INTERVAL_HOURS,
        metavar="HOURS",
        help=f"Schedule interval in hours (default: {SCHEDULE_INTERVAL_HOURS})",
    )
    default_output = str(Path(__file__).parent / "backend" / "data" / "eraktkosh_stock.json")
    parser.add_argument(
        "--output",
        type=str,
        default=default_output,
        help=f"Output JSON path (default: {default_output})",
    )
    args = parser.parse_args()

    global OUTPUT_FILE
    OUTPUT_FILE = Path(args.output)

    if args.schedule:
        run_scheduled(args.interval)
    else:
        run_once()


if __name__ == "__main__":
    main()
