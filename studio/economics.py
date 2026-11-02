#!/usr/bin/env python3
"""
economics.py -- AFTER HOURS Arcade Studio: production / unit-economics calculator.

Standard library only (json, csv, argparse, math, pathlib, sys). Reads economics.json
(same directory) as the numeric source of truth, computes per-scenario unit economics,
writes economics.csv, and supports an ad-hoc price / direct-cost-stress sensitivity query.

WHAT THIS DOES NOT DO: it does not fetch prices, does not call any network service, and
does not invent numbers not present in economics.json. Every computed field is traceable
to an input field in that file. Read production-plan.md for the narrative interpretation
and go/no-go recommendation; this file only computes.

---- Cost-recovery model (read this before trusting any number below) ----

Two DISTINCT per-unit margin figures are reported for every for-sale scenario, and they
are NEVER summed or substituted for one another:

1. marginalContributionMarginUsd -- price minus variable/direct unit costs (material,
   labor, packaging, freight) minus variable selling costs (channel fee, warranty/damage
   reserve, CAC). It deliberately EXCLUDES one-time NRE/tooling. This is the only figure
   used for breakevenUnits.

2. batchFullyLoadedMarginUsd -- marginalContributionMarginUsd minus nrePerUnitUsd (this
   scenario's own STANDALONE tooling cost spread over its own volumeUnits -- see below).
   This answers "if this exact batch sells completely at this price, what did each unit
   actually net after paying for its own tooling." It is a batch-P&L number, not full
   business profit: annual operating overhead (e.g. insurance) is still not in it -- see
   launchLiquidityRequiredUsd below.

---- STANDALONE NRE framing (every batch/job scenario, corrected) ----

batch_10/batch_50/batch_100/donor_integration_job's nreTotalUsd each represent the FULL
tooling investment that scenario would need if it were run as the first-ever commercial
launch, standing completely alone -- NOT an incremental "reuses the prior batch's jigs"
figure. This keeps batch sizes and the donor job comparable on an apples-to-apples basis
for breakevenUnits/nrePerUnitUsd/batchFullyLoadedMarginUsd. A real sequential rollout
(10-then-50-then-100) pays full tooling only once; see each later scenario's
incrementalNreIfSequentialUsd (donor job: amortizedShareIfTenJobsPerYearUsd) and
sequential_rollout_tooling_usd() below for that alternative -- NEITHER figure feeds
compute_scenario's own math, and both are informational only.

breakevenUnits = ceil((scenario's own standalone NRE total + oneTimeLaunchCostsUsd pool)
  / marginalContributionMarginUsd) -- rounded UP to a whole sellable unit, never a
  fractional unit. A "standalone launch" framing: each scenario is evaluated as if it
  were the first and only commercial batch. oneTimeLaunchCostsUsd is the TRUE one-time
  pool (business registration, website, compliance filing) -- it deliberately EXCLUDES
  firstYearOperatingFixedCostsUsd (e.g. annual liability insurance), because a cost that
  recurs every year is not "paid back once" by a single batch selling out.

---- Cash: launch liquidity, not "cash at risk" ----

cashOutlayExclLaborUsd/cashOutlayInclLaborUsd are the scenario's OWN batch cash only
(material+packaging+freight+NRE, plus labor if NOT owner sweat equity).

launchLiquidityRequiredUsd is a CONSERVATIVE FLOOR on the cash the owner must be able to
deploy for this scenario, assuming ZERO customer deposits have landed yet: it sums
oneTimeLaunchCostsUsd (one-time) + firstYearOperatingFixedCostsUsd (annual, first-year
estimate) + this scenario's own batch cash (cashOutlay*, labor included only when not
owner sweat equity) + CAC*volumeUnits (acquisition cash) + channelFee*volumeUnits
(payment-processing cash) + warranty/damage reserve*volumeUnits (a stated reserve that
must be held back, not spent as profit). It is a total-exposure FLOOR, not a dated
week-by-week cash-flow timeline -- treat it as "cash that must exist," not a schedule.

customerDepositCashInUsd is the gross 50% deposit IF every unit in the scenario sells.
refundableDepositLiabilityUsd is the SAME dollar figure, shown under its own name on
purpose: a collected deposit is a refundable customer liability until the unit ships, not
already-earned revenue or owner equity -- do not read it as "safe" cash.

fundingGapIfDepositsCollectedUsd = max(0, launchLiquidityRequiredUsd -
customerDepositCashInUsd) is an OPTIMISTIC funding-gap calculation that assumes every
deposit has already landed BEFORE any of launchLiquidityRequiredUsd's cash must be spent
-- real deposit timing lags real spending (tooling/insurance/registration are typically
paid before most orders close). A funding gap of $0 or less here is NOT a "zero risk" or
"self-funding" claim: deposits remain refundable liabilities, and CAC/fees/reserve/launch
costs must still be funded as real cash even when the arithmetic nets to zero on paper.

---- Price / stress validation ----

price (if given) must be a finite number > 0 -- price=0 would divide by zero computing the
margin percentage, and negative/nonfinite (NaN/inf) prices are rejected outright rather
than silently producing nonsensical economics. direct_cost_stress_pct must be a finite
number >= 0 for the same reason. Both compute_scenario() and
breakeven_price_for_target_margin() raise ValueError on invalid input; the CLI reports it
as a usage error, not a raw traceback.

Cost stress (direct_cost_stress_pct) affects ONLY material + labor + packaging + freight
(the literal direct/variable production-cost stack) in both the Python here and the
documented equations above -- never NRE, channel fee, warranty/damage reserve, or CAC.

Unknown/unquoted costs (e.g. licensed_turnkey's game_license_royalty_fee) stay None and
BLOCK the scenario (see cost_lines_total) -- they are never silently treated as $0.
"""
from __future__ import annotations

