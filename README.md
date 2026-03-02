<<<<<<< HEAD
# ECG_cnn
An implementation of a cnn for abnormal ECG for myocardial infraction 

## 1°/ what's Myocardial infraction :
A heart attack, or myocardial infarction (MI), is permanent damage to the heart muscle. "Myo" means muscle, "cardial" refers to the heart, and "infarction" means death of tissue due to lack of blood supply.

## 2°/ How does that appear in an ECG ?
In a myocardial infarction transmural ischemia develops. In the first hours and days after the onset of a myocardial infarction, several changes can be observed on the ECG. **First, large peaked T waves (or hyperacute T waves), then ST elevation, then negative T waves and finally pathologic Q waves develop.**

> Figure 01 : ECG (normal)
> ![figure10](https://user-images.githubusercontent.com/45218202/130303000-84e25c8b-8038-471c-9e48-f081e1930a37.jpg)

> Figure 02 : ECG (acute MI)
> ![Figure-3](https://user-images.githubusercontent.com/45218202/130303009-d99e0857-b827-48c8-8fc2-8c2a3e7d3fbe.jpg)

## 3°/ Dataset used :
The research paper I relayed on (https://arxiv.org/pdf/1805.00794) considered two different datasets but I worked only with :
     - PTB Diagnostic ECG Dataset : https://archive.physionet.org/physiobank/database/ptbdb/
     *Description of the dataset :* 
           The database contains 549 records from 290 subjects (aged 17 to 87, mean 57.2; 209 men, mean age 55.5, and 81 women, mean age 61.6; ages were not              recorded for 1 female and 14 male subjects). Each subject is represented by one to five records. There are no subjects numbered 124, 132, 134, or              161. Each record includes 15 simultaneously measured signals: the conventional 12 leads (i, ii, iii, avr, avl, avf, v1, v2, v3, v4, v5, v6)                    together with the 3 Frank lead ECGs (vx, vy, vz). Each signal is digitized at 1000 samples per second, with 16 bit resolution over a range of ±                16.384 mV. On special request to the contributors of the database, recordings may be available at sampling rates up to 10 KHz.

## 4°/ CNN model implemented:
> Figure 04 : the proposed architecture of the convolutional neural network 
> 
> ![Capture](https://user-images.githubusercontent.com/45218202/130303416-e6a68e97-a6a0-4f7a-823f-6eec0ad644b6.PNG)

## 5°/ How to use the code and try it :
  1. Download all required packages (preferablly in Anaconda)
     ```
     pip install -r requirements.txt
     ```
  2. Run the python program using : (python3 is used)
     ```
     python main.py
     ```
     
  That's pretty much all !
  
  *If you encounter any problems contact me through mail : il_belkessa@esi.dz*       



=======
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

>>>>>>> bad42e80370493156158116ed7375f2c1f82dc43
