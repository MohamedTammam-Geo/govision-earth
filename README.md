# Govision Earth

**SARFlow Explorer — Two radar views. A clearer picture of water.**

An interactive geospatial explorer created for the **NASA Space Apps Challenge 2026 — Dancing with the SARs**. The application uses NASA–ISRO NISAR L-band SAR observations to compare ascending, descending and fused surface-water classifications in Prachin Buri, Thailand.

**Live website:** https://mohamedtammam-geo.github.io/govision-earth/  
**Source repository:** https://github.com/MohamedTammam-Geo/govision-earth

## Explore

- **Three radar observations:** 6 September, 30 September and 12 October 2026.
- **Six map layers:** ascending, descending, union (Fusion OR), intersection (Fusion AND), orbit agreement and water-state transition.
- **Interactive comparison:** one map or two synchronized maps, satellite or street basemap, layer transparency and geographic coordinates.
- **Performance dashboard:** F1, precision, recall, F2 and time-series area comparison.
- **Responsive layout:** light and dark themes for desktop and mobile.

## Key result

For 30 September 2026, four strategies were compared using the same **162 selected high-confidence automated Sentinel-2 optical labels**.

| Strategy | Precision | Recall | F1 |
|---|---:|---:|---:|
| Ascending | 0.917 | 0.641 | 0.754 |
| Descending | 0.924 | 0.709 | 0.802 |
| Fusion AND | **0.976** | 0.388 | 0.556 |
| **Fusion OR** | 0.900 | **0.961** | **0.930** |

Fusion OR provides the highest optical-reference F1 in this comparison. The reference labels were produced automatically from Sentinel-2 spectral observations rather than from a field survey, and the sampled points were stratified by SAR response. These scores describe this sample, not a region-wide flood accuracy estimate. The 6 September image is a prior observation rather than a confirmed dry baseline.

## Run locally

Download the repository and serve it with any HTTP server:

```bash
python -m http.server 8000
```

Open http://localhost:8000/. No backend or secret credentials are required. External basemaps and the Leaflet library need an internet connection.

## Project structure

```text
index.html             Interactive geospatial interface
assets/css/site.css    Responsive styles and light/dark themes
assets/js/site.js      Map controls, area summaries and charts
assets/maps/           17 georeferenced, transparent NISAR map layers
data/                  Source-based statistics and optical assessment
scripts/build_maps.py  Re-create map layers from the NISAR raster products
docs/                  Data sources and scientific methodology
```

The geographic layers are raster-derived PNG overlays reprojected to WGS84 for web display. Original analyses were produced on a 10 m UTM Zone 47N grid; presentation PNGs do not replace the source GeoTIFFs.

## Team

**Govision Earth**

- Mohamed Elsayed Mohamed Tammam
- Mona Hamdy Ahmed Ahmed

## Data and attribution

NASA–ISRO NISAR L2 GCOV HH/HV; Copernicus Sentinel-2 Surface Reflectance; historical JRC surface-water context. Satellite basemap imagery © Esri and contributing imagery providers; street basemap data © OpenStreetMap contributors. See [Data sources](docs/DATA_SOURCES.md) and [Scientific method](docs/SCIENTIFIC_METHOD.md).

Original application source code: MIT License. Third-party imagery and data remain subject to their respective terms.
