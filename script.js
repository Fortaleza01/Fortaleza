let map;
let baseLayer;
let baseAlternativo;
let currentBase = 0;
let capas = {};
let boundsPerimetro;

function initMap() {
  map = L.map("map", {
    zoomControl: true,
  });

  baseLayer = L.tileLayer(
    "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    {
      attribution: "&copy; CartoDB",
    }
  ).addTo(map);

  baseAlternativo = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png");

  cargarCapas();

  document.getElementById("center-map").onclick = () => {
    if (boundsPerimetro) map.fitBounds(boundsPerimetro);
  };

  document.getElementById("switch-basemap").onclick = () => {
    if (currentBase === 0) {
      map.removeLayer(baseLayer);
      baseAlternativo.addTo(map);
      currentBase = 1;
    } else {
      map.removeLayer(baseAlternativo);
      baseLayer.addTo(map);
      currentBase = 0;
    }
  };

  document.getElementById("sector-filter").onchange = filtrarSector;
}

async function cargarCapas() {
  const [sectores, vias, construcciones, encuestas, perimetro] = await Promise.all([
    fetch("data/SECTORES.json").then((res) => res.json()),
    fetch("data/VIAS.geojson").then((res) => res.json()),
    fetch("data/CONSTRUCCIONES.json").then((res) => res.json()),
    fetch("data/ENCUESTAS.json").then((res) => res.json()),
    fetch("data/PERIMETRO.json").then((res) => res.json()),
  ]);

  const perimLayer = L.geoJSON(perimetro, {
    style: { color: "#000", weight: 2, fill: false },
  }).addTo(map);
  boundsPerimetro = perimLayer.getBounds();
  map.fitBounds(boundsPerimetro);

  const colores = {};
  const uniqueNames = new Set();
  const sectorLayer = L.geoJSON(sectores, {
    style: (f) => {
      const nombre = f.properties.SECTOR || f.properties.NOMBRESECT;
      if (!colores[nombre]) colores[nombre] = randomColor();
      return {
        color: "#333",
        weight: 1,
        fillColor: colores[nombre],
        fillOpacity: 0.5,
      };
    },
    onEachFeature: (f, l) => {
      const nombre = f.properties.SECTOR || f.properties.NOMBRESECT;
      l.bindTooltip(nombre);
      uniqueNames.add(nombre);
    },
  });
  capas["sectores"] = sectorLayer.addTo(map);

  capas["vias"] = L.geoJSON(vias, {
    style: { color: "#d9a509", weight: 2 },
  }).addTo(map);

  capas["construcciones"] = L.geoJSON(construcciones, {
    style: {
      color: "#e63946",
      fillColor: "#8338ec",
      weight: 1,
      fillOpacity: 0.6,
    },
  }).addTo(map);

  capas["encuestas"] = L.geoJSON(encuestas, {
    pointToLayer: (f, latlng) =>
      L.circleMarker(latlng, {
        radius: 7,
        fillColor: "#f9ef23",
        color: "#14d2dc",
        weight: 2,
        fillOpacity: 0.8,
      }),
  }).addTo(map);

  ["sectores", "vias", "construcciones", "encuestas"].forEach((layerId) => {
    document.getElementById(`toggle-${layerId}`).onchange = (e) => {
      const capa = capas[layerId];
      if (e.target.checked) capa.addTo(map);
      else map.removeLayer(capa);
    };
  });

  const selector = document.getElementById("sector-filter");
  [...uniqueNames].sort().forEach((nombre) => {
    const opt = document.createElement("option");
    opt.value = nombre;
    opt.textContent = nombre;
    selector.appendChild(opt);
  });
}

function filtrarSector(e) {
  const val = e.target.value;

  ["construcciones", "encuestas"].forEach((layerId) => {
    capas[layerId].eachLayer((l) => {
      const s = l.feature.properties.SECTOR?.toUpperCase() || "";
      if (!val || s === val.toUpperCase()) {
        l.setStyle?.({ opacity: 1, fillOpacity: 0.6 });
        l.setStyle?.({ opacity: 1 });
        l.setRadius?.(7);
        l.addTo(map);
      } else {
        map.removeLayer(l);
      }
    });
  });

  capas["sectores"].eachLayer((l) => {
    const s = l.feature.properties.SECTOR || l.feature.properties.NOMBRESECT;
    if (!val || s === val) {
      l.setStyle({ fillOpacity: 0.5 });
      map.fitBounds(l.getBounds());
    } else {
      l.setStyle({ fillOpacity: 0.1 });
    }
  });
}

function randomColor() {
  const colores = ["#ff6b6b", "#4ecdc4", "#ffbe0b", "#3a86ff", "#8338ec", "#fb5607", "#6a4c93"];
  return colores[Math.floor(Math.random() * colores.length)];
}

document.addEventListener("DOMContentLoaded", () => {
  initMap();

  document.getElementById("toggle-panel").onclick = () =>
    document.getElementById("side-panel").classList.toggle("open");
});