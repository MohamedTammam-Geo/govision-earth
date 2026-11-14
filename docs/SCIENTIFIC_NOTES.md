# Scientific notes & interpretation boundaries

## Scientific question

**How does NISAR orbit geometry affect mapping of open surface-water candidates, and how does combining ascending and descending orbits change the balance of detection and agreement with Sentinel-2?**

This project tells one story. It does **not** attempt a complete hydrologic flood forecast or claim damage assessment.

## Source workflow

| Dataset | Role | Reference |
|---|---|---|
| NASA–ISRO NISAR L2 PR GCOV HH/HV | Main radar measurements and orbit-specific water candidate maps | 06 Sep, 30 Sep, 12 Oct 2026; two orbit directions |
| NASA GPM IMERG V07 | Precipitation context, not water ground truth | 24-hour antecedent totals |
| Sentinel-2 SR Harmonized L2A | Optical contextual imagery and spectral proxy labels | 29 Sep / 02 Oct 2026 |
| JRC Global Surface Water | Historical recurrence context | 1984–2021 only |
| ESA WorldCover | Historical crop mask context | 2021, not a verified 2026 exposure inventory |

The study covers a **Prachin Buri search rectangle**, not a delineated watershed. Native SAR output grid EPSG:32647 at 10 m. Ascending and descending acquisitions are **approximately 10.97 hours apart**, so differences may include geometry, time and underlying conditions.

## Source analysis

1. GCOV gamma0 power was converted to dB and quality-screened. The masked, aligned HH/HV layers were used for orbit-specific candidate extraction.
2. Candidate raster layers are generated separately for ascending and descending at each date. Ambiguous brightening is recorded separately.
3. Stage 07 categorical fusion encodes: 0 both noncandidate; 1 both candidate; 2 ascending-only; 3 descending-only; 4 ambiguous/incomplete; 255 no observation.
4. The web map renders the original categorical classes; OR = codes 1,2,3 and AND = code 1. Class 4 is excluded from binary comparisons. Raster classes were reprojected to EPSG:4326 using nearest-neighbor and downsampled **for display only**. Source areas are counted at native resolution.
5. The observed-transition layer compares OR candidate status on 06 Sep to each later date, using only valid unambiguous observations at both epochs. It is not an identified flood-onset mask.

## Optical-proxy assessment: 30 September

The Stage 08C script sampled 260 blind points stratified by the four radar categories (both noncandidate, both candidate, ascending only, descending only). It chose clear SCL and conservative MNDWI/NDWI/NIR/SWIR thresholds in individual Sentinel-2 scenes. 162 points were accepted, including 103 optical-water and 59 optical-nonwater proxy labels, in 51 spatial blocks. A set of 1,000 block bootstrap replications produced F1 uncertainty intervals and paired differences. The numerical result is **exploratory proxy agreement**; automated spectral labels are not human-interpreted flood observations.

| Method | TP | FP | FN | TN | F1 | Precision | Recall |
|---|---:|---:|---:|---:|---:|---:|---:|
| Ascending | 66 | 6 | 37 | 53 | 0.754 | 0.917 | 0.641 |
| Descending | 73 | 6 | 30 | 53 | 0.802 | 0.924 | 0.709 |
| Fusion AND | 40 | 1 | 63 | 58 | 0.556 | 0.976 | 0.388 |
| Fusion OR | 99 | 11 | 4 | 48 | 0.930 | 0.900 | 0.961 |

Definitions:

- **Precision** = TP/(TP + FP)
- **Recall** = TP/(TP + FN)
- **F1** = 2·TP/(2·TP + FP + FN)
- **F2** = 5·TP/(5·TP + 4·FN + FP)
- **IoU** = TP/(TP + FP + FN)

Paired comparison, 95% block bootstrap intervals:

- Descending − Ascending: **+0.0479** [−0.0546, +0.1469]; a distinct single-orbit winner is not established.
- Fusion OR − Descending: **+0.1274** [+0.0719, +0.1914]; OR produces higher proxy agreement in the sampled set.
- Fusion AND − Descending: **−0.2466** [−0.3579, −0.1482].

## Why this is scientifically useful

Fusion OR and AND represent two competing priorities: more complete detection vs a stricter agreement criterion. The evidence suggests the OR strategy captures a larger share of clearly visible optical water at the cost of some extra false positives. This demonstrates **viewing-geometry complementarity** and makes the trade-off inspectable on an interactive map.

## What must not be inferred

- **Not a certified flood inventory:** An observed radar water-state candidate is not necessarily floodwater. Smooth ground, wet agricultural fields and mixed pixels can produce similar signals.
- **Not a verified dry baseline:** 06 Sep 2026 may already have surface water from rainfall, irrigation or flooding. A change since that date does not establish flood onset.
- **Not field-validated F1:** Optical proxy labels are algorithmic, not human verified or ground truth; independent dated flood polygons would be required for flood-specific validation.
- **Not area-wide accuracy:** SAR-stratum-balanced design and optical cloud filtering bias the sampled population. Unweighted F1 cannot be generalized to the AOI without appropriate design-based analysis.
- **Not simultaneous:** Two optical acquisitions 29 Sep / 02 Oct differ from SAR dates by up to 48 hours and from each other by more; flood extents can change quickly.
- **Not crop loss, water depth or damage:** 2021 WorldCover intersects current radar observations but does not measure crop losses in 2026.

## What would strengthen a journal submission

Human-interpreted, blind, independent high-resolution reference labels for dated scenes; archived GIS flood boundaries for a matched date; balanced validation of water/nonwater and vegetated inundation; source-wise sensitivity; design-weighted accuracy and temporal sensitivity; comparison of radar polarization/geometry effects. None is silently assumed completed in this release.
