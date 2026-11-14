# Govision Earth

**SARFlow Explorer — Two Orbits. One Changing Landscape.**

[Explore the interactive map](#interactive-application) · [Results](#scientific-results) · [Methods](docs/SCIENTIFIC_NOTES.md) · [Data sources](docs/SOURCES.md) · [NASA Space Apps](https://www.spaceappschallenge.org/2026/)

**Challenge:** NASA Space Apps Challenge 2026 — *Dancing with the SARs*  
**Project and team:** Govision Earth  
**Application:** SARFlow Explorer  
**Study region:** Prachin Buri, Thailand (rectangular search area, not a delineated catchment)  
**Primary measurements:** NASA–ISRO NISAR L2 GCOV, HH/HV polarizations, ascending and descending orbits.

Govision Earth presents an interactive investigation of how radar viewing direction changes the mapping of surface-water signals. It brings together three NISAR observation dates, orbit-specific classifications, complementary fusion approaches, and an independent-source Sentinel-2 spectral comparison in one explorable map.

**Research question:** *Which combination of ascending and descending NISAR observations provides the strongest agreement with clear-sky optical evidence of surface water?*

> This is an independent participant research demonstration. It is not an official NASA/ISRO product, flood warning, or certified flood-extent dataset.

## The story in three steps

**Observe.** See how radar-derived surface-water candidates differ on **6 September**, **30 September**, and **12 October 2026**.  
**Compare.** Switch among Ascending, Descending, Fusion OR (either orbit), Fusion AND (both orbits), and their agreement/disagreement.  
**Evaluate.** Compare strategies against one held-out set of automated Sentinel-2 optical labels, with common sampling locations and block-bootstrap intervals.

The central contribution is an **explainable orbit-comparison experience**, not a claim that every water candidate is floodwater.

## Interactive application

The static WebGIS includes:

- **Temporal navigation:** three observation dates and comparison with the 6 September observation.
- **Radar-view selector:** ascending, descending, fusion union, fusion intersection, and orbital agreement.
- **Spatial controls:** pan, zoom, coordinates, scale, layer opacity, and a before/after swipe.
- **Quantitative evidence:** water-candidate area trajectories, precision, recall, F1, and paired confidence intervals.
- **Research context:** methods, source credits, and the scope of the optical comparison.

**Live demo:** add the final GitHub Pages URL after deployment.  
**Project page:** https://www.spaceappschallenge.org/2026/find-a-team/geovision-earth/?tab=project (team-page address visible in the supplied screenshot; confirm the page remains attached to the correct team).

## Scientific results

**Observation window:** 30 September 2026. **Comparison reference:** automated Sentinel-2 spectral labels for clear, unambiguous pixels. **Accepted points:** 162 of 260, across 51 spatial blocks.

| Radar strategy | Precision | Recall | F1 | 95% block-bootstrap F1 interval |
|---|---:|---:|---:|---|
| Ascending | 0.917 | 0.641 | 0.754 | 0.685–0.822 |
| Descending | 0.924 | 0.709 | 0.802 | 0.727–0.859 |
| Fusion AND · both orbits | **0.976** | 0.388 | 0.556 | 0.403–0.661 |
| **Fusion OR · either orbit** | 0.900 | **0.961** | **0.930** | 0.881–0.965 |

Under this **sample-conditional optical-proxy comparison**, Fusion OR recorded the highest F1. Descending exceeded ascending by 0.048 F1, but the paired 95% interval (−0.055 to +0.147) contains zero; therefore this dataset does not establish a robust single-orbit winner. Fusion OR exceeded descending by 0.127 (paired interval +0.072 to +0.191) within this screening design.

These values measure **agreement with automatically derived optical evidence of open surface water**. They do **not** represent independently field-verified flood detection, and unweighted metrics from a SAR-stratified, cloud-filtered sample do not establish area-wide accuracy. This precise distinction is part of the methodology, not an assessment of software quality.

## Launch on GitHub Pages

1. Create a **public** GitHub repository called `govision-earth` (or another available name).
2. Upload the **contents of this folder**, including `index.html`, `assets`, `data`, `docs`, and `scripts`, to the root of the `main` branch. Do not upload only the ZIP.
3. Open **Settings → Pages → Build and deployment**, select **Deploy from a branch**, choose **main / (root)**, then save.
4. Open the published URL, typically `https://YOUR-USERNAME.github.io/govision-earth/`, and test the date selector, radar modes, map, opacity, and swipe comparison.
5. Copy the actual working demo and repository URLs into your NASA Space Apps project submission.

To test the page locally (the data JSON is loaded over HTTP):

```bash
cd Govision_Earth_GitHub_Ready_v2
python -m http.server 8000
# Visit http://localhost:8000
```

The published website requires no private Earth Engine token. It uses precomputed overlay assets, Leaflet and public basemap services.

## Repository structure

```text
Govision_Earth_GitHub_Ready_v2/
├── index.html                    # Govision Earth / SARFlow interactive WebGIS
├── README.md                     # Research summary and deployment guide
├── LICENSE                       # Original application code license
├── .gitignore
├── assets/
│   ├── css/styles.css            # Responsive interface
│   ├── js/app.js                  # Controls, maps and plots
│   ├── images/                   # Logo and previews
│   └── maps/                     # 17 WGS84-reprojected display overlays
├── data/
│   ├── site_data.json            # Map extents and displayed metrics
│   ├── optical_proxy_scores.csv  # Stage 08C performance table
│   ├── paired_proxy_F1_differences.csv
│   ├── optical_proxy_report.json
│   └── source_integrity.json
├── scripts/build_assets.py      # Raster-to-map asset exporter
└── docs/
    ├── SCIENTIFIC_NOTES.md      # Detailed methods and interpretation
    ├── SOURCES.md               # Mission, datasets and map attribution
    ├── STORYBOARD.md            # Demo narrative
    └── DEVELOPMENT_LOG.md       # Factual development and source record
```

## Reproduce the map assets

The 17 transparent overlays were created from actual `Results_2` GeoTIFF classifications. The analytical rasters use **EPSG:32647 / 10 m**; presentation images were resampled with nearest-neighbor into WGS84 and are placed on the map using geographic image bounds. The PNGs are **display assets**, not standalone georeferenced analytical rasters.

```bash
pip install numpy rasterio pillow affine
python scripts/build_assets.py --source /path/to/Results2_rasters --output . --max-width 1650
```

Expected source raster names: `ASC_states_3epochs.tif`, `DESC_states_3epochs.tif`, `fusion_candidate_3epochs.tif`, and `water_typology_3epochs.tif`. The processing notebook and full-resolution raw NISAR inputs remain archived separately; they are not packaged in this lightweight static site.

## Scientific interpretation

- The AOI is a search rectangle in Prachin Buri, Thailand.
- The 6 September observation is a comparison epoch; no claim is made that it represents a flood-free dry baseline.
- Ascending and descending acquisitions are separated by approximately 10.97 hours.
- The Sentinel-2 samples were taken from individual scenes on 29 September and 2 October; they are temporally proximate, not simultaneous ground observations.
- The sample is SAR-stratified; cloud screening and optical ambiguity affect the eligible population.
- JRC provides historical-water context, and ESA WorldCover provides historical land-cover context; neither independently confirms 2026 flood onset or damage.
- The website describes surface-water candidates and orbit-comparison evidence, not flood depth or loss estimates.

Detailed interpretation, formulas, evidence hierarchy, and limits: [Scientific Notes](docs/SCIENTIFIC_NOTES.md).

## Data and acknowledgments

This independent project uses open datasets from **NASA–ISRO NISAR**, **NASA GPM IMERG**, **Copernicus Sentinel-2 / ESA**, **JRC Global Surface Water**, and **ESA WorldCover**. Mapping uses **Leaflet**, **OpenStreetMap contributors**, and **CARTO**. Full resource links and attributions are in [SOURCES.md](docs/SOURCES.md). Original software is under the [MIT License](LICENSE); source data retain their respective providers' terms.

## Submission essentials

Provide the working application URL, source repository, a short demonstration, the project description, all data/resources and tool attributions, and any additional disclosures required by the official submission fields. Report work and contributor provenance accurately; do not infer a development schedule from the dates of satellite acquisitions. Refer to the [official submission guidance](https://www.spaceappschallenge.org/2026/).

**Govision Earth** is an independent participant entry associated with the *Dancing with the SARs* challenge. NASA and ISRO do not endorse this implementation.
