const map = L.map("map").setView([7.8998, -72.5487], 17);

// Base OpenStreetMap
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: '© OpenStreetMap contributors'
}).addTo(map);

// Colores por sector
const sectorColors = {
  "ALTO DEL PADRE": "#e41a1c",
  "BRISAS PAZ Y FUTURO": "#377eb8",
  "BUENA VISTA": "#4daf4a",
  "BUENA VISTA PARCELA": "#984ea3",
  "EL MIRADOR": "#ff7f00",
  "EL PARAISO": "#ffff33",
  "EL PLAN": "#a65628",
  "LA ESCUELA": "#f781bf",
  "LAS IGLESIAS": "#999999",
  "LOS PINOS": "#66c2a5",
  "SAN MIGUEL": "#d95f02"
};

// Almacena las capas
const capas = {};
const controlCapas = L.control.layers(null, null, { collapsed: false }).addTo(map);

// Carga Perímetro
fetch("data/PERIMETRO.json")
  .then(res => res.json())
  .then(data => {
    const layer = L.geoJSON(data, {
      style: { color: "#000", weight: 2 }
    }).addTo(map);
    capas["Perímetro"] = layer;
    controlCapas.addOverlay(layer, "Perímetro");
  });

// Carga Sectores con color
let sectoresLayer;
fetch("data/SECTORES.json")
  .then(res => res.json())
  .then(data => {
    sectoresLayer = L.geoJSON(data, {
      style: feature => ({
        color: sectorColors[feature.properties.SECTOR] || "#888",
        weight: 1,
        fillOpacity: 0.4
      }),
      onEachFeature: (feature, layer) => {
        layer.bindPopup(`<strong>Sector:</strong> ${feature.properties.SECTOR}`);
      }
    }).addTo(map);
    capas["Sectores"] = sectoresLayer;
    controlCapas.addOverlay(sectoresLayer, "Sectores");
  });

// Carga Vías
fetch("data/VIAS.json")
  .then(res => res.json())
  .then(data => {
    const layer = L.geoJSON(data, {
      style: { color: "#f00", weight: 1 }
    }).addTo(map);
    capas["Vías"] = layer;
    controlCapas.addOverlay(layer, "Vías");
  });

// Carga Construcciones
let construccionesLayer;
fetch("data/CONSTRUCCIONES.json")
  .then(res => res.json())
  .then(data => {
    construccionesLayer = L.geoJSON(data, {
      style: feature => ({
        color: sectorColors[feature.properties.SECTOR] || "#aaa",
        weight: 0.5,
        fillOpacity: 0.7
      }),
      onEachFeature: (feature, layer) => {
        layer.bindPopup(`<strong>Construcción</strong><br>Sector: ${feature.properties.SECTOR}`);
      }
    }).addTo(map);
    capas["Construcciones"] = construccionesLayer;
    controlCapas.addOverlay(construccionesLayer, "Construcciones");
  });

// Carga Encuestas (círculos)
let encuestasLayer;
fetch("data/ENCUESTAS.json")
  .then(res => res.json())
  .then(data => {
    encuestasLayer = L.geoJSON(data, {
      pointToLayer: (feature, latlng) => {
        const color = sectorColors[feature.properties.SECTOR] || "#0074D9";
        return L.circleMarker(latlng, {
          radius: 4,
          fillColor: color,
          color: "#333",
          weight: 0.6,
          fillOpacity: 0.9
        });
      },
      onEachFeature: (feature, layer) => {
        layer.bindPopup(`
          <strong>Encuesta</strong><br>
          Sector: ${feature.properties.SECTOR}<br>
          Hogar: ${feature.properties.CODHOGAR || "N/A"}<br>
          Código: ${feature.properties.COD || "N/A"}
        `);
      }
    }).addTo(map);
    capas["Encuestas"] = encuestasLayer;
    controlCapas.addOverlay(encuestasLayer, "Encuestas");
  });

// Leyenda dinámica
const legend = L.control({ position: "bottomright" });
legend.onAdd = function () {
  const div = L.DomUtil.create("div", "legend");
  div.innerHTML += "<h4>Sectores</h4>";
  for (const sector in sectorColors) {
    div.innerHTML += `<i style="background:${sectorColors[sector]}"></i> ${sector}<br>`;
  }
  return div;
};
legend.addTo(map);

// Filtro por sector
document.getElementById("sectorSelect").addEventListener("change", e => {
  const sector = e.target.value;

  const filtrarCapa = (layer, archivo) => {
    fetch(`data/${archivo}`)
      .then(res => res.json())
      .then(data => {
        layer.clearLayers();
        const filtrado = sector === "TODOS" ? data.features :
          data.features.filter(f => f.properties.SECTOR === sector);
        layer.addData({ ...data, features: filtrado });
        if (sector !== "TODOS" && filtrado.length > 0) {
          map.fitBounds(L.geoJSON(filtrado).getBounds());
        }
      });
  };

  if (construccionesLayer) filtrarCapa(construccionesLayer, "CONSTRUCCIONES.json");
  if (encuestasLayer) filtrarCapa(encuestasLayer, "ENCUESTAS.json");
  if (sectoresLayer) filtrarCapa(sectoresLayer, "SECTORES.json");
});