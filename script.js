// Crear el mapa centrado en La Fortaleza, Cúcuta
var map = L.map('map').setView([7.903, -72.55], 16);

// Capa base de OpenStreetMap
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 20,
  attribution: '© OpenStreetMap contributors'
}).addTo(map);

// Estilos por capa
function estiloPerimetro() {
  return { color: '#000', weight: 2, fill: false };
}
function estiloSectores() {
  return { color: '#006400', weight: 1, fillColor: '#90ee90', fillOpacity: 0.3 };
}
function estiloVias() {
  return { color: '#ff0000', weight: 2 };
}
function estiloConstrucciones() {
  return { color: '#0000ff', weight: 0.5, fillColor: '#0000ff', fillOpacity: 0.6 };
}
function estiloEncuestas() {
  return { radius: 4, fillColor: '#ffa500', color: '#fff', weight: 1, opacity: 1, fillOpacity: 0.9 };
}

// Cargar y añadir capas GeoJSON
Promise.all([
  fetch('data/PERIMETRO.json').then(res => res.json()),
  fetch('data/SECTORES.json').then(res => res.json()),
  fetch('data/VIAS.json').then(res => res.json()),
  fetch('data/CONSTRUCCIONES.json').then(res => res.json()),
  fetch('data/ENCUESTAS.json').then(res => res.json())
]).then(([perimetro, sectores, vias, construcciones, encuestas]) => {
  const capaPerimetro = L.geoJSON(perimetro, { style: estiloPerimetro });
  const capaSectores = L.geoJSON(sectores, { style: estiloSectores });
  const capaVias = L.geoJSON(vias, { style: estiloVias });
  const capaConstrucciones = L.geoJSON(construcciones, { style: estiloConstrucciones });
  const capaEncuestas = L.geoJSON(encuestas, {
    pointToLayer: function (feature, latlng) {
      return L.circleMarker(latlng, estiloEncuestas());
    }
  });

  // Añadir capas al mapa
  capaPerimetro.addTo(map);
  capaSectores.addTo(map);
  capaVias.addTo(map);
  capaConstrucciones.addTo(map);
  capaEncuestas.addTo(map);

  // Control de capas
  var capasBase = {};
  var capasOverlay = {
    'Perímetro': capaPerimetro,
    'Sectores': capaSectores,
    'Vías': capaVias,
    'Construcciones': capaConstrucciones,
    'Encuestas': capaEncuestas
  };

  L.control.layers(capasBase, capasOverlay).addTo(map);
});