# 25-26J-522
DEEP LEARNING ECG ANALYSIS FOR CARDIAC HEALTH ASSESSMENT IN PRIMARY CARE APPROACH


**Why this structure?**
- Keeps each member’s work modular and independently testable.
-  Reduces merge conflicts by isolating code and using shared utilities.
- Supports gradual integration into a single end-to-end system.



## 2) Workflow (Branching, Reviews, and Merges)
We follow a simple Git workflow to keep work organized and traceable.

### Branching Strategy
- `main` : Stable, reviewed code only (integration-ready)
- `dev`  : Ongoing integration branch (combined work)
- Feature branches:
  - `feature/<component>/<memeber-name`
  - Example: `feature/arrhythmia/vihara`

### Contribution Process
1. Create a feature branch from `dev`
2. Implement changes with clear commits (small + meaningful)
3. Open a Pull Request (PR) to `dev`
4. At least one team member reviews before merging
5. Weekly (or milestone-based) merge from `dev` → `main`

### Commit Message Format
Use short, consistent messages:
- `feat(arrhythmia): add CWT scalogram generator`
- `fix(shared): handle NaN values in normalization`

---

## 3) Merge Records (Dates + Evidence)
All merges are recorded in **two places**:
1) **Git history (source of truth)**  
2) A human-readable record below (for assessment convenience)

> Tip: You can generate Git evidence using:  
> `git log --merges --date=short --pretty=format:"%ad | %h | %s"`

### Merge Log (Maintain This Table)
| Date (YYYY-MM-DD) | From Branch → To Branch | PR/Commit Ref | Summary | Merged By |
|---|---|---|---|---|
| 2025-11-29 | feature/arrhythmia/cwt-scalogram → dev | (commit-hash/PR#) | Added CWT scalogram generation + basic tests | (name) |
| 2026-01-10 | dev → main | (commit-hash/PR#) | PP1 milestone merge: stable preprocessing + baseline models | (name) |

**Rules**
- No direct commits to `main`
- All merges must reference a PR or merge commit hash
- Each merge entry must include a short summary of what changed

---

## 4) Data & Ethics Note
- Only publicly available datasets are used (e.g., PhysioNet MIT-BIH, Kaggle NSR).
- No raw patient-identifying data is committed into this repository.
- If dataset files are required locally, they should be downloaded via documented links/scripts.

---

## 5) How to Run (High-Level)
Each component has its own py or keras models inside its folder:
- `components/member-2_arrhythmia/README.md` (example)

General steps:
1. Install dependencies (Python/Node depending on component)(Run colab notebooks, or py files)
2. Configure environment variables if needed
3. Run training or inference scripts per component documentation

---

## 6) Ownership / Component Mapping
- Member 1 IT22246714: Arrhythmia detection
- Member 2 IT22627728: SVT detection
- Member 3 IT22244802: CAD detection
- Member 4 IT22284198: Myocardial infarction detection