import argparse
import csv
import json
import math
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
DEFAULT_JSON = HERE / "economics.json"
DEFAULT_CSV = HERE / "economics.csv"


def load_data(path: Path = DEFAULT_JSON) -> dict:
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def _mid(low, high):
    if low is None or high is None:
        return None
    return (low + high) / 2.0


def cost_lines_total(lines: list[dict]) -> tuple[float | None, float | None, float | None]:
    """Sum a list of {lowUsd, highUsd} line items. Returns (low, high, mid).
    If any line has an unresolved (None) cost, the whole sum is None/None/None and the
    caller MUST treat the scenario as blocked -- this is how game_license_royalty_fee
    propagates instead of being silently treated as $0."""
    low = high = 0.0
    for line in lines:
        l, h = line.get("lowUsd"), line.get("highUsd")
        if l is None or h is None:
            return None, None, None
        low += l
        high += h
    return low, high, _mid(low, high)


def resolve_material_lines(data: dict, ref: str) -> list[dict]:
    parts = ref.split("+")
    lines: list[dict] = []
    for part in parts:
        lines.extend(data[part])
    return lines


def labor_cost_usd(scenario: dict) -> float:
    return sum(item["hours"] * item["rateUsdPerHr"] for item in scenario["laborBreakdown"])


def labor_hours_total(scenario: dict) -> float:
    return sum(item["hours"] for item in scenario["laborBreakdown"])


def lead_time_days(data: dict, scenario: dict) -> int:
    cap = data["sharedAssumptions"]["productionCapacity"]
    total_hours = labor_hours_total(scenario) * scenario["volumeUnits"]
    weeks = math.ceil(total_hours / cap["weeklyCapacityHours"]) if total_hours > 0 else 0
    return cap["procurementLeadDays"] + weeks * 7


def one_time_launch_costs_total(data: dict) -> tuple[float, float, float]:
    """TRUE one-time business-setup costs (registration, website, compliance filing) --
    the pool breakevenUnits uses. Does NOT include firstYearOperatingFixedCostsUsd (e.g.
    annual liability insurance), which recurs every year and is not 'paid back once'."""
    return cost_lines_total(data["oneTimeLaunchCostsUsd"])


def first_year_operating_fixed_costs_total(data: dict) -> tuple[float, float, float]:
    """Recurring annual operating costs (e.g. liability insurance), shown at their
    first-year estimate. Included in launchLiquidityRequiredUsd, excluded from the
    one-time breakevenUnits pool."""
    return cost_lines_total(data["firstYearOperatingFixedCostsUsd"])


def find_scenario(data: dict, scenario_id: str) -> dict:
    for s in data["scenarios"]:
        if s["id"] == scenario_id:
            return s
    raise KeyError(f"No scenario '{scenario_id}' in economics.json. Known ids: "
                    f"{[s['id'] for s in data['scenarios']]}")


