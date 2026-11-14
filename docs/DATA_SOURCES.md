# Data sources and map attribution

- **NASA–ISRO NISAR L2 GCOV (HH/HV):** primary radar observations. https://nisar.jpl.nasa.gov/ and https://search.asf.alaska.edu/
- **Copernicus Sentinel-2 Surface Reflectance Harmonized:** automated spectral assessment. https://developers.google.com/earth-engine/datasets/catalog/COPERNICUS_S2_SR_HARMONIZED
- **JRC Global Surface Water:** historical water context in analytical stages. https://global-surface-water.appspot.com/
- **OpenStreetMap:** streets basemap and attribution. https://www.openstreetmap.org/copyright
- **Esri World Imagery:** satellite context imagery and provider credits. https://www.arcgis.com/home/item.html?id=10df2279f9684e4a9f6a7f08febac2a9
- **Leaflet:** interactive map library, BSD 2-Clause. https://leafletjs.com/

All data providers retain their own licenses and attribution requirements. Background imagery is not an acquisition-matched reference for the three radar dates.

## Why the map no longer uses CARTO

The original site included an unkeyed CARTO Dark Matter tile endpoint, which now displays a repeating API-access watermark. This release removes that dependency entirely. The default background is Esri World Imagery, with an OpenStreetMap street-map option. **Google Hybrid** is not used because official Google Maps services require licensed Maps API credentials and billing. The website does not expose or rely on any private credentials.
