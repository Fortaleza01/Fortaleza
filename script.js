/* script.js - Visor La Fortaleza */

/* ---------- Utilidades ---------- */

// Normaliza nombre de sector (mayúsculas, recorta espacios)
function norm(str){
  return (str || "").toString().trim().toUpperCase();
}

// Wait util
const sleep = ms => new Promise(r => setTimeout(r, ms));

/* ---------- Inicialización ---------- */

let map;
let basePositron, baseOSM, currentBase = "positron";
let panes = {};
let layers = {
  sectores:null,
  construcciones:null,
  vias:null,
  encuestas:null,
  perimetro:null
};
let sectorColors = {};          // {SECTOR_NORM: "#hex"}
let sectorNameDisplay = {};     // {SECTOR_NORM: "Nombre original"}
let sectorCenters = {};         // {SECTOR_NORM: LatLng}
let allConstrucciones = [];     // raw features
let allEncuestas = [];          // raw features
let totalSectores = 0;

document.addEventListener("DOMContentLoaded", init);

/* ---------- Init Map ---------- */
async function init(){
  map = L.map("map", {zoomControl:true});

  // Base maps
  basePositron = L.tileLayer(
    "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    {attribution:"&copy; CartoDB"}
  ).addTo(map);

  baseOSM = L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    {attribution:"&copy; OpenStreetMap"}
  );

  // Custom panes for z-order (higher zIndex on top)
  panes.sectores        = map.createPane("sectoresPane");        panes.sectores.style.zIndex = 200;
  panes.construcciones  = map.createPane("construccionesPane");  panes.construcciones.style.zIndex = 300;
  panes.vias            = map.createPane("viasPane");            panes.vias.style.zIndex = 400;
  panes.encuestas       = map.createPane("encuestasPane");       panes.encuestas.style.zIndex = 500;
  panes.perimetro       = map.createPane("perimetroPane");       panes.perimetro.style.zIndex = 600; // outline over everything

  await loadAllData();

  wireUI();
  updateStatsGlobal();
  buildLegend(); // after sectorColors assigned
}

/* ---------- Load Data ---------- */
async function loadAllData(){
  const [perimetro, sectores, construcciones, encuestas, vias] = await Promise.all([
    fetch("data/PERIMETRO.json").then(r=>r.json()),
    fetch("data/SECTORES.json").then(r=>r.json()),
    fetch("data/CONSTRUCCIONES.json").then(r=>r.json()),
    fetch("data/ENCUESTAS.json").then(r=>r.json()),
    fetch("data/VIAS.geojson").then(r=>r.json())
  ]);

  // Perímetro
  layers.perimetro = L.geoJSON(perimetro,{
    pane:"perimetroPane",
    style:{color:"#000",weight:2,fillOpacity:0}
  }).addTo(map);
  map.fitBounds(layers.perimetro.getBounds());

  // Sectores (bottom)
  const palette = ["#f94144","#f3722c","#f8961e","#f9c74f","#90be6d","#43aa8b","#577590","#9d4edd","#ffb703","#6a994e","#ef476f","#118ab2","#de3c4b","#ffb4a2"];
  let colorIdx=0;

  layers.sectores = L.geoJSON(sectores,{
    pane:"sectoresPane",
    style:f=>{
      const rawName = f.properties.SECTOR || f.properties.NOMBRESECT || "SIN NOMBRE";
      const key = norm(rawName);
      if(!sectorColors[key]){
        sectorColors[key] = palette[colorIdx % palette.length];
        sectorNameDisplay[key] = rawName;
        colorIdx++;
      }
      return {
        color:"#333",
        weight:1,
        fillColor:sectorColors[key],
        fillOpacity:0.6
      };
    },
    onEachFeature:(f,layer)=>{
      const rawName = f.properties.SECTOR || f.properties.NOMBRESECT || "SIN NOMBRE";
      const key = norm(rawName);
      // Centroid / center for label & legend click
      const ctr = layer.getBounds().getCenter();
      sectorCenters[key] = ctr;
      // Label permanent
      layer.bindTooltip(rawName,{
        permanent:true,
        direction:"center",
        className:"sector-label"
      });
      // Click focus + select in filter
      layer.on("click",()=>{
        map.fitBounds(layer.getBounds());
        const sel = document.getElementById("sector-filter");
        sel.value = rawName;
        applySectorFilter(rawName);
      });
    }
  }).addTo(map);
  totalSectores = Object.keys(sectorColors).length;

  // Construcciones
  allConstrucciones = construcciones.features;
  layers.construcciones = L.geoJSON(construcciones,{
    pane:"construccionesPane",
    style:{
      color:"#e63946",
      weight:1,
      fillColor:"#8338ec",
      fillOpacity:0.7
    }
  }).addTo(map);

  // Vías
  layers.vias = L.geoJSON(vias,{
    pane:"viasPane",
    style:{color:"#d9a509",weight:2}
  }).addTo(map);

  // Encuestas
  allEncuestas = encuestas.features;
  layers.encuestas = L.geoJSON(encuestas,{
    pane:"encuestasPane",
    pointToLayer:(f,latlng)=>L.circleMarker(latlng,{
      radius:7,
      fillColor:"#f9ef23",
      color:"#14d2dc",
      weight:2,
      fillOpacity:1
    })
  }).addTo(map);

  // Poblar selector de sectores
  const sel = document.getElementById("sector-filter");
  Object.values(sectorNameDisplay)
    .sort((a,b)=>a.localeCompare(b,"es",{sensitivity:"base"}))
    .forEach(name=>{
      const opt = document.createElement("option");
      opt.value = name;
      opt.textContent = name;
      sel.appendChild(opt);
    });
}

