// Coordenadas centradas en el perímetro de La Fortaleza (Cúcuta)
const map = L.map('map').setView([7.9175, -72.497], 16);

// Mapa base en escala de grises
const grayscale = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
  attribution: '&copy; OpenStreetMap, &copy; CartoDB'
}).addTo(map);

// Estilos por capa
const sectorColors = [
  "#e6194b", "#3cb44b", "#ffe119", "#4363d8", "#f58231",
  "#911eb4", "#46f0f0", "#f032e6", "#bcf60c", "#fabebe",
  "#008080", "#e6beff", "#9a6324"
];

function styleSectores(feature) {
  return {
    color: "#333",
    weight: 1,
    fillColor: sectorColors[feature.properties.COD_SECTOR % sectorColors.length],
    fillOpacity: 0.5
  };
}

function styleConstrucciones(feature) {
  return {
    color: "#ff0000",     // borde rojo
    fillColor: "#800080", // relleno morado
    fillOpacity: 0.6,
    weight: 0.8
  };
}

function styleEncuestas(feature) {
  return {
    radius: 7,
    fillColor: "#ffff33", // amarillo limón
    color: "#40e0d0",      // borde turquesa
    weight: 1,
    opacity: 1,
    fillOpacity: 0.9
  };
}

function styleVias() {
  return {
    color: "#DAA520", // amarillo quemado
    weight: 1.5
  };
}

function stylePerimetro() {
  return {
    color: "#000",
    weight: 2,
    fill: false
  };
}

// Cargar capas GeoJSON
const capas = {};

// SECTORES
fetch('data/SECTORES.json')
  .then(res => res.json())
  .then(data => {
    capas.sectores = L.geoJSON(data, {
      style: styleSectores,
      onEachFeature: (feature, layer) => {
        layer.bindPopup(`<b>Sector:</b> ${feature.properties.NOMBRE}`);
      }
    }).addTo(map);
  });

// CONSTRUCCIONES
fetch('data/CONSTRUCCIONES.json')
  .then(res => res.json())
  .then(data => {
    capas.construcciones = L.geoJSON(data, {
      style: styleConstrucciones
    });
  });

// ENCUESTAS
fetch('data/ENCUESTAS.json')
  .then(res => res.json())
  .then(data => {
    capas.encuestas = L.geoJSON(data, {
      pointToLayer: (feature, latlng) => L.circleMarker(latlng, styleEncuestas()),
      onEachFeature: (feature, layer) => {
        layer.bindPopup(`<b>Encuesta:</b> ${feature.properties.ID}`);
      }
    });
  });

// VIAS
fetch('data/VIAS.json')
  .then(res => res.json())
  .then(data => {
    capas.vias = L.geoJSON(data, {
      style: styleVias
    });
  });

// PERÍMETRO
fetch('data/PERIMETRO.json')
  .then(res => res.json())
  .then(data => {
    capas.perimetro = L.geoJSON(data, {
      style: stylePerimetro
    }).addTo(map);
    map.fitBounds(capas.perimetro.getBounds());
  });

// Filtro de capas
document.getElementById('toggleSectores').addEventListener('change', function () {
  if (this.checked) {
    capas.sectores?.addTo(map);
  } else {
    map.removeLayer(capas.sectores);
  }
});

document.getElementById('toggleConstrucciones').addEventListener('change', function () {
  if (this.checked) {
    capas.construcciones?.addTo(map);
  } else {
    map.removeLayer(capas.construcciones);
  }
});

document.getElementById('toggleEncuestas').addEventListener('change', function () {
  if (this.checked) {
    capas.encuestas?.addTo(map);
  } else {
    map.removeLayer(capas.encuestas);
  }
});

document.getElementById('toggleVias').addEventListener('change', function () {
  if (this.checked) {
    capas.vias?.addTo(map);
  } else {
    map.removeLayer(capas.vias);
  }
});

document.getElementById('togglePerimetro').addEventListener('change', function () {
  if (this.checked) {
    capas.perimetro?.addTo(map);
  } else {
    map.removeLayer(capas.perimetro);
  }
});