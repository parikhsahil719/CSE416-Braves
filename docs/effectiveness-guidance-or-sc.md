# Oregon and South Carolina Effectiveness Guidance

## Scope

This note is for `SeaWulf-6` and the downstream VRA ensemble runs.
It is a recommendation for the current Oregon and South Carolina overnight effectiveness workflow, not a redefinition of the broader project-wide feasible-group contract.

Current run assumption:

- Oregon: the group being actively evaluated is `Latino`
- South Carolina: the group being actively evaluated is `Black`

This note does **not** claim that these are the only feasible groups stored or exposed elsewhere in the project. The broader schema and frontend contracts can still track other feasible groups.

The goal is to choose a defensible way to define groups and calculate effectiveness scores without introducing arbitrary reassignment rules.

## Recommendation

Do **not** assign multiracial people to whichever minority group has the larger statewide count.

That rule is not stable, is hard to defend, and can distort both the effectiveness scores and the ensemble constraints.

Instead, use a **fixed group-definition rule** and then vary the effectiveness method only through the established score variants and thresholds.

## Recommended Group Definitions

Use one stable demographic definition throughout preprocessing, `SeaWulf-6`, and the VRA ensembles.

### Oregon

Since Oregon is being actively evaluated for `Latino` effectiveness in this run:

- `Latino/Hispanic`: count **all Hispanic/Latino people**, regardless of race
- `Black`: if stored, define as **non-Hispanic Black alone**
- `Asian`: if stored, define as **non-Hispanic Asian alone** or whatever existing project contract already uses for the Oregon `Asian` group
- `White`: **non-Hispanic White alone**
- `Other`: **non-Hispanic multiracial + Native American + all remaining non-Hispanic groups not already stored separately**

Important consequence:

- A `Black + Latino` person should count as `Latino` for the Oregon Latino analysis
- A non-Hispanic `2+ races` person should go to `Other`

### South Carolina

Since South Carolina is being actively evaluated for `Black` effectiveness in this run:

- `Black`: **non-Hispanic Black alone**
- `Latino/Hispanic`: may still be stored, but it is not the operative feasible group for the effectiveness run
- `White`: **non-Hispanic White alone**
- `Other`: **non-Hispanic multiracial + Asian + Native American + all remaining non-Hispanic groups**

Important consequence:

- A `Black + Latino` person should **not** be reassigned to Black just because Black is the only feasible group
- Hispanic ethnicity should still be treated consistently
- Non-Hispanic `2+ races` people should go to `Other`

## Why Not Use “Assign to the Largest Minority Group”?

Do not use:

- "If Latino is larger, count Black/Latino as Latino"
- "If Black is larger, count Black/Latino as Black"
- or any rule based on whichever group has the greater count

Problems with that rule:

1. It is arbitrary.
2. The same person could be counted differently across states.
3. It changes the meaning of the demographic inputs without any corresponding electoral justification.
4. If results move, it will be unclear whether the change came from real voting behavior or from a demographic shortcut.

## How He Should Calculate Effectiveness Scores

For each district and the active target group in the state:

- Oregon: calculate `Latino` effectiveness
- South Carolina: calculate `Black` effectiveness

### Step 1: Build election sets

For each office/year, group:

- `primary + general`
- or `primary + runoff + general`

An election set is a success only if the group’s preferred candidate survives the nomination stage and wins the general election in the district.

### Step 2: Identify the group’s candidate of choice

For each election set:

- estimate the minority-preferred candidate using EI or the project’s chosen candidate-of-choice method
- keep a confidence measure for that identification

### Step 3: Mark district success

For each district `D` and election set `E`:

- `d(E, D) = 1` if the minority-preferred candidate wins the required stages in that district
- `d(E, D) = 0` otherwise

### Step 4: Compute raw effectiveness

Use the established score variants:

- `sunw`: all election sets weighted equally
- `sstate`: weighted by recency, statewide candidate-of-choice confidence, and in-group candidate preference
- `sdist`: weighted similarly, but using district-level confidence information

Practical recommendation:

- use `sstate` as the main score
- use `sdist` only if the team is explicitly running the separate robust VRA-constrained workflow associated with `s_dist`
- do not rely on `sunw` alone

### Step 5: Apply group-control adjustment

Let `k` be the district CVAP share for the feasible group.

Use:

- `c = min(2k, 1)`

Then apply the calibration input:

- `c * s_raw`

### Step 6: Calibrate to final effectiveness score

Convert the raw score into the final calibrated score using the project’s logistic calibration procedure.

This yields the district’s final effectiveness score.

### Step 7: Threshold the district

Primary rule:

- `isEffective = calibratedScore >= 0.6`

Recommended sensitivity checks:

- also inspect `0.5`
- also inspect `0.7`

## What He Should Actually Run

### Production run

For the overnight run, use:

1. Stable group definitions
2. Oregon `Latino` as the active effectiveness target for this run
3. South Carolina `Black` as the active effectiveness target for this run
4. `sstate` as the primary effectiveness score
5. `sdist` only if you are intentionally running the separate robust `s_dist` workflow
6. `0.6` as the primary threshold

### Optional sensitivity run

If there is still concern about Oregon or South Carolina:

1. Keep the same group definitions
2. Re-run with threshold sensitivity at `0.5` and `0.7`
3. Compare `sstate` and, if applicable, `sdist` in the robust workflow

This is a much better sensitivity strategy than changing the demographic assignment rule.

## What He Should Not Change

He should **not**:

- reassign multiracial people based on whichever minority group is larger
- duplicate people into multiple groups
- change group definitions between `SeaWulf-6` and the VRA ensemble runs

The group-definition rule must stay fixed across:

- precinct preprocessing
- district CVAP aggregation
- effectiveness scoring
- ensemble acceptance checks

## Final Recommendation

For this project, he should proceed as follows:

1. Use fixed, non-arbitrary group definitions.
2. In Oregon, treat all Hispanic/Latino people as the Latino target population.
3. Preserve any separately tracked Oregon `Asian` group if the existing pipeline expects it.
4. In South Carolina, use non-Hispanic Black-alone as the Black target population.
5. Put non-Hispanic multiracial people in `Other` unless they are already covered by a separately stored project-defined group.
6. Calculate effectiveness with `sstate` first.
7. Use `sdist` only for the separate robust workflow, not as an implicit change to the standard run.
8. Use `0.6` as the main effectiveness threshold.
9. If results are borderline, vary thresholds or score variants, not the race-bin rule.

That gives a method that is more stable, easier to defend, and less likely to contaminate the effectiveness results with arbitrary preprocessing choices.