/* ---------- UI Events ---------- */
function wireUI(){
  // Panel plegable
  const sidebar = document.getElementById("sidebar");
  const btn = document.getElementById("toggle-panel");
  btn.addEventListener("click",()=>{
    const closed = sidebar.classList.toggle("closed");
    btn.setAttribute("aria-expanded",!closed);
  });

  // Botones
  document.getElementById("center-map").onclick = ()=>{
    if(layers.perimetro) map.fitBounds(layers.perimetro.getBounds());
  };

  document.getElementById("switch-basemap").onclick = ()=>{
    if(currentBase==="positron"){
      map.removeLayer(basePositron);
      baseOSM.addTo(map);
      currentBase="osm";
    }else{
      map.removeLayer(baseOSM);
      basePositron.addTo(map);
      currentBase="positron";
    }
  };

  // Modal Info
  document.getElementById("info-button").onclick = ()=>document.getElementById("info-modal").classList.remove("hidden");
  document.getElementById("close-info").onclick = ()=>document.getElementById("info-modal").classList.add("hidden");

  // Checkboxes (order: encuestas, vias, construcciones, sectores)
  document.getElementById("cap-encuestas").onchange = e=>toggleLayer(layers.encuestas,e.target.checked);
  document.getElementById("cap-vias").onchange = e=>toggleLayer(layers.vias,e.target.checked);
  document.getElementById("cap-construcciones").onchange = e=>toggleLayer(layers.construcciones,e.target.checked);
  document.getElementById("cap-sectores").onchange = e=>{
    toggleLayer(layers.sectores,e.target.checked);
    // También ocultar/mostrar etiquetas (tooltips permanentes)
    const show = e.target.checked;
    if(layers.sectores){
      layers.sectores.eachLayer(l=>{
        const tt = l.getTooltip();
        if(tt){
          show?tt._source.openTooltip():map.closeTooltip(tt);
        }
      });
    }
  };

  // Selector de sector
  document.getElementById("sector-filter").addEventListener("change", e=>{
    applySectorFilter(e.target.value);
  });
}

