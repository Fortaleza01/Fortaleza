# Fortalezaconst map = L.map("map").setView([7.8998, -72.5487], 16);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: '© OpenStreetMap contributors'
}).addTo(map);

const capas = {};
const controlCapas = L.control.layers(null, null, { collapsed: false }).addTo(map);

let construccionesLayer, encuestasLayer, sectoresLayer, perimetroLayer, viasLayer;

const archivos = [
  { nombre: "Perímetro", archivo: "data/PERIMETRO_FORTALEZA.json", color: "#000" },
  { nombre: "Sectores", archivo: "data/SECTORES_FORTALEZA.json", color: "#009688" },
  { nombre: "Vías", archivo: "data/VIAS_FORTALEZA.json", color: "#f00" },
  { nombre: "Construcciones", archivo: "data/CONSTRUCCIONES_FORTALEZA.json", color: "#999" },
  { nombre: "Encuestas", archivo: "data/ENCUESTAS_FORTALEZA.json", color: "#007bff" }
];

archivos.forEach(capa => {
  fetch(capa.archivo)
    .then(res => res.json())
    .then(data => {
      const layer = L.geoJSON(data, {
        style: { color: capa.color, weight: 1, fillOpacity: 0.5 },
        pointToLayer: (feature, latlng) => L.circleMarker(latlng, {
          radius: 4,
          fillColor: capa.color,
          color: "#000",
          weight: 0.5,
          opacity: 1,
          fillOpacity: 0.8
        })
      }).addTo(map);
      capas[capa.nombre] = layer;
      controlCapas.addOverlay(layer, capa.nombre);

      if (capa.nombre === "Construcciones") construccionesLayer = layer;
      if (capa.nombre === "Encuestas") encuestasLayer = layer;
      if (capa.nombre === "Sectores") sectoresLayer = layer;
      if (capa.nombre === "Perímetro") perimetroLayer = layer;
      if (capa.nombre === "Vías") viasLayer = layer;
    });
});

// Leyenda
const legend = L.control({ position: "bottomright" });
legend.onAdd = function () {
  const div = L.DomUtil.create("div", "info legend");
  div.innerHTML += "<h4>Leyenda</h4>";
  div.innerHTML += '<i style="background: #000"></i> Perímetro<br>';
  div.innerHTML += '<i style="background: #009688"></i> Sectores<br>';
  div.innerHTML += '<i style="background: #f00"></i> Vías<br>';
  div.innerHTML += '<i style="background: #999"></i> Construcciones<br>';
  div.innerHTML += '<i style="background: #007bff"></i> Encuestas<br>';
  return div;
};
legend.addTo(map);

// Filtro
document.getElementById("sectorSelect").addEventListener("change", e => {
  const sector = e.target.value;

  // Construcciones
  construccionesLayer.clearLayers();
  fetch("data/CONSTRUCCIONES_FORTALEZA.json")
    .then(res => res.json())
    .then(data => {
      const filtrado = {
        ...data,
        features: sector === "TODOS" ? data.features :
          data.features.filter(f => f.properties.SECTOR === sector)
      };
      construccionesLayer.addData(filtrado);
    });

  // Encuestas
  encuestasLayer.clearLayers();
  fetch("data/ENCUESTAS_FORTALEZA.json")
    .then(res => res.json())
    .then(data => {
      const filtrado = {
        ...data,
        features: sector === "TODOS" ? data.features :
          data.features.filter(f => f.properties.SECTOR === sector)
      };
      encuestasLayer.addData(filtrado);
    });

  // Sectores + centrar
  sectoresLayer.clearLayers();
  fetch("data/SECTORES_FORTALEZA.json")
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

  // Perímetro
  perimetroLayer.clearLayers();
  fetch("data/PERIMETRO_FORTALEZA.json")
    .then(res => res.json())
    .then(data => {
      perimetroLayer.addData(data);
    });

  // Vías
  viasLayer.clearLayers();
  fetch("data/VIAS_FORTALEZA.json")
    .then(res => res.json())
    .then(data => {
      const filtrado = {
        ...data,
        features: sector === "TODOS" ? data.features :
          data.features.filter(f => f.properties.SECTOR === sector)
      };
      viasLayer.addData(filtrado);
    });
});