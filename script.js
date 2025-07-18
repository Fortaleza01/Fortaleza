/* ========= configuración ========== */
const coloresSectores = {
  "EL PLAN":      "#f94144",
  "EL MIRADOR":   "#f3722c",
  "LOS PINOS":    "#f9c74f",
  "ALTO DEL PADRE":"#90be6d",
  "EL PARAISO":   "#577590",
  "SAN MIGUEL":   "#277da1",
  "PAZ Y FUTURO": "#bc5090",
  "LAS IGLESIAS": "#ff6b6b"
};

/* ========= mapa ========== */
const mbGray = L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", { attribution:"© OpenStreetMap | CARTO", maxZoom:20 });
const mbOSM  = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{attribution:"© OpenStreetMap contributors",maxZoom:19});
let currentBase = mbGray;

const map = L.map("map",{layers:[currentBase],zoomSnap:0.5});
map.setView([7.9036,-72.5525],16);

/* ========= capas vacías ========= */
const gSectores      = L.geoJSON(null,   {style:estiloSector,onEachFeature:infoSector});
const gConstrucciones= L.geoJSON(null,   {style:estiloConstruccion});
const gVias          = L.geoJSON(null,   {style:estiloVias});
const gEncuestas     = L.geoJSON(null,   {pointToLayer:estiloEncuesta});

/* ========= carga de datos ========= */
Promise.all([
  fetch("SECTORES.json").then(r=>r.json()),
  fetch("CONSTRUCCIONES.json").then(r=>r.json()),
  fetch("VIAS.json").then(r=>r.json()),
  fetch("ENCUESTAS.json").then(r=>r.json())
]).then(([sect,cons,via,enc])=>{
  gSectores.addData(sect);
  gConstrucciones.addData(cons);
  gVias.addData(via);
  gEncuestas.addData(enc);

  /* añadir al mapa */
  gVias.addTo(map);
  gSectores.addTo(map);
  gConstrucciones.addTo(map);
  gEncuestas.addTo(map);

  /* fit bounds al perímetro general (primera capa) */
  map.fitBounds(gSectores.getBounds());

  /* poblar selector de sector */
  const sel=document.getElementById("sectorSelect");
  Object.keys(coloresSectores).forEach(n=>{
    const opt=document.createElement("option");
    opt.value=n;opt.textContent=n;sel.appendChild(opt);
  });
});

/* ========= estilos ========= */
function estiloSector(f){
  const col=coloresSectores[f.properties.SECTOR]||"#999";
  return {color:col,weight:1,fillOpacity:.15};
}
function estiloConstruccion(){
  return {color:var_css("--rojo"),weight:.5,fillColor:var_css("--morado"),fillOpacity:.55};
}
function estiloVias(){
  return {color:var_css("--amarillo-vias"),weight:2};
}
function estiloEncuesta(f,latlng){
  return L.circleMarker(latlng,{
    radius:7,
    color:var_css("--turquesa"),
    weight:1,
    fillColor:var_css("--amarillo-limon"),
    fillOpacity:.9
  }).bindPopup(`<div class="infoPopup"><b>Casa #${f.properties.COD_CASA}</b><br>Sector: ${f.properties.SECTOR}<br>Tipo de pared: ${f.properties['CUAL_ES_EL']||'–'}</div>`);
}

/* ========== utilidades ========== */
function var_css(name){return getComputedStyle(document.documentElement).getPropertyValue(name);}

/* ========== UI controles ========== */
document.getElementById("btnToggle").onclick=()=>document.getElementById("panel").classList.toggle("closed");
document.getElementById("btnCentrar").onclick=()=>map.fitBounds(gSectores.getBounds());
document.getElementById("btnBase").onclick=()=>{
  map.removeLayer(currentBase);
  currentBase = currentBase===mbGray ? mbOSM : mbGray;
  map.addLayer(currentBase);
};
document.getElementById("btnInfo").onclick=()=>alert("Visor experimental – versión 2025.\nDatos: Proyecto Orquídea # 109089");
document.getElementById("sectorSelect").onchange=e=>{
  const val=e.target.value;
  gSectores.setStyle(s=>({opacity: val&&s.properties.SECTOR!==val ? .1:1, fillOpacity: val&&s.properties.SECTOR!==val ? .03:.15}));
  gConstrucciones.setStyle(s=>({opacity: val&&s.properties.SECTOR!==val ? .05:1, fillOpacity: val&&s.properties.SECTOR!==val ? .03:.55}));
  gEncuestas.eachLayer(l=>{ const ok=!val||l.feature.properties.SECTOR===val; l.setStyle({opacity:ok?1:.1,fillOpacity:ok?.9:.05});});
};