/* ---------- Layer visibility ---------- */
function toggleLayer(layer,show){
  if(!layer) return;
  if(show) layer.addTo(map);
  else map.removeLayer(layer);
}

/* ---------- Sector Filtering ---------- */
function applySectorFilter(rawName){
  const selNameNorm = norm(rawName);
  const showAll = !rawName;

  // Construcciones -> atenuar
  if(layers.construcciones){
    layers.construcciones.eachLayer(l=>{
      const sec = norm(l.feature?.properties?.SECTOR || "");
      const match = showAll || sec===selNameNorm;
      l.setStyle({
        opacity:match?1:0.1,
        fillOpacity:match?0.7:0.05
      });
    });
  }

  // Encuestas -> atenuar
  if(layers.encuestas){
    layers.encuestas.eachLayer(l=>{
      const sec = norm(l.feature?.properties?.SECTOR || "");
      const match = showAll || sec===selNameNorm;
      l.setStyle({
        opacity:match?1:0.1,
        fillOpacity:match?1:0.1
      });
    });
  }

  // Sectores -> resaltar
  if(layers.sectores){
    layers.sectores.eachLayer(l=>{
      const sec = norm(l.feature?.properties?.SECTOR || l.feature?.properties?.NOMBRESECT);
      l.setStyle({fillOpacity:(showAll||sec===selNameNorm)?0.6:0.1});
      if(sec===selNameNorm && !showAll){
        map.fitBounds(l.getBounds());
      }
    });
  }

  // Actualizar stats
  if(showAll) updateStatsGlobal();
  else updateStatsSector(selNameNorm);
}

/* ---------- Stats ---------- */
function updateStatsGlobal(){
  const stats = document.getElementById("stats");
  stats.innerHTML = `
    <strong>Estadísticas:</strong><br>
    Sectores: ${totalSectores}<br>
    Construcciones: ${allConstrucciones.length}<br>
    Encuestas: ${allEncuestas.length}
  `;
}

function updateStatsSector(keyNorm){
  const name = sectorNameDisplay[keyNorm] || keyNorm;

  // Conteos por propiedad SECTOR (normalizada)
  const c = allConstrucciones.filter(f=>norm(f.properties?.SECTOR)===keyNorm).length;
  const e = allEncuestas.filter(f=>norm(f.properties?.SECTOR)===keyNorm).length;

  const stats = document.getElementById("stats");
  stats.innerHTML = `
    <strong>Sector: ${name}</strong><br>
    Construcciones: ${c}<br>
    Encuestas: ${e}
  `;
}

/* ---------- Legend ---------- */
function buildLegend(){
  const list = document.getElementById("legend-list");
  list.innerHTML = "";
  // Sort legend alphabetically by display name
  const entries = Object.entries(sectorNameDisplay).sort((a,b)=>a[1].localeCompare(b[1],"es",{sensitivity:"base"}));
  entries.forEach(([key,colorName])=>{
    const color = sectorColors[key];
    const li = document.createElement("li");
    li.innerHTML = `<span style="background:${color}"></span>${colorName}`;
    li.title = `Zoom al sector ${colorName}`;
    li.addEventListener("click",()=>{
      // Zoom al sector
      if(layers.sectores){
        layers.sectores.eachLayer(l=>{
          const sec = norm(l.feature?.properties?.SECTOR || l.feature?.properties?.NOMBRESECT);
          if(sec===key){
            map.fitBounds(l.getBounds(),{padding:[20,20]});
          }
        });
      }
    });
    // Alt+clic: filtra
    li.addEventListener("auxclick",()=>{});
    li.addEventListener("contextmenu",e=>e.preventDefault());
    li.addEventListener("dblclick",e=>{
      e.preventDefault();
      // activar filtro
      const sel = document.getElementById("sector-filter");
      sel.value = colorName;
      applySectorFilter(colorName);
    });
    list.appendChild(li);
  });
}