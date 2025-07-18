const map = L.map('map').setView([7.8886, -72.4942], 16);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19
}).addTo(map);

// Cargar capas GeoJSON
let sectorLayer, construLayer, encuestaLayer, viasLayer, perimetroLayer;

fetch('data/SECTORES.json')
  .then(res => res.json())
  .then(data => {
    sectorLayer = L.geoJSON(data, {
      style: feature => ({
        color: "#ffcc00",
        weight: 2,
        fillOpacity: 0.5
      }),
      onEachFeature: (feature, layer) => {
        layer.bindPopup(`Sector: ${feature.properties.NOMBRESECT || 'Sin nombre'}`);
      }
    }).addTo(map);
  });

fetch('data/CONSTRUCCIONES.json')
  .then(res => res.json())
  .then(data => {
    construLayer = L.geoJSON(data, {
      style: { color: "#d7191c", weight: 1, fillOpacity: 0.6 }
    }).addTo(map);
  });

fetch('data/ENCUESTAS.json')
  .then(res => res.json())
  .then(data => {
    encuestaLayer = L.geoJSON(data, {
      pointToLayer: (feature, latlng) =>
        L.circleMarker(latlng, {
          radius: 5,
          fillColor: "#2b83ba",
          color: "#2b83ba",
          weight: 1,
          opacity: 1,
          fillOpacity: 0.9
        })
    }).addTo(map);
  });

fetch('data/VIAS.json')
  .then(res => res.json())
  .then(data => {
    viasLayer = L.geoJSON(data, {
      style: { color: "#1a9641", weight: 2 }
    }).addTo(map);
  });

fetch('data/PERIMETRO.json')
  .then(res => res.json())
  .then(data => {
    perimetroLayer = L.geoJSON(data, {
      style: { color: "#000000", weight: 2, dashArray: '5, 5' }
    }).addTo(map);
  });

// Panel lateral
const openBtn = document.getElementById('openPanel');
const closeBtn = document.getElementById('closePanel');
const sidePanel = document.getElementById('sidePanel');

openBtn.addEventListener('click', () => sidePanel.classList.add('open'));
closeBtn.addEventListener('click', () => sidePanel.classList.remove('open'));

// Controles de visibilidad de capas
document.getElementById('toggleSectores').addEventListener('change', function () {
  this.checked ? map.addLayer(sectorLayer) : map.removeLayer(sectorLayer);
});
document.getElementById('toggleConstrucciones').addEventListener('change', function () {
  this.checked ? map.addLayer(construLayer) : map.removeLayer(construLayer);
});
document.getElementById('toggleEncuestas').addEventListener('change', function () {
  this.checked ? map.addLayer(encuestaLayer) : map.removeLayer(encuestaLayer);
});
document.getElementById('toggleVias').addEventListener('change', function () {
  this.checked ? map.addLayer(viasLayer) : map.removeLayer(viasLayer);
});
document.getElementById('togglePerimetro').addEventListener('change', function () {
  this.checked ? map.addLayer(perimetroLayer) : map.removeLayer(perimetroLayer);
});