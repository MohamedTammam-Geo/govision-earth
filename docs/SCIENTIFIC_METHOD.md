# Scientific method

## Question

How does the detection of surface-water candidates vary between the ascending and descending viewing directions of NISAR, and what changes when the two classifications are combined?

## Radar data and comparison

- Sensor: NASA–ISRO NISAR, L-band, L2 GCOV HH/HV products.
- Study region: Prachin Buri search rectangle, Thailand; not a delineated hydrological catchment.
- Acquisition dates represented: 6 September, 30 September and 12 October 2026.
- Native processing: UTM Zone 47N, EPSG:32647, 10 m grid.
- Four decision strategies: Ascending, Descending, Fusion OR (union of positives) and Fusion AND (intersection of positives).
- Orbit-agreement classes: shared detection, ascending-only, descending-only and ambiguous.
- Temporal view: comparisons of observed candidate-water states against the 6 September observation.

The 6 September record is retained as an earlier observation, not established as a dry baseline. Therefore temporal transitions do not identify a unique flood-onset date.

## Sentinel-2 comparison

The 30 September test used **162 accepted automatically generated optical labels** from 260 sampled points; 103 were optical water proxies and 59 optical non-water proxies. The samples span **51 spatial blocks**. Individual Sentinel-2 scenes dated 29 September and 2 October 2026 were screened by SCL and conservative reflectance / NDWI / MNDWI criteria. At least one clear observation supported each accepted label. Scene dates differ from radar acquisitions by as much as 48 hours.

The sample design deliberately balanced categories derived from SAR predictions rather than proportionately sampling regional land cover. F1 is therefore **sample-conditional optical agreement**, not an unbiased estimate of geographic accuracy and not independent field confirmation of new flooding. Optical imagery may omit cloud-affected locations and can misinterpret water beneath vegetation.

## Performance (same points, same evaluation)

| Strategy | TP | FP | FN | TN | Precision | Recall | F1 | F2 | IoU |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Ascending | 66 | 6 | 37 | 53 | 0.917 | 0.641 | 0.754 | 0.682 | 0.606 |
| Descending | 73 | 6 | 30 | 53 | 0.924 | 0.709 | 0.802 | 0.743 | 0.670 |
| Fusion AND | 40 | 1 | 63 | 58 | 0.976 | 0.388 | 0.556 | 0.442 | 0.385 |
| Fusion OR | 99 | 11 | 4 | 48 | 0.900 | 0.961 | 0.930 | 0.948 | 0.868 |

The paired 5 km spatial-block bootstrap comparison gives ΔF1 (Descending − Ascending) = +0.048 with 95% interval [−0.055, +0.147]. The interval includes zero, so the test does not establish a clear single-orbit winner. ΔF1 (Fusion OR − Descending) = +0.127 with 95% interval [+0.072, +0.191] on the exploratory optical sample.

## Data presentation

All mapped values are derived from categorical raster products and reprojected to WGS84 using nearest-neighbor resampling, preserving class meaning. Water-state categories are rendered as transparent overlays on a selectable basemap. Numbers in the charts are read from the archived evaluation CSV files. No browser-side classification or accuracy estimates are performed.

The basemap imagery is contextual, and its acquisition date can differ from the radar observation. It must not be interpreted as synchronized optical ground truth.