def _validate_price(price: float | None) -> None:
    """price=0 would divide by zero computing a margin percentage; negative or
    non-finite (NaN/inf) prices are rejected outright rather than silently producing
    nonsensical economics. None (no override / not for sale) is always allowed."""
    if price is not None and (not math.isfinite(price) or price <= 0):
        raise ValueError(f"price must be a finite positive number; got {price!r}")


def _validate_stress(direct_cost_stress_pct: float) -> None:
    """A negative or non-finite stress fraction produces nonsensical (or negative) costs;
    reject it rather than compute garbage."""
    if not math.isfinite(direct_cost_stress_pct) or direct_cost_stress_pct < 0:
        raise ValueError(
            f"direct_cost_stress_pct must be a finite number >= 0; got {direct_cost_stress_pct!r}")


def compute_scenario(data: dict, scenario_id: str, price: float | None = None,
                      direct_cost_stress_pct: float = 0.0) -> dict:
    """Compute the full metric set for one scenario.

    price: override the scenario's targetPriceUsd (for sensitivity queries). If the
        scenario is not for sale and no override is given, margin fields are None.
    direct_cost_stress_pct: multiplies ONLY material + labor + packaging + freight
        (the literal direct/variable production-cost stack). Does not touch NRE,
        channel fee, warranty/damage reserve, or CAC -- matches "direct-cost stress"
        literally, per parent's requested semantics.

    Raises ValueError if price or direct_cost_stress_pct is negative/non-finite, or if
    price == 0 (see _validate_price/_validate_stress).
    """
    _validate_stress(direct_cost_stress_pct)
    _validate_price(price)

    sa = data["sharedAssumptions"]
    scenario = find_scenario(data, scenario_id)
    vol = scenario["volumeUnits"]

    material_low, material_high, material_mid = cost_lines_total(
        resolve_material_lines(data, scenario["materialCostLinesRef"])
    )
    blocked_material = material_mid is None

    labor_cost = labor_cost_usd(scenario) * (1 + direct_cost_stress_pct)
    packaging_mid = _mid(scenario["packagingUsd"]["lowUsd"], scenario["packagingUsd"]["highUsd"])
    freight_mid = _mid(scenario["freightOutUsd"]["lowUsd"], scenario["freightOutUsd"]["highUsd"])
    material_stressed = None if blocked_material else material_mid * (1 + direct_cost_stress_pct)
    packaging_stressed = packaging_mid * (1 + direct_cost_stress_pct)
    freight_stressed = freight_mid * (1 + direct_cost_stress_pct)

    nre_low, nre_high, nre_mid = cost_lines_total([scenario["nreTotalUsd"]])
    nre_total = nre_mid if nre_mid is not None else 0.0
    nre_per_unit = nre_total / vol if vol else 0.0

    effective_price = price if price is not None else scenario.get("targetPriceUsd")
    _validate_price(effective_price)

    result = {
        "scenarioId": scenario_id,
        "offerType": scenario["offerType"],
        "label": scenario["label"],
        "volumeUnits": vol,
        "forSale": scenario.get("forSale", False),
        "blocked": bool(scenario.get("blocked", False)) or blocked_material,
        "blockedReason": scenario.get("blockedReason"),
        "priceUsd": effective_price,
        "directCostStressPct": direct_cost_stress_pct,
        "leadTimeDays": lead_time_days(data, scenario),
        "laborIsOwnerSweatEquity": scenario.get("laborIsOwnerSweatEquity", True),
    }

    if blocked_material:
        result.update({
            "variableUnitCogsUsd": None, "marginalContributionMarginUsd": None,
            "marginalContributionMarginPct": None, "nrePerUnitUsd": round(nre_per_unit, 2),
            "batchFullyLoadedMarginUsd": None, "batchFullyLoadedMarginPct": None,
            "breakevenUnits": None, "cashOutlayExclLaborUsd": None, "cashOutlayInclLaborUsd": None,
            "customerDepositCashInUsd": None, "refundableDepositLiabilityUsd": None,
            "launchLiquidityRequiredUsd": None, "fundingGapIfDepositsCollectedUsd": None,
            "viabilityFlag": "BLOCKED_UNRESOLVED_COST",
        })
        return result

    variable_unit_cogs = material_stressed + labor_cost + packaging_stressed + freight_stressed

    reserve_pct = scenario.get("reservePct", sa["warrantyReservePct_hardwareOnly"])
    cac = scenario.get("cacUsdOverride", sa["cacBaselineUsd_hardwareOnly"])
    fee_pct, fee_flat = sa["channelFeePct"], sa["channelFeeFlatUsd"]

    if effective_price is None:
        result.update({
            "variableUnitCogsUsd": round(variable_unit_cogs, 2),
            "marginalContributionMarginUsd": None, "marginalContributionMarginPct": None,
            "nrePerUnitUsd": round(nre_per_unit, 2),
            "batchFullyLoadedMarginUsd": None, "batchFullyLoadedMarginPct": None,
            "breakevenUnits": None,
            "cashOutlayExclLaborUsd": round(
                material_stressed * vol + packaging_stressed * vol + freight_stressed * vol + nre_total, 2),
            "cashOutlayInclLaborUsd": round(
                material_stressed * vol + packaging_stressed * vol + freight_stressed * vol
                + nre_total + labor_cost * vol, 2),
            "customerDepositCashInUsd": None, "refundableDepositLiabilityUsd": None,
            "launchLiquidityRequiredUsd": None, "fundingGapIfDepositsCollectedUsd": None,
            "viabilityFlag": "N/A_NOT_FOR_SALE" if not scenario.get("blocked") else "BLOCKED_LICENSE_UNRESOLVED",
        })
        return result

    channel_fee = effective_price * fee_pct + fee_flat
    reserve = effective_price * reserve_pct
    variable_selling = channel_fee + reserve + cac

    marginal_cm = effective_price - variable_unit_cogs - variable_selling
    batch_loaded_cm = marginal_cm - nre_per_unit

    one_time_low, one_time_high, one_time_mid = one_time_launch_costs_total(data)
    fy_op_low, fy_op_high, fy_op_mid = first_year_operating_fixed_costs_total(data)
    one_time_pool = nre_total + one_time_mid
    breakeven_units = math.ceil(one_time_pool / marginal_cm) if marginal_cm > 0 else None

    deposit_pct = sa["customerDepositPct"]
    deposit_in = effective_price * deposit_pct * vol

    cash_excl_labor = (material_stressed + packaging_stressed + freight_stressed) * vol + nre_total
    cash_incl_labor = cash_excl_labor + labor_cost * vol
    scenario_cash = cash_excl_labor if result["laborIsOwnerSweatEquity"] else cash_incl_labor

    acquisition_and_payment_cash = (cac + channel_fee) * vol
    reserve_cash = reserve * vol
    launch_liquidity_required = (
        one_time_mid + fy_op_mid + scenario_cash + acquisition_and_payment_cash + reserve_cash
    )
    funding_gap = max(0.0, launch_liquidity_required - deposit_in)

    if marginal_cm < 0:
        viability = "NOT_VIABLE_NEGATIVE_MARGINAL_MARGIN"
    elif batch_loaded_cm < 0:
        viability = "MARGINAL_NEGATIVE_AFTER_TOOLING"
    elif marginal_cm / effective_price < 0.10:
        viability = "THIN_BELOW_10PCT_MARGINAL"
    else:
        viability = "POSITIVE_UNIT_MARGIN_BEFORE_BUSINESS_FIXED_COSTS"

    result.update({
        "variableUnitCogsUsd": round(variable_unit_cogs, 2),
        "marginalContributionMarginUsd": round(marginal_cm, 2),
        "marginalContributionMarginPct": round(marginal_cm / effective_price * 100, 1),
        "nrePerUnitUsd": round(nre_per_unit, 2),
        "batchFullyLoadedMarginUsd": round(batch_loaded_cm, 2),
        "batchFullyLoadedMarginPct": round(batch_loaded_cm / effective_price * 100, 1),
        "breakevenUnits": breakeven_units,
        "cashOutlayExclLaborUsd": round(cash_excl_labor, 2),
        "cashOutlayInclLaborUsd": round(cash_incl_labor, 2),
        "customerDepositCashInUsd": round(deposit_in, 2),
        "refundableDepositLiabilityUsd": round(deposit_in, 2),
        "launchLiquidityRequiredUsd": round(launch_liquidity_required, 2),
        "fundingGapIfDepositsCollectedUsd": round(funding_gap, 2),
        "viabilityFlag": viability,
    })
    return result


