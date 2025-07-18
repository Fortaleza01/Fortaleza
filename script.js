// Inicializar el mapa centrado en La Fortaleza
const mapa = L.map('map').setView([7.9089, -72.5026], 16);

// Fondo base
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(mapa);

// Colores únicos por sector
function colorPorSector(nombre) {
  const colores = {
    "ALTO DEL PADRE": "#d73027",
    "BRISAS PAZ Y FUTURO": "#fc8d59",
    "BUENA VISTA": "#fee08b",
    "BUENA VISTA PARCELA": "#d9ef8b",
    "EL MIRADOR": "#91cf60",
    "EL PARAISO": "#66bd63",
    "EL PLAN": "#1a9850",
    "LA ESCUELA": "#a6d96a",
    "LAS IGLESIAS": "#3288bd",
    "LOS PINOS": "#5e4fa2",
    "SAN MIGUEL": "#a6cee3"
  };
  return colores[nombre] || "#cccccc";
}

// Función para agregar capas
function agregarCapa(url, estilo, popupCampo) {
  fetch(url)
    .then(res => res.json())
    .then(data => {
      L.geoJSON(data, {
        style: estilo,
        pointToLayer: (feature, latlng) => {
          return L.circleMarker(latlng, estilo);
        },
        onEachFeature: (feature, layer) => {
          if (popupCampo && feature.properties[popupCampo]) {
            layer.bindPopup(`<strong>${popupCampo}:</strong> ${feature.properties[popupCampo]}`);
          }
        }
      }).addTo(mapa);
    });
}

// Cargar capas
agregarCapa('data/SECTORES.json', f => ({
  color: colorPorSector(f.properties.NOMBRESECT || ''),
  weight: 2,
  fillOpacity: 0.4
}), "NOMBRESECT");

agregarCapa('data/CONSTRUCCIONES.json', {
  radius: 2,
  fillColor: "#000000",
  color: "#000",
  weight: 0.3,
  opacity: 0.5,
  fillOpacity: 0.6
});

agregarCapa('data/VIAS.json', {
  color: "#f57c00",
  weight: 1
});

agregarCapa('data/ENCUESTAS.json', {
  radius: 3,
  fillColor: "#2a70d8",
  color: "#0d47a1",
  weight: 0.4,
  fillOpacity: 0.9
}, "SECTOR");

agregarCapa('data/PERIMETRO.json', {
  color: "#000000",
  weight: 2,
  dashArray: '4'
});

// Panel lateral
function togglePanel() {
  document.getElementById('panel').classList.toggle('visible');
}
function cerrarPanel() {
  document.getElementById('panel').classList.remove('visible');
}