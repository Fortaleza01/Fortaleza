const map = L.map('map').setView([7.905, -72.505], 15);

const base1 = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
  attribution: '&copy; CartoDB'
}).addTo(map);

const base2 = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png');

let currentBase = 1;

// Referencias de capas
const capas = {
  sectores: null,
  construcciones: null,
  encuestas: null,
  vias: null,
  perimetro: null,
};

const colores = {};
const sectorLabels = {};
const palette = ['#f72585', '#b5179e', '#7209b7', '#560bad', '#480ca8', '#3a0ca3', '#3f37c9', '#4361ee', '#4895ef', '#4cc9f0', '#00b4d8', '#48cae4', '#90e0ef'];

function getColor(sector) {
  if (!colores[sector]) {
    colores[sector] = palette[Object.keys(colores).length % palette.length];
  }
  return colores[sector];
}

function loadGeojson(url, callback) {
  fetch(url).then(res => res.json()).then(data => callback(data));
}

// Cargar capas
loadGeojson('data/PERIMETRO.json', data => {
  capas.perimetro = L.geoJSON(data, {
    style: { color: '#000', weight: 2, fillOpacity: 0 }
  }).addTo(map);
  map.fitBounds(capas.perimetro.getBounds());
});

loadGeojson('data/SECTORES.json', data => {
  const nombres = new Set();
  capas.sectores = L.geoJSON(data, {
    style: f => ({
      color: '#000',
      weight: 1,
      fillColor: getColor(f.properties.SECTOR),
      fillOpacity: 0.6
    }),
    onEachFeature: (f, layer) => {
      const nombre = f.properties.SECTOR;
      nombres.add(nombre);

      layer.on('click', () => {
        map.fitBounds(layer.getBounds());
        document.getElementById('sectorSelect').value = nombre;
        filterBySector(nombre);
      });

      const center = layer.getBounds().getCenter();
      sectorLabels[nombre] = L.marker(center, {
        icon: L.divIcon({
          className: 'sector-label',
          html: `<b>${nombre}</b>`,
          iconSize: [100, 20]
        })
      }).addTo(map);
    }
  }).addTo(map);

  // Agregar al selector
  const sel = document.getElementById('sectorSelect');
  [...nombres].sort().forEach(n => {
    const opt = document.createElement('option');
    opt.value = n;
    opt.text = n;
    sel.appendChild(opt);
  });

  document.getElementById('stat-sectores').textContent = nombres.size;
});

loadGeojson('data/CONSTRUCCIONES.json', data => {
  capas.construcciones = L.geoJSON(data, {
    style: {
      color: '#e63946',
      weight: 1,
      fillColor: '#8338ec',
      fillOpacity: 0.7
    }
  }).addTo(map);
  document.getElementById('stat-construcciones').textContent = data.features.length;
});

loadGeojson('data/ENCUESTAS.json', data => {
  capas.encuestas = L.geoJSON(data, {
    pointToLayer: (f, latlng) => L.circleMarker(latlng, {
      radius: 7,
      color: '#14d2dc',
      weight: 2,
      fillColor: '#f9ef23',
      fillOpacity: 1
    })
  }).addTo(map);
  document.getElementById('stat-encuestas').textContent = data.features.length;
});

loadGeojson('data/VIAS.geojson', data => {
  capas.vias = L.geoJSON(data, {
    style: {
      color: '#d9a509',
      weight: 2
    }
  }).addTo(map);
});

// Controles
document.getElementById('sectores').onchange = e => toggleLayer(capas.sectores, e.target.checked, sectorLabels);
document.getElementById('construcciones').onchange = e => toggleLayer(capas.construcciones, e.target.checked);
document.getElementById('encuestas').onchange = e => toggleLayer(capas.encuestas, e.target.checked);
document.getElementById('vias').onchange = e => toggleLayer(capas.vias, e.target.checked);

document.getElementById('resetView').onclick = () => {
  if (capas.perimetro) map.fitBounds(capas.perimetro.getBounds());
};

document.getElementById('toggleBase').onclick = () => {
  if (currentBase === 1) {
    map.removeLayer(base1);
    base2.addTo(map);
    currentBase = 2;
  } else {
    map.removeLayer(base2);
    base1.addTo(map);
    currentBase = 1;
  }
};

document.getElementById('sectorSelect').onchange = e => {
  filterBySector(e.target.value);
};

function toggleLayer(layer, visible, labels = null) {
  if (!layer) return;
  if (visible) {
    map.addLayer(layer);
    if (labels) Object.values(labels).forEach(l => l.addTo(map));
  } else {
    map.removeLayer(layer);
    if (labels) Object.values(labels).forEach(l => map.removeLayer(l));
  }
}

function filterBySector(nombre) {
  if (nombre === 'Todos') {
    capas.construcciones?.eachLayer(l => l.setStyle({ opacity: 1, fillOpacity: 0.7 }));
    capas.encuestas?.eachLayer(l => l.setStyle({ opacity: 1, fillOpacity: 1 }));
    capas.sectores?.eachLayer(l => l.setStyle({ fillOpacity: 0.6 }));
    return;
  }

  capas.construcciones?.eachLayer(l => {
    const inside = capas.sectores?.getLayers().some(s => s.feature.properties.SECTOR === nombre && s.getBounds().contains(l.getBounds().getCenter()));
    l.setStyle({ opacity: inside ? 1 : 0.1, fillOpacity: inside ? 0.7 : 0.1 });
  });

  capas.encuestas?.eachLayer(l => {
    const inside = l.feature.properties.SECTOR === nombre;
    l.setStyle({ opacity: inside ? 1 : 0.1, fillOpacity: inside ? 1 : 0.1 });
  });

  capas.sectores?.eachLayer(l => {
    l.setStyle({ fillOpacity: l.feature.properties.SECTOR === nombre ? 0.6 : 0.1 });
  });
}

// Modal
document.getElementById('infoBtn').onclick = () => {
  document.getElementById('infoModal').style.display = 'block';
};
document.getElementById('closeInfo').onclick = () => {
  document.getElementById('infoModal').style.display = 'none';
};
// Agregar leyenda visual para sectores
function buildLegend() {
  const legend = document.getElementById('legend-list');
  legend.innerHTML = '';
  Object.entries(colores).forEach(([nombre, color]) => {
    const li = document.createElement('li');
    li.innerHTML = `<span style="background:${color}"></span>${nombre}`;
    legend.appendChild(li);
  });
}

setTimeout(buildLegend, 2000);  // Esperar carga de sectores
function buildLegend() {
  const legend = document.getElementById('legend-list');
  legend.innerHTML = '';
  Object.entries(colores).forEach(([nombre, color]) => {
    const li = document.createElement('li');
    li.innerHTML = `<span style="background:${color}"></span>${nombre}`;
    li.style.cursor = 'pointer';
    li.onclick = () => {
      geojsonSectores.eachLayer(layer => {
        if (layer.feature.properties.NOMBRESECT === nombre) {
          map.fitBounds(layer.getBounds(), { padding: [20, 20] });
        }
      });
    };
    legend.appendChild(li);
  });
}

setTimeout(buildLegend, 2000);  // Esperar carga completa de sectores