def breakeven_price_for_target_margin(data: dict, scenario_id: str, target_margin_pct: float,
                                       direct_cost_stress_pct: float = 0.0) -> float:
    """Closed-form price solving marginalContributionMarginPct == target_margin_pct.
    price*(1 - fee_pct - reserve_pct - target) = variable_cogs + fee_flat + cac
    """
    _validate_stress(direct_cost_stress_pct)

    sa = data["sharedAssumptions"]
    scenario = find_scenario(data, scenario_id)
    material_low, material_high, material_mid = cost_lines_total(
        resolve_material_lines(data, scenario["materialCostLinesRef"]))
    if material_mid is None:
        raise ValueError(f"Scenario '{scenario_id}' has an unresolved cost line; "
                          f"no breakeven price can be computed (see blockedReason).")
    labor_cost = labor_cost_usd(scenario) * (1 + direct_cost_stress_pct)
    packaging_mid = _mid(scenario["packagingUsd"]["lowUsd"], scenario["packagingUsd"]["highUsd"])
    freight_mid = _mid(scenario["freightOutUsd"]["lowUsd"], scenario["freightOutUsd"]["highUsd"])
    variable_cogs = (material_mid * (1 + direct_cost_stress_pct) + labor_cost
                      + packaging_mid * (1 + direct_cost_stress_pct)
                      + freight_mid * (1 + direct_cost_stress_pct))
    reserve_pct = scenario.get("reservePct", sa["warrantyReservePct_hardwareOnly"])
    cac = scenario.get("cacUsdOverride", sa["cacBaselineUsd_hardwareOnly"])
    fee_pct, fee_flat = sa["channelFeePct"], sa["channelFeeFlatUsd"]
    denom = 1 - fee_pct - reserve_pct - target_margin_pct
    if denom <= 0:
        raise ValueError("target_margin_pct too high given fee/reserve assumptions; no finite price solves this.")
    return (variable_cogs + fee_flat + cac) / denom


