const map = L.map('map').setView([5.548, -73.354], 16);

// Mapa base
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 20,
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// Capas GeoJSON
const capas = {};

// Función para cargar cada archivo
function cargarGeoJSON(nombre, ruta, estilo, popupFunc) {
  fetch(ruta)
    .then(res => res.json())
    .then(data => {
      capas[nombre] = L.geoJSON(data, {
        style: estilo,
        onEachFeature: popupFunc
      }).addTo(map);
    })
    .catch(err => console.error(`Error cargando ${nombre}:`, err));
}

// Estilos
const estiloPerimetro = { color: 'black', weight: 2 };
const estiloVias = { color: 'gray', weight: 1 };
const estiloSectores = { color: '#FFA500', weight: 1, fillOpacity: 0.3 };
const estiloConstrucciones = { color: '#228B22', weight: 0.5, fillOpacity: 0.6 };
const estiloEncuestas = { color: '#1E90FF', radius: 5 };

// Carga
cargarGeoJSON("Perímetro", "data/PERIMETRO_FORTALEZA.json", estiloPerimetro);
cargarGeoJSON("Vías", "data/VIAS_FORTALEZA.json", estiloVias);
cargarGeoJSON("Sectores", "data/SECTORES_FORTALEZA.json", estiloSectores, (feature, layer) => {
  const nombre = feature.properties.NOMBRESECT || "Sector";
  layer.bindPopup(`<strong>${nombre}</strong>`);
  document.getElementById('sectorSelect').innerHTML += `<option value="${nombre}">${nombre}</option>`;
});
cargarGeoJSON("Construcciones", "data/CONSTRUCCIONES_FORTALEZA.json", estiloConstrucciones);
cargarGeoJSON("Encuestas", "data/ENCUESTAS_FORTALEZA.json", null, (feature, layer) => {
  layer.bindPopup(`<strong>ID:</strong> ${feature.properties.ID || 'N/A'}`);
});

// Filtro de sectores
document.getElementById('sectorSelect').addEventListener('change', function () {
  const valor = this.value;
  capas["Sectores"].eachLayer(layer => {
    const nombre = layer.feature.properties.NOMBRESECT;
    layer.setStyle({ fillOpacity: (valor === "TODOS" || valor === nombre) ? 0.3 : 0 });
  });
});