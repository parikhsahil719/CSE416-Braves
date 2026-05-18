"""
Local runner for EI preprocessing (replaces finalprepro_9.py Colab-specific code).

Usage:
    python preprocessing/run_ei_local.py \
        --or-csv  path/to/or_combined_data.csv \
        --sc-csv  path/to/sc_combined_data.csv

The sc_combined_data.csv can be extracted from south_carolina.tar.gz:
    tar -xzf preprocessing/south_carolina.tar.gz -C preprocessing/
    # file will be at preprocessing/sw_south_carolina/data/combined_data.csv

Oregon: you need or_combined_data.csv from a previous Colab run
        (oregon.tar.gz in this repo is corrupted).

Install dependencies first:
    pip install pyei pandas numpy
"""

import argparse
import os
import numpy as np
import pandas as pd
import warnings
warnings.filterwarnings("ignore")

from pyei.two_by_two import TwoByTwoEI

RACIAL_GROUPS = ["white", "black", "asian", "hispanic"]

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))


def load_and_validate(filename):
    df = pd.read_csv(filename)
    required_cols = [
        "precinct_id", "total", "white", "black", "asian", "hispanic",
        "democratic_votes", "republican_votes", "total_votes",
    ]
    missing = [c for c in required_cols if c not in df.columns]
    if missing:
        raise ValueError(f"Missing columns in {filename}: {missing}")
    original_len = len(df)
    df = df[(df["total_votes"] > 0) & (df["total"] > 0)].copy()
    dropped = original_len - len(df)
    if dropped > 0:
        print(f"  Dropped {dropped} rows with zero total_votes or total population.")
    df = df.reset_index(drop=True)
    print(f"  Loaded {len(df)} precincts from {filename}.")
    return df


def build_2x2_inputs(df, group_name):
    total_pop = df["total"].values.astype(float)
    group_pop = df[group_name].values.astype(float)
    total_pop_safe = np.where(total_pop == 0, 1.0, total_pop)
    group_fraction = np.clip(group_pop / total_pop_safe, 1e-6, 1.0 - 1e-6)
    tot_votes = df["total_votes"].values.astype(int)
    dem_votes = df["democratic_votes"].values.astype(int)
    tot_safe = np.where(tot_votes == 0, 1, tot_votes).astype(float)
    dem_fraction = np.clip(dem_votes / tot_safe, 1e-6, 1.0 - 1e-6)
    precinct_pops = tot_votes.copy()
    return group_fraction, dem_fraction, precinct_pops


def run_2x2_ei(group_fraction, dem_fraction, precinct_pops, group_name, n_samples=1000, n_tune=500):
    print(f"    Running 2x2 EI for group: {group_name} ...")
    ei = TwoByTwoEI(model_name="truncated_normal")
    ei.fit(
        group_fraction=group_fraction,
        votes_fraction=dem_fraction,
        precinct_pops=precinct_pops,
        demographic_group_name=group_name,
        candidate_name="democratic",
        draws=n_samples,
        tune=n_tune,
        target_accept=0.99,
    )
    return ei


def extract_2x2_precinct_estimates(ei, group_fraction, dem_fraction, precinct_pops):
    samples = np.array(ei.sampled_voting_prefs)  # (2, n_samples)
    b1_mean = float(samples[0, :].mean())
    b2_mean = float(samples[1, :].mean())
    X = group_fraction
    T = dem_fraction
    with np.errstate(divide="ignore", invalid="ignore"):
        b1_precinct = (T - (1.0 - X) * b2_mean) / X
    b1_precinct = np.where(X < 0.02, b1_mean, b1_precinct)
    b1_precinct = np.clip(b1_precinct, 0.0, 1.0)
    return b1_precinct, b2_mean, b1_mean, samples


def compute_2x2_statewide(samples, precinct_pops, group_fraction):
    b1_samples = samples[0, :]
    b2_samples = samples[1, :]
    total_group_pop = float((group_fraction * precinct_pops).sum())
    statewide_dem = b1_samples * total_group_pop
    statewide_rep = (1.0 - b1_samples) * total_group_pop
    p = float((statewide_dem > statewide_rep).mean())
    if p >= 0.5:
        party_of_choice = "democratic"
    else:
        party_of_choice = "republican"
        p = 1.0 - p
    confidence = 1.0 / (1.0 + np.exp(18.0 - 26.0 * p))
    mean_dem_votes    = float(statewide_dem.mean())
    mean_rep_votes    = float(statewide_rep.mean())
    mean_dem_fraction = float(b1_samples.mean())
    mean_rep_fraction = float(1.0 - b1_samples.mean())
    return party_of_choice, confidence, mean_dem_votes, mean_rep_votes, mean_dem_fraction, mean_rep_fraction