def sequential_rollout_tooling_usd(data: dict, scenario_ids_in_order: list[str]) -> dict:
    """Real one-time TOOLING cash spent across a SEQUENTIAL rollout (e.g. batch_10 then
    batch_50 then batch_100), as the alternative to each scenario's own STANDALONE
    nreTotalUsd (which compute_scenario()/breakevenUnits use for an apples-to-apples
    first-launch comparison -- see the module docstring). The first scenario in the
    order pays its own full standalone NRE; each later scenario pays only its own
    incrementalNreIfSequentialUsd (additional tooling beyond what the prior batch
    already funded) if that field exists, else falls back to its own standalone
    nreTotalUsd (no cheaper sequential path has been modeled for it).

    Informational only -- NOT used by compute_scenario/breakevenUnits.
    """
    per_scenario: list[dict] = []
    total_low = total_high = 0.0
    for i, sid in enumerate(scenario_ids_in_order):
        scenario = find_scenario(data, sid)
        if i == 0:
            low, high, _ = cost_lines_total([scenario["nreTotalUsd"]])
            basis = "standalone (first in this rollout)"
        else:
            incremental = scenario.get("incrementalNreIfSequentialUsd")
            if incremental is not None:
                low, high, _ = cost_lines_total([incremental])
                basis = "incremental only (reuses the prior batch's tooling in this rollout)"
            else:
                low, high, _ = cost_lines_total([scenario["nreTotalUsd"]])
                basis = "standalone (no incrementalNreIfSequentialUsd modeled for this scenario)"
        total_low += low or 0.0
        total_high += high or 0.0
        per_scenario.append({
            "scenarioId": sid, "toolingCashLowUsd": low, "toolingCashHighUsd": high, "basis": basis,
        })
    return {
        "scenarioOrder": list(scenario_ids_in_order),
        "perScenarioUsd": per_scenario,
        "totalToolingCashLowUsd": round(total_low, 2),
        "totalToolingCashHighUsd": round(total_high, 2),
        "totalToolingCashMidUsd": round((total_low + total_high) / 2.0, 2),
    }


