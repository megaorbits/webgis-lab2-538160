# Web GIS Lab 02 — District Explorer

**Student:** Muhammad Ahmad
**Roll No.:** 538160
**Programme:** IGIS/SCEE, NUST

## 1. Published links

- GitHub repository: (https://github.com/megaorbits/webgis-lab2-538160)]
- Live map: **[FILL: insert GitHub Pages URL]**

## 2. GeoJSON and shapefile sizes

| Version | Method | Size (bytes) | Size (MB) | % of A |
|---|---|---:|---:|---:|
| Shapefile | Sum of five adm2 components | 4,376,000 | 4.38 | N/A |
| A | Straight conversion | 10,146,902 | 10.15 | 100% |
| B | Precision 5 | 5,139,791 | 5.14 | 50.65% |
| C | Simplify 100 m, precision 5 | 980,883 | 0.98 | 9.67% |
| D | Simplify 1 km, precision 5 | 285,341 | 0.29 | 2.81% |

% of A = (version size / A size) x 100. For example, B = 5,139,791 / 10,146,902 x 100 = 50.65%. MB values use 1 MB = 1,000,000 bytes.

Observations:

- Reducing coordinate precision to 5 decimal places (about 1.1 m) alone cut the file size by about 49% (A to B).
- Simplifying with a 100 m tolerance (C) reduced it to under 10% of A, and a 1 km tolerance (D) to under 3% of A.
- Versions C and D were both created from the original layer, so the comparison is fair. Version C was copied into the project as `data/districts.geojson`.
- In QGIS, `districts_A` (red) and `districts_D` (green) were overlaid. Version D replaces fine boundary detail with long straight segments, so it is visibly coarser than Version A (see Checkpoint 2).

## 3. Network measurements

| File | Normal load time | Slow 3G load time |
|---|---:|---:|
| districts.geojson (Version C) | 63 ms | 6.97 s |
| districts_A.geojson | **[FILL]** | **[FILL]** |

- GeoJSON request size: 933 kB transferred (1,367 kB resource size) on a normal connection; 11.6 kB shown by the browser on Slow 3G.
- Page totals (normal): 28 requests, 1.4 MB transferred, Finish 1.14 s, DOMContentLoaded 471 ms.
- Number of PNG tile requests: **[FILL]**
- Example tile URL and zoom level: `https://tile.openstreetmap.org/{z}/{x}/{y}.png`, zoom z = **[FILL]**. Tiles are 256 x 256 px PNG images (the selected tile was 19.1 kB).

On Slow 3G the GeoJSON took about 100 times longer to load than on the normal connection, and each tile took roughly 6-7 s.

## 4. Population classification

- Above 3,000,000: #7f2704
- Above 1,500,000: #d94801
- Above 750,000: #f16913
- Above 300,000: #fd8d3c
- 300,000 or below: #fdd0a2
- Missing data: #c9cfd1

The five population classes use manual break values.
Districts without population data are shown in grey.

## 5. Coordinate system comparison

Areas were calculated in QGIS with `$area / 1000000` on `d_3857` (EPSG:3857) and `d_32643` (EPSG:32643, UTM zone 43N). The UTM area is the reference.

| District | Latitude (approx.) | 3857 area (km²) | UTM area (km²) | % difference | 1/cos²φ | Predicted % difference |
|---|---:|---:|---:|---:|---:|---:|
| Awaran | 26.45°N |  24,989.609 | | 1.247 | 24.7% |
| Attock | 33.77°N |  6,910.050 | | 1.447 | 44.7% |
| Bagh | 33.98°N | 694.417 |  | 1.454 | 45.4% |
| Abbottabad | 34.15°N | 1,639.517 |  | 1.460 | 46.0% |
| Astore | 35.33°N | 5,132.454 |  | 1.502 | 50.2% |

**Q1. Does the percentage difference grow or shrink as you move north?**
It grows. Web Mercator stretches distances by 1/cos φ in both directions, so areas are inflated by about 1/cos²φ, which increases with latitude: about 1.25 at Awaran (~26.5°N) and about 1.50 at Astore (~35.3°N).

**Q2. Predicted inflation factor.**
Inflation factor = 1 / cos²(φ), with φ in degrees. The factor for each district is in the table above. For example, at 35.33°N it is about 1.50, so the Web Mercator area is predicted to be about 50% larger than the true area.

**Q3. Which area would you use in a report and why?**
The UTM area (EPSG:32643). UTM is a projected system that limits distortion inside its zone, while Web Mercator is designed for web display and strongly inflates area at higher latitudes. Western districts such as Awaran lie outside zone 43N (72°-78°E), so their distortion is larger; for a nationwide study an equal-area projection would be better.

## 6. GeoJSON inspection

1. Outer object type: FeatureCollection
2. Feature count: 160
3. First feature geometry type: MultiPolygon in the inspected source file (the loaded `districts.geojson` reports Polygon in the Console)
4. Nested coordinate bracket levels: 4 for MultiPolygon (`[[[[73.53892, 34.12617] ...`)
5. Property keys: adm2_name, adm2_name1-3, adm2_pcode, adm1_name, adm1_name1-3, adm1_pcode, adm0_name, adm0_name1-3, adm0_pcode, valid_on, valid_to, area_sqkm, version, lang, lang1-3, center_lat, center_lon (final map file: district, province, pop_2023, area_km2, pcode)
6. First coordinate pair: [73.53892, 34.12617]
7. Coordinate order and ring closure: the order is longitude, latitude (73.5 is within 61-77 and 34.1 is within 24-37). The first and last pairs of an outer ring are identical, as GeoJSON requires.

## 7. Questions

### Q1. When is Version D the wrong choice?

Version D is unsuitable for detailed district-level analysis or close-up maps. The 1 km simplification removes boundary detail and can distort district shapes.

### Q2. Why is one GeoJSON request different from tile requests?

The browser requests the GeoJSON file once to obtain all district geometries and attributes. The basemap is delivered as many separate 256 x 256 px image tiles, requested according to the current zoom level and map extent.

### Q3. Why does the map container need a height?

An empty HTML `div` has no height by default. Without a defined height, Leaflet has no visible area in which to draw the map.

### Q4. What happens if draw does not remove the old layer?

Every redraw adds another district layer on top of the previous one. This creates overlapping features and can slow the map down.

### Q5. Why might all districts appear in the same colour?

The population values may contain invalid text, thousands separators or placeholders such as `NA`, so the numeric comparisons fail. The code may also be reading the wrong population field. Inspecting the attribute table and `feature.properties` in the Console shows which is the cause.

### Q6. Why does double-clicking index.html fail to load districts?

Double-clicking opens the page with a `file:///` URL, and browsers can block JavaScript fetch requests from the local file system. Live Server serves the page over HTTP, which allows the GeoJSON request to work.

## 8. Checkpoint screenshots

### Checkpoint 1 — Project setup
VS Code showing the project folder, the three files and the empty `data` folder.

![Checkpoint 1](checkpoints/checkpoint%201.png)

### Checkpoint 2 — File sizes and detail loss
The file-size table is in Section 2. The screenshots show the size measurements and `districts_A` (red) vs `districts_D` (green) in QGIS.

![Checkpoint 2](checkpoints/checkpoint%202.png)

![Checkpoint 2B](checkpoints/checkpoint%202B.png)

### Checkpoint 3 — GeoJSON inspection

![Checkpoint 3](checkpoints/checkpoint%203.png)

### Checkpoint 4 — Empty page on Live Server
Header, empty map area and the `127.0.0.1` URL.

![Checkpoint 4](checkpoints/checkpoint%204.png)

### Checkpoint 5 — Console verification
160 features, first feature (Bagh), 36 Punjab districts and 7 provinces.

![Checkpoint 5](checkpoints/checkpoint%205.png)

### Checkpoint 6 — Network measurements

![Checkpoint 6A: GeoJSON timing](checkpoints/checkpoint%206A.png)

![Checkpoint 6B: map tile preview, 256 x 256 px](checkpoints/checkpoint%206B.png)

![Checkpoint 6C: normal connection](checkpoints/checkpoint%206C.png)

![Checkpoint 6D: Slow 3G](checkpoints/checkpoint%206D.png)

### Checkpoint 7 — Coloured map, legend and popup
Popup for Bahawalpur: Punjab, population 4,284,964, area 23,966.1 km².

![Checkpoint 7](checkpoints/checkpoint%207.png)

### Checkpoint 8 — Province filter

![Checkpoint 8A: All provinces, 160 districts](checkpoints/checkpoint%208A.png)

![Checkpoint 8B: Punjab, 36 districts](checkpoints/checkpoint%208B.png)

![Checkpoint 8C: Sindh, 29 districts](checkpoints/checkpoint%208C.png)

### Checkpoint 9 — Coordinate system comparison
Calculated UTM areas (km²): Bagh 694.417, Abbottabad 1,639.517, Astore 5,132.454, Attock 6,910.050, Awaran 24,989.609.

![Checkpoint 9: area summary](checkpoints/checkpoint%209%20final%20comparison.png)

![Bagh](checkpoints/checkpoint%209%20Bagh.png)

![Abbottabad](checkpoints/checkpoint%209%20Abbotabad.png)

![Astore](checkpoints/checkpoint%209%20Astore.png)

![Attock](checkpoints/checkpoint%209%20Attock.png)

![Awaran](checkpoints/checkpoint%209%20Awaran.png)
