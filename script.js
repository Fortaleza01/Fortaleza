const map = L.map("map").setView([7.8998, -72.5487], 16);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "© OpenStreetMap contributors"
}).addTo(map);

const sectorColors = {
  "ALTO DEL PADRE": "#FF6F61",
  "BRISAS PAZ Y FUTURO": "#6B5B95",
  "BUENA VISTA": "#88B04B",
  "BUENA VISTA PARCELA": "#F7CAC9",
  "EL MIRADOR": "#92A8D1",
  "EL PARAISO": "#955251",
  "EL PLAN": "#B565A7",
  "LA ESCUELA": "#009688",
  "LAS IGLESIAS": "#EFC050",
  "LOS PINOS": "#45B8AC",
  "SAN MIGUEL": "#2E4A62",
  "TODOS": "#AAAAAA"
};

const capas = {};
const controlCapas = L.control.layers(null, null, { collapsed: false }).addTo(map);

let construccionesLayer, encuestasLayer, sectoresLayer, perimetroLayer, viasLayer;

const archivos = [
  { nombre: "Perímetro", archivo: "data/PERIMETRO.json", color: "#000000" },
  { nombre: "Sectores", archivo: "data/SECTORES.json" },
  { nombre: "Vías", archivo: "data/VIAS.json", color: "#FF0000" },
  { nombre: "Construcciones", archivo: "data/CONSTRUCCIONES.json" },
  { nombre: "Encuestas", archivo: "data/ENCUESTAS.json" }
];

archivos.forEach(capa => {
  fetch(capa.archivo)
    .then(res => res.json())
    .then(data => {
      let layer;

      if (capa.nombre === "Sectores") {
        layer = L.geoJSON(data, {
          style: feature => ({
            color: sectorColors[feature.properties.SECTOR] || "#888",
            weight: 1,
            fillOpacity: 0.5
          })
        });
        sectoresLayer = layer;
      }

      else if (capa.nombre === "Construcciones") {
        layer = L.geoJSON(data, {
          pointToLayer: (feature, latlng) =>
            L.circleMarker(latlng, {
              radius: 3,
              fillColor: sectorColors[feature.properties.SECTOR] || "#666",
              color: "#000",
              weight: 0.5,
              fillOpacity: 0.8
            })
        });
        construccionesLayer = layer;
      }

      else if (capa.nombre === "Encuestas") {
        layer = L.geoJSON(data, {
          pointToLayer: (feature, latlng) =>
            L.circleMarker(latlng, {
              radius: 5,
              fillColor: "#007bff",
              color: "#000",
              weight: 0.5,
              fillOpacity: 0.8
            })
        });
        encuestasLayer = layer;
      }

      else {
        layer = L.geoJSON(data, {
          style: { color: capa.color || "#555", weight: 1, fillOpacity: 0.3 }
        });
        if (capa.nombre === "Perímetro") perimetroLayer = layer;
        if (capa.nombre === "Vías") viasLayer = layer;
      }

      capas[capa.nombre] = layer;
      layer.addTo(map);
      controlCapas.addOverlay(layer, capa.nombre);
    });
});

// Filtro por sector
document.getElementById("sectorSelect").addEventListener("change", e => {
  const sector = e.target.value;

  // Actualizar construcciones
  construccionesLayer.clearLayers();
  fetch("data/CONSTRUCCIONES.json")
    .then(res => res.json())
    .then(data => {
      const filtrado = {
        ...data,
        features: sector === "TODOS" ? data.features :
          data.features.filter(f => f.properties.SECTOR === sector)
      };
      construccionesLayer.addData(filtrado);
    });

  // Actualizar encuestas
  encuestasLayer.clearLayers();
  fetch("data/ENCUESTAS.json")
    .then(res => res.json())
    .then(data => {
      const filtrado = {
        ...data,
        features: sector === "TODOS" ? data.features :
          data.features.filter(f => f.properties.SECTOR === sector)
      };
      encuestasLayer.addData(filtrado);
    });

  // Actualizar sectores
  sectoresLayer.clearLayers();
  fetch("data/SECTORES.json")
    .then(res => res.json())
    .then(data => {
      const filtrado = {
        ...data,
        features: sector === "TODOS" ? data.features :
          data.features.filter(f => f.properties.SECTOR === sector)
      };
      sectoresLayer.addData(filtrado);

      if (sector !== "TODOS" && filtrado.features.length > 0) {
        const bounds = L.geoJSON(filtrado).getBounds();
        map.fitBounds(bounds);
      } else {
        map.setView([7.8998, -72.5487], 16);
      }
    });

  // Vías
  viasLayer.clearLayers();
  fetch("data/VIAS.json")
    .then(res => res.json())
    .then(data => {
      const filtrado = {
        ...data,
        features: sector === "TODOS" ? data.features :
          data.features.filter(f => f.properties.SECTOR === sector)
      };
      viasLayer.addData(filtrado);
    });

  // Perímetro (siempre igual)
  perimetroLayer.clearLayers();
  fetch("data/PERIMETRO.json")
    .then(res => res.json())
    .then(data => perimetroLayer.addData(data));
});

// Leyenda
const legend = L.control({ position: "bottomright" });
legend.onAdd = function () {
  const div = L.DomUtil.create("div", "info legend");
  div.innerHTML += "<h4>Sectores</h4>";
  Object.entries(sectorColors).forEach(([nombre, color]) => {
    if (nombre !== "TODOS") {
      div.innerHTML += `<i style="background:${color}"></i> ${nombre}<br>`;
    }
  });
  return div;
};
legend.addTo(map);