/* ----------  Configuración general  ---------- */
const map = L.map('map', { zoomControl: false });   // movemos zoom a la derecha
const grayBase = L.tileLayer(
  'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
  { attribution: '&copy; OSM | &copy; Carto', maxZoom: 19 }
);
const colorBase = L.tileLayer(
  'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  { attribution: '&copy; OpenStreetMap contributors', maxZoom: 19 }
);
grayBase.addTo(map);  // base por defecto
let currentBase = 'gray';   // estado para el botón

/* ----------  Colores por sector  ---------- */
const sectorColors = {
  'EL PLAN'        : '#ff6666',
  'LOS PINOS'      : '#66c2ff',
  'EL MIRADOR'     : '#ffd966',
  'ALTO DEL PADRE' : '#b86ef5',
  'EL PARAISO'     : '#5cd65c',
  'PAZ Y FUTURO'   : '#ff8c1a',
  'SAN MIGUEL'     : '#ff66c2'
};

/* ----------  Capas globales  ---------- */
let sectorLayer, construLayer, encuestasLayer, viasLayer, perimetroLayer;

/* ----------  Cargar GeoJSONs  ---------- */
Promise.all([
  fetch('SECTORES.json').then(r => r.json()),
  fetch('CONSTRUCCIONES.json').then(r => r.json()),
  fetch('ENCUESTAS.json').then(r => r.json()),
  fetch('VIAS.json').then(r => r.json()),
  fetch('PERIMETRO.json').then(r => r.json())
]).then(loadLayers)
  .catch(err => console.error('Error cargando archivos GeoJSON:', err));

function loadLayers([sectores, construcciones, encuestas, vias, perimetro]) {

  /* PERÍMETRO – para fitBounds y referencia */
  perimetroLayer = L.geoJSON(perimetro, {
    style: {
      color: '#0099e6',
      weight: 3,
      fill: false
    }
  }).addTo(map);

  map.fitBounds(perimetroLayer.getBounds());

  /* SECTORES */
  sectorLayer = L.geoJSON(sectores, {
    style: feat => ({
      color      : '#333',
      weight     : 2,
      fillColor  : sectorColors[feat.properties.SECTOR] || '#cccccc',
      fillOpacity: 0.35
    }),
    onEachFeature: (feat, layer) => {
      const nombre = feat.properties.SECTOR;
      layer.bindTooltip(nombre, { className: 'sector-label', direction: 'center' });
    }
  }).addTo(map);

  /* Popular el selector */
  const select = document.getElementById('sectorSelect');
  Object.keys(sectorColors).forEach(sec => {
    const opt = document.createElement('option');
    opt.value = sec;
    opt.textContent = sec;
    select.appendChild(opt);
  });

  /* CONSTRUCCIONES */
  construLayer = L.geoJSON(construcciones, {
    style: {
      color: '#e74c3c',
      weight: 1,
      fillColor: '#9b59b6',
      fillOpacity: 0.7
    }
  }).addTo(map);

  /* ENCUESTAS – puntos */
  encuestasLayer = L.geoJSON(encuestas, {
    pointToLayer: (feat, latlng) =>
      L.circleMarker(latlng, {
        radius       : 7,
        color        : '#1abc9c',
        weight       : 2,
        fillColor    : '#fff44f',
        fillOpacity  : 0.9
      })
      .bindPopup(`
        <strong>${feat.properties.Name || 'Encuesta'}</strong><br>
        Sector: ${feat.properties.SECTOR || 'n/d'}
      `)
  }).addTo(map);

  /* VÍAS */
  viasLayer = L.geoJSON(vias, {
    style: {
      color: '#d4a017',
      weight: 2
    }
  }).addTo(map);

  /* Evento del selector */
  select.addEventListener('change', e => {
    const val = e.target.value;
    sectorLayer.eachLayer(l => {
      const visible = (val === 'todos') || (l.feature.properties.SECTOR === val);
      l.setStyle({ opacity: visible ? 1 : 0, fillOpacity: visible ? 0.35 : 0 });
    });
  });
}

/* ----------  Controles personalizados  ---------- */
document.getElementById('homeBtn').onclick = () => {
  if (perimetroLayer) map.fitBounds(perimetroLayer.getBounds());
};

document.getElementById('basemapBtn').onclick = () => {
  if (currentBase === 'gray') {
    map.removeLayer(grayBase);
    colorBase.addTo(map);
    currentBase = 'color';
  } else {
    map.removeLayer(colorBase);
    grayBase.addTo(map);
    currentBase = 'gray';
  }
};

document.getElementById('infoBtn').onclick = () => {
  alert(
    'CONSTRUCCIÓN DE PAZ URBANA – La Fortaleza\n' +
    'Proyecto Orquídea # 109089, Minciencias\n' +
    'Pontificia Universidad Javeriana'
  );
};

/* Mover control de zoom a la derecha */
L.control.zoom({ position: 'topright' }).addTo(map);