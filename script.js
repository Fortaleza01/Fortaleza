const map = L.map("map").setView([7.8998, -72.5487], 16);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: '© OpenStreetMap contributors'
}).addTo(map);

// Colores únicos por sector
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
  "LOS PINOS": "#1f78b4",
  "SAN MIGUEL": "#d95f02"
};

const capas = {};
const controlCapas = L.control.layers(null, null, { collapsed: false }).addTo(map);

let construccionesLayer, encuestasLayer, sectoresLayer, perimetroLayer, viasLayer;

const archivos = [
  { nombre: "Perímetro", archivo: "data/PERIMETRO.json", tipo: "polygon" },
  { nombre: "Sectores", archivo: "data/SECTORES.json", tipo: "sector" },
  { nombre: "Vías", archivo: "data/VIAS.json", tipo: "line", color: "#f00" },
  { nombre: "Construcciones", archivo: "data/CONSTRUCCIONES.json", tipo: "point", color: "#888" },
  { nombre: "Encuestas", archivo: "data/ENCUESTAS.json", tipo: "point", color: "#e67e22" }
];

// Carga capas
archivos.forEach(capa => {
  fetch(capa.archivo)
    .then(res => res.json())
    .then(data => {
      let layer;

      if (capa.tipo === "sector") {
        layer = L.geoJSON(data, {
          style: f => ({
            color: "#555",
            fillColor: sectorColors[f.properties.SECTOR] || "#ccc",
            weight: 1,
            fillOpacity: 0.6
          }),
          onEachFeature: (f, l) => {
            l.bindPopup(`<strong>Sector:</strong> ${f.properties.SECTOR}`);
          }
        });
        sectoresLayer = layer;
      }

      else if (capa.tipo === "polygon") {
        layer = L.geoJSON(data, {
          style: { color: "#000", weight: 2, fillOpacity: 0.1 },
          onEachFeature: (f, l) => {
            l.bindPopup("Límite de estudio");
          }
        });
        perimetroLayer = layer;
      }

      else if (capa.tipo === "line") {
        layer = L.geoJSON(data, {
          style: { color: capa.color || "#333", weight: 1.5 },
          onEachFeature: (f, l) => {
            l.bindPopup(`<strong>Vía</strong><br>Sector: ${f.properties.SECTOR}`);
          }
        });
        viasLayer = layer;
      }

      else if (capa.tipo === "point") {
        layer = L.geoJSON(data, {
          pointToLayer: (f, latlng) => L.circleMarker(latlng, {
            radius: 4,
            fillColor: capa.color || "#007bff",
            color: "#000",
            weight: 0.5,
            fillOpacity: 0.85
          }),
          onEachFeature: (f, l) => {
            const props = f.properties;
            let content = capa.nombre === "Encuestas" ?
              `<strong>Encuesta</strong><br>Sector: ${props.SECTOR}<br>Dirección: ${props.DIRECCION || "Sin dato"}` :
              `<strong>Construcción</strong><br>Sector: ${props.SECTOR}`;
            l.bindPopup(content);
          }
        });
        if (capa.nombre === "Encuestas") encuestasLayer = layer;
        if (capa.nombre === "Construcciones") construccionesLayer = layer;
      }

      layer.addTo(map);
      capas[capa.nombre] = layer;
      controlCapas.addOverlay(layer, capa.nombre);
    });
});

// Filtro por sector
document.getElementById("sectorSelect").addEventListener("change", e => {
  const sector = e.target.value;

  // Filtrar construcciones
  fetch("data/CONSTRUCCIONES.json")
    .then(res => res.json())
    .then(data => {
      construccionesLayer.clearLayers();
      const features = sector === "TODOS" ? data.features :
        data.features.filter(f => f.properties.SECTOR === sector);
      construccionesLayer.addData({ ...data, features });
    });

  // Filtrar encuestas
  fetch("data/ENCUESTAS.json")
    .then(res => res.json())
    .then(data => {
      encuestasLayer.clearLayers();
      const features = sector === "TODOS" ? data.features :
        data.features.filter(f => f.properties.SECTOR === sector);
      encuestasLayer.addData({ ...data, features });
    });

  // Filtrar sectores
  fetch("data/SECTORES.json")
    .then(res => res.json())
    .then(data => {
      sectoresLayer.clearLayers();
      const features = sector === "TODOS" ? data.features :
        data.features.filter(f => f.properties.SECTOR === sector);
      sectoresLayer.addData({ ...data, features });

      if (sector !== "TODOS" && features.length > 0) {
        const bounds = L.geoJSON({ ...data, features }).getBounds();
        map.fitBounds(bounds);
      } else {
        map.setView([7.8998, -72.5487], 16);
      }
    });

  // Filtrar vías
  fetch("data/VIAS.json")
    .then(res => res.json())
    .then(data => {
      viasLayer.clearLayers();
      const features = sector === "TODOS" ? data.features :
        data.features.filter(f => f.properties.SECTOR === sector);
      viasLayer.addData({ ...data, features });
    });

  // Perímetro permanece constante
  fetch("data/PERIMETRO.json")
    .then(res => res.json())
    .then(data => {
      perimetroLayer.clearLayers();
      perimetroLayer.addData(data);
    });
});

// Leyenda dinámica
const legend = L.control({ position: "bottomright" });
legend.onAdd = function () {
  const div = L.DomUtil.create("div", "info legend");
  div.innerHTML += "<h4>Sectores</h4>";
  for (const [nombre, color] of Object.entries(sectorColors)) {
    div.innerHTML += `<i style="background:${color}"></i> ${nombre}<br>`;
  }
  return div;
};
legend.addTo(map);