def run_for_state(df, state_name, out_dir, n_samples=1000, n_tune=500):
    print(f"\n{'='*60}")
    print(f"  EI Analysis: {state_name}")
    print(f"{'='*60}")
    print(f"  Precincts: {len(df)}")

    precinct_out = pd.DataFrame()
    precinct_out["precinct_id"] = df["precinct_id"].values
    precinct_out["state"]       = state_name
    precinct_out["total_votes"] = df["total_votes"].values

    statewide_rows = []
    samples_rows = []

    for group_name in RACIAL_GROUPS:
        print(f"\n  ── Group: {group_name} ──")
        group_fraction, dem_fraction, precinct_pops = build_2x2_inputs(df, group_name)
        ei = run_2x2_ei(group_fraction, dem_fraction, precinct_pops,
                        group_name, n_samples=n_samples, n_tune=n_tune)
        b1_precinct, b2_mean, b1_mean, samples = extract_2x2_precinct_estimates(
            ei, group_fraction, dem_fraction, precinct_pops)

        precinct_out[f"ei_{group_name}_dem_vote_fraction"] = b1_precinct.round(6)
        precinct_out[f"ei_{group_name}_rep_vote_fraction"] = (1.0 - b1_precinct).round(6)
        precinct_out[f"ei_{group_name}_party_of_choice"]   = np.where(
            b1_precinct >= 0.5, "democratic", "republican")
        precinct_out[f"ei_{group_name}_precinct_confidence"] = np.where(
            b1_precinct >= 0.5, b1_precinct, 1.0 - b1_precinct).round(4)

        # Save MCMC posterior samples for narrow KDE generation
        samples_rows.append({
            "state":        state_name,
            "racial_group": group_name,
            "b1_samples":   ",".join(f"{v:.6f}" for v in samples[0, :].tolist()),
            "b2_samples":   ",".join(f"{v:.6f}" for v in samples[1, :].tolist()),
        })

        poc, conf, mean_dem, mean_rep, dem_frac, rep_frac = compute_2x2_statewide(
            samples, precinct_pops, group_fraction)
        statewide_rows.append({
            "state":             state_name,
            "racial_group":      group_name,
            "party_of_choice":   poc,
            "confidence":        round(conf, 4),
            "mean_dem_fraction": round(dem_frac, 6),
            "mean_rep_fraction": round(rep_frac, 6),
            "mean_dem_votes":    round(mean_dem, 2),
            "mean_rep_votes":    round(mean_rep, 2),
        })
        print(f"      Statewide → party_of_choice={poc}, confidence={conf:.3f}, "
              f"est. dem={mean_dem:,.0f}, rep={mean_rep:,.0f}")

    slug = state_name.lower().replace(" ", "_")

    precinct_path = os.path.join(out_dir, f"{slug}_ei_precinct.csv")
    precinct_out.to_csv(precinct_path, index=False)
    print(f"\n  Saved: {precinct_path}")

    statewide_path = os.path.join(out_dir, f"{slug}_ei_statewide.csv")
    pd.DataFrame(statewide_rows).to_csv(statewide_path, index=False)
    print(f"  Saved: {statewide_path}")

    samples_path = os.path.join(out_dir, f"{slug}_ei_samples.csv")
    pd.DataFrame(samples_rows).to_csv(samples_path, index=False)
    print(f"  Saved: {samples_path}")


def main():
    parser = argparse.ArgumentParser(description="Run EI preprocessing locally")
    parser.add_argument("--or-csv",  required=True, help="Path to or_combined_data.csv")
    parser.add_argument("--sc-csv",  required=True, help="Path to sc_combined_data.csv")
    parser.add_argument("--out-dir", default=SCRIPT_DIR,
                        help="Output directory for CSV files (default: preprocessing/)")
    parser.add_argument("--n-samples", type=int, default=1000)
    parser.add_argument("--n-tune",    type=int, default=500)
    args = parser.parse_args()

    print("Loading Oregon...")
    oregon_df = load_and_validate(args.or_csv)
    print("\nOregon sample:")
    print(oregon_df.head(3).to_string())

    print("\nLoading South Carolina...")
    sc_df = load_and_validate(args.sc_csv)
    print("\nSouth Carolina sample:")
    print(sc_df.head(3).to_string())

    run_for_state(oregon_df, "Oregon",         args.out_dir, args.n_samples, args.n_tune)
    run_for_state(sc_df,     "South Carolina", args.out_dir, args.n_samples, args.n_tune)

    print("\nDone. Place the *_ei_samples.csv files in preprocessing/, then re-run:")
    print("  node scripts/generate-ei-from-csv.js")


if __name__ == "__main__":
    main()
