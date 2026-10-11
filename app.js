
const pakistanLimits = L.latLngBounds(
  [21.5, 58.5],
  [39.0, 80.5]
);

const map = L.map('map', {
  maxBounds: pakistanLimits,
  maxBoundsViscosity: 1.0,
  minZoom: 5
}).setView([30.3753, 69.3451], 5);

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

let districts = null;
let layer = null;

// Display readable values in popups
function show(value) {
  if (value === null || value === undefined || value === '') {
    return 'not recorded';
  }

  return typeof value === 'number'
    ? value.toLocaleString()
    : value;
}

// Assign a colour based on population
function colourFor(population) {
  if (
    population === null ||
    population === undefined ||
    population === ''
  ) {
    return '#c9cfd1';
  }

  if (population > 3000000) return '#7f2704';
  if (population > 1500000) return '#d94801';
  if (population > 750000) return '#f16913';
  if (population > 300000) return '#fd8d3c';

  return '#fdd0a2';
}

// Style each district
function styleFor(feature) {
  const pop = feature.properties.pop_2023 ?? feature.properties.population;
  return {
    color: '#ffffff',
    weight: 1,
    fillColor: colourFor(pop),
    fillOpacity: 0.8
  };
}

// Draw the selected district features
function draw(features) {
  if (layer) {
    map.removeLayer(layer);
  }

  layer = L.geoJSON(
    {
      type: 'FeatureCollection',
      features: features
    },
    {
      style: styleFor,

      onEachFeature: function (feature, featureLayer) {
        const p = feature.properties;
        const districtName = p.district || p.adm2_name;
        const provinceName = p.province || p.adm1_name;
        const pop = p.pop_2023 ?? p.population;
        const area = p.area_km2 ?? p.area_sqkm;

        const areaStr = (area !== null && area !== undefined && area !== '')
          ? (typeof area === 'number' ? area.toLocaleString(undefined, { maximumFractionDigits: 1 }) + ' km<sup>2</sup>' : area + ' km<sup>2</sup>')
          : 'not recorded';

        featureLayer.bindPopup(
          '<strong>' + show(districtName) + '</strong><br>' +
          'Province: ' + show(provinceName) + '<br>' +
          'Population: ' + show(pop) + '<br>' +
          'Area: ' + areaStr
        );
      }
    }
  ).addTo(map);

  if (features.length > 0) {
    map.fitBounds(layer.getBounds());
  }

  document.getElementById('count').textContent =
    features.length + ' districts';
}

// Create province options from the GeoJSON
function fillProvinceList() {
  const select = document.getElementById('province');

  const provinces = [
    ...new Set(
      districts.features
        .map(f => f.properties.province || f.properties.adm1_name)
        .filter(Boolean)
    )
  ].sort();

  for (const name of provinces) {
    const option = document.createElement('option');
    option.value = name;
    option.textContent = name;
    select.appendChild(option);
  }
}

// Load the GeoJSON file
async function loadData() {
  try {
    let response = await fetch("data/districts_C.geojson");
    if (!response.ok) {
      response = await fetch("data/district_C.geojson");
    }

    if (!response.ok) {
      console.error(
        'Request failed with status',
        response.status
      );
      document.getElementById('count').textContent =
        'Failed to load data (HTTP ' + response.status + ')';
      return;
    }

    districts = await response.json();

    console.log('features:', districts.features.length);
    console.log('first feature:', districts.features[0]);
    console.log('properties:', districts.features[0].properties);

    fillProvinceList();
    draw(districts.features);

  } catch (error) {
    console.error('Could not load districts:', error);
    document.getElementById('count').textContent =
      'Error loading data. If opening via file://, please run a local web server.';
  }
}

// Redraw when the selected province changes
document.getElementById('province')
  .addEventListener('change', function (event) {
    const chosen = event.target.value;

    const subset = chosen === 'all'
      ? districts.features
      : districts.features.filter(
          f => (f.properties.province || f.properties.adm1_name) === chosen
        );

    draw(subset);
  });

// Add the population legend
const legend = L.control({ position: 'bottomright' });

legend.onAdd = function () {
  const div = L.DomUtil.create('div', 'legend');

  const breaks = [
    0, 300000, 750000, 1500000, 3000000
  ];

  const labels = [
    'under 300k',
    '300k to 750k',
    '750k to 1.5m',
    '1.5m to 3m',
    'over 3m'
  ];

  for (let i = 0; i < breaks.length; i++) {
    div.innerHTML +=
      '<i style="background:' +
      colourFor(breaks[i] + 1) +
      '"></i> ' + labels[i] + '<br>';
  }

  div.innerHTML +=
    '<i style="background:' + colourFor(null) +
    '"></i> no census data';

  return div;
};

legend.addTo(map);

// Start loading the data
loadData();