CSV_FIELDS = [
    "scenarioId", "offerType", "label", "volumeUnits", "forSale", "blocked", "blockedReason",
    "priceUsd", "directCostStressPct", "variableUnitCogsUsd",
    "marginalContributionMarginUsd", "marginalContributionMarginPct",
    "nrePerUnitUsd", "batchFullyLoadedMarginUsd", "batchFullyLoadedMarginPct",
    "breakevenUnits", "leadTimeDays", "laborIsOwnerSweatEquity",
    "cashOutlayExclLaborUsd", "cashOutlayInclLaborUsd",
    "customerDepositCashInUsd", "refundableDepositLiabilityUsd",
    "launchLiquidityRequiredUsd", "fundingGapIfDepositsCollectedUsd",
    "viabilityFlag",
]

STANDARD_STRESS_LEVELS = (0.0, 0.15, 0.30)


def write_csv(data: dict, path: Path = DEFAULT_CSV) -> list[dict]:
    """Baseline-price run of every scenario across the three standard direct-cost-stress
    levels (0%, +15%, +30%). This is the default, reproducible audit output -- the ad-hoc
    --price/--stress CLI query is for one-off exploration beyond these three fixed points."""
    rows = []
    for scenario in data["scenarios"]:
        for stress in STANDARD_STRESS_LEVELS:
            rows.append(compute_scenario(data, scenario["id"], price=None, direct_cost_stress_pct=stress))
    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=CSV_FIELDS)
        writer.writeheader()
        for row in rows:
            writer.writerow({k: row.get(k) for k in CSV_FIELDS})
    return rows


def _print_table(rows: list[dict]) -> None:
    cols = ["scenarioId", "priceUsd", "directCostStressPct", "marginalContributionMarginUsd",
            "marginalContributionMarginPct", "batchFullyLoadedMarginUsd", "breakevenUnits",
            "viabilityFlag"]
    widths = {c: max(len(c), *(len(str(r.get(c))) for r in rows)) for c in cols}
    print("  ".join(c.ljust(widths[c]) for c in cols))
    for r in rows:
        print("  ".join(str(r.get(c)).ljust(widths[c]) for c in cols))


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--json-path", type=Path, default=DEFAULT_JSON)
    ap.add_argument("--csv-path", type=Path, default=DEFAULT_CSV)
    ap.add_argument("--list", action="store_true", help="list scenario ids and labels, then exit")
    ap.add_argument("--scenario", help="compute a single scenario (ad-hoc query, not written to CSV)")
    ap.add_argument("--price", type=float, help="override targetPriceUsd for --scenario")
    ap.add_argument("--stress", type=float, default=0.0,
                     help="direct-cost stress fraction, e.g. 0.15 for +15%% (material+labor+packaging+freight only)")
    ap.add_argument("--breakeven-price", action="store_true",
                     help="with --scenario and --target-margin-pct, solve for the price hitting that margin")
    ap.add_argument("--target-margin-pct", type=float, default=0.20)
    ap.add_argument("--emit", choices=["table", "json"], default="table")
    args = ap.parse_args(argv)

    data = load_data(args.json_path)

    if args.list:
        for s in data["scenarios"]:
            print(f"{s['id']:28s} {s['offerType']:18s} {s['label']}")
        return 0

    if args.scenario and args.breakeven_price:
        try:
            price = breakeven_price_for_target_margin(data, args.scenario, args.target_margin_pct, args.stress)
        except ValueError as e:
            ap.error(str(e))
        if args.emit == "json":
            print(json.dumps({"scenario": args.scenario, "targetMarginPct": args.target_margin_pct,
                               "stress": args.stress, "breakevenPriceUsd": round(price, 2)}))
        else:
            print(f"{args.scenario}: price for {args.target_margin_pct:.0%} marginal contribution margin "
                  f"at {args.stress:+.0%} direct-cost stress = ${price:,.2f}")
        return 0

    if args.scenario:
        try:
            result = compute_scenario(data, args.scenario, price=args.price, direct_cost_stress_pct=args.stress)
        except ValueError as e:
            ap.error(str(e))
        if args.emit == "json":
            print(json.dumps(result, indent=2))
        else:
            _print_table([result])
        return 0

    # Default: full reproducible sweep, write economics.csv
    rows = write_csv(data, args.csv_path)
    print(f"Wrote {len(rows)} rows ({len(data['scenarios'])} scenarios x {len(STANDARD_STRESS_LEVELS)} "
          f"stress levels) to {args.csv_path}")
    _print_table([r for r in rows if r["directCostStressPct"] == 0.0])
    return 0


if __name__ == "__main__":
    sys.exit(main())
