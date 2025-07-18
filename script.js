/*────────────────  PARÁMETROS  ────────────────*/
const PALETTE = [
  "#ff6b6b","#f4a261","#ffd166","#06d6a0",
  "#4cc9f0","#4361ee","#8338ec","#ffbe0b",
  "#43aa8b","#f72585","#8d99ae","#ef476f"
];

const COLOR_VIAS  = "#d68c00";
const FILL_CONSTR = "#7e3ff2";
const STROKE_CONSTR = "#e63946";
const COLOR_PTS   = "#fff200";
const STROKE_PTS  = "#00c2c7";

const DATA = {
  perimetro : "data/PERIMETRO.json",
  sectores  : "data/SECTORES.json",
  vias      : "data/VIAS.json",
  construcciones : "data/CONSTRUCCIONES.json",
  encuestas : "data/ENCUESTAS.json"
};

/*────────────────  MAPA & BASEMAPS  ────────────*/
const baseGris = L.tileLayer(
  "https://stamen-tiles.a.ssl.fastly.net/toner-lite/{z}/{x}/{y}.png",
  { maxZoom: 20, attribution: "© Stamen & OSM" }
);

const baseColor = L.tileLayer(
  "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  { maxZoom: 20, attribution: "© OpenStreetMap" }
);

const map = L.map("map", {
  zoomControl: false,
  attributionControl: false,
  layers: [baseGris]
}).setView([7.9022, -72.5490], 16);

L.control.zoom({ position: "bottomleft" }).addTo(map);
L.control.attribution({ position: "bottomright", prefix: false }).addAttribution("© OpenStreetMap");

/*────────────────  CAPAS VACÍAS  ───────────────*/
const gPerim  = L.geoJSON(null).addTo(map);
const gSect   = L.geoJSON(null).addTo(map);
const gVias   = L.geoJSON(null).addTo(map);
const gConstr = L.geoJSON(null).addTo(map);
const gPts    = L.geoJSON(null).addTo(map);

/* Leyenda estática (excepto Sectores, que se autocompleta abajo) */
const legend = L.control({ position: "bottomright" });
legend.onAdd = () => {
  const div = L.DomUtil.create("div", "info legend");
  div.id = "leyenda";
  div.innerHTML = `
    <strong>Simbología</strong><br>
    <i style="background:${COLOR_VIAS}"></i> Vías<br>
    <i style="background:${FILL_CONSTR};border-color:${STROKE_CONSTR}"></i> Construcciones<br>
    <i style="background:${COLOR_PTS};border-color:${STROKE_PTS}"></i> Encuestas<br>
    <i style="background:#000"></i> Perímetro<br>
    <div id="leyendaSectores"></div>
  `;
  return div;
};
legend.addTo(map);

/*────────────────  CARGA DE GEOJSON  ───────────*/
Promise.all(
  Object.values(DATA).map(u => fetch(u).then(r => r.json()))
).then(([perim, sect, vias, constr, enc]) => {
  /* Perímetro */
  gPerim.addData(perim).setStyle({ color:"#000", weight:2, fillOpacity:0 });

  /* Sectores – color/label dinámico */
  const colorBySector = {};
  const leyendaSect = document.getElementById("leyendaSectores");
  sect.features.forEach((f,i) => {
    const nom = f.properties.SECTOR || f.properties.NOMBRESECT;
    const col = PALETTE[i % PALETTE.length];
    colorBySector[nom] = col;
    leyendaSect.innerHTML += `<i style="background:${col}"></i>${nom}<br>`;
    document.getElementById("sectorSelect").innerHTML += `<option>${nom}</option>`;
  });

  gSect.addData(sect).eachLayer(l => {
    const nom = l.feature.properties.SECTOR || l.feature.properties.NOMBRESECT;
    l.setStyle({ color:colorBySector[nom], fillColor:colorBySector[nom], weight:1, fillOpacity:0.25 });
    L.marker(l.getBounds().getCenter(), {
      icon: L.divIcon({ className:"sector-label", html: nom, iconSize:[80,20] }),
      interactive:false
    }).addTo(map);
  });

  /* Vías */
  gVias.addData(vias).setStyle({ color:COLOR_VIAS, weight:2 });

  /* Construcciones */
  gConstr.addData(constr).setStyle({
    color:STROKE_CONSTR, fillColor:FILL_CONSTR, weight:.8, fillOpacity:.65
  });

  /* Encuestas */
  gPts.addData(enc, {
    pointToLayer: (_,latlng)=>L.circleMarker(latlng,{
      radius:7, color:STROKE_PTS, weight:1,
      fillColor:COLOR_PTS, fillOpacity:.95
    })
  });

  /* Centrar mapa */
  map.fitBounds(gPerim.getBounds());
});

/*────────────────  FILTRA POR SECTOR  ──────────*/
document.getElementById("sectorSelect").addEventListener("change", e=>{
  const sel = e.target.value;

  /* Sectores visibles o atenuados */
  gSect.eachLayer(l=>{
    const nom = l.feature.properties.SECTOR || l.feature.properties.NOMBRESECT;
    const on = sel==="TODOS"||nom===sel;
    l.setStyle({ fillOpacity:on?0.25:0, opacity:on?1:0 });
  });

  /* Construcciones y Encuestas – recarga filtrada */
  ["construcciones","encuestas"].forEach(k=>{
    fetch(DATA[k]).then(r=>r.json()).then(gj=>{
      const sub = sel==="TODOS" ? gj.features :
        gj.features.filter(f=>f.properties.SECTOR===sel);
      k==="construcciones" ? gConstr.clearLayers().addData({...gj,features:sub}).setStyle({
        color:STROKE_CONSTR, fillColor:FILL_CONSTR, weight:.8, fillOpacity:.65})
      : gPts.clearLayers().addData({...gj,features:sub},{
          pointToLayer:(_,latlng)=>L.circleMarker(latlng,{
            radius:7,color:STROKE_PTS,weight:1,fillColor:COLOR_PTS,fillOpacity:.95})
        });
    });
  });

  /* Zoom automático */
  if(sel==="TODOS") map.fitBounds(gPerim.getBounds());
  else {
    const lyr=gSect.getLayers().find(l=>{
      const nom=l.feature.properties.SECTOR||l.feature.properties.NOMBRESECT;
      return nom===sel;
    });
    if(lyr) map.fitBounds(lyr.getBounds());
  }
});

/*────────────────  BOTONES TOOLBAR  ────────────*/
document.getElementById("btnHome").onclick = ()=> map.fitBounds(gPerim.getBounds());

let grisActivo = true;
document.getElementById("btnBasemap").onclick = ()=>{
  grisActivo ? map.removeLayer(baseGris).addLayer(baseColor)
             : map.removeLayer(baseColor).addLayer(baseGris);
  grisActivo = !grisActivo;
};

const info = document.getElementById("infoPanel");
document.getElementById("btnInfo").onclick   = ()=> info.classList.toggle("hidden");
document.getElementById("closeInfo").onclick = ()=> info.classList.add("hidden");