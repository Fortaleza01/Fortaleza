/*  >>>  CONFIG  <<<  */
const coloresSector = {
  "EL PLAN"       : "#e63946",
  "EL MIRADOR"    : "#2a9d8f",
  "ALTO DEL PADRE": "#ffd166",
  "LOS PINOS"     : "#118ab2",
  "LAS IGLESIAS"  : "#ef476f",
  "EL PARAISO"    : "#06d6a0",
  "SAN MIGUEL"    : "#8338ec"
};
const basePositron =  L.tileLayer(
  "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
  { attribution:'&copy; <a href="https://carto.com/">CARTO</a>'}
);
const baseOSM = L.tileLayer(
  "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  { attribution:'&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>'}
);
let currentBase  = basePositron;

/*  >>>  MAP INIT  <<< */
const map = L.map("map", { zoomControl:true, layers:[currentBase] });
/* placeholder center; will be set properly after PERIMETRO llega */
map.setView([7.9039,-72.552],15);

/* GRUPOS */
const gSectores      = L.geoJSON(null, {
  style: feat => ({color:"#000",weight:1,fill:true,fillOpacity:.25,
                   fillColor: coloresSector[feat.properties.SECTOR]||"#888"}),
  onEachFeature: (f,l)=>l.bindPopup(`<b>Sector:</b> ${f.properties.SECTOR}`)
});
const gConstrucciones= L.geoJSON(null,{
  style:{color:"#e63946",weight:1,fillColor:"#8338ec",fillOpacity:.55}
});
const gEncuestas     = L.geoJSON(null,{
  pointToLayer:(f,latlng)=>L.circleMarker(latlng,{
    radius:4,weight:2,color:"#14d2dc",fillColor:"#f9ef23",fillOpacity:1
  }).bindPopup(`<b>Encuesta #${f.properties.COD_CASA}</b><br>Sector: ${f.properties.SECTOR}`)
});
const gVias = L.geoJSON(null,{style:{color:"#d9a509",weight:2}});

const gPerimetro = L.geoJSON(null,{
  style:{color:"#000",weight:2,dashArray:"4 2",fill:false}
}).on("data:loaded", e=>map.fitBounds(gPerimetro.getBounds()));

/* añadir a mapa  (orden z-index) */
gPerimetro.addTo(map);
gVias.addTo(map);
gConstrucciones.addTo(map);
gSectores.addTo(map);
gEncuestas.addTo(map);

/*  >>>  FETCHEAR  <<< */
Promise.all([
  fetch("SECTORES.json").then(r=>r.json()).then(j=>gSectores.addData(j)),
  fetch("CONSTRUCCIONES.json").then(r=>r.json()).then(j=>gConstrucciones.addData(j)),
  fetch("ENCUESTAS.json").then(r=>r.json()).then(j=>gEncuestas.addData(j)),
  fetch("VIAS.json").then(r=>r.json()).then(j=>gVias.addData(j)),
  fetch("PERIMETRO.json").then(r=>r.json()).then(j=>gPerimetro.addData(j))
]).then(()=>populateDrop())
  .catch(err=>alert("Error cargando datos: "+err));

/*  >>>  CONTROLES DOM  <<< */
const chkSect   = document.getElementById("chkSectores");
const chkVias   = document.getElementById("chkVias");
const chkConst  = document.getElementById("chkConstr");
const chkEnc    = document.getElementById("chkEncuestas");
chkSect.onchange = ()=>toggleLayer(gSectores,chkSect.checked);
chkVias.onchange = ()=>toggleLayer(gVias,chkVias.checked);
chkConst.onchange= ()=>toggleLayer(gConstrucciones,chkConst.checked);
chkEnc.onchange  = ()=>toggleLayer(gEncuestas,chkEnc.checked);

function toggleLayer(grp,show){ show? grp.addTo(map): map.removeLayer(grp); }

/*  filtro sector  */
const selSector  = document.getElementById("selSector");
function populateDrop(){
  /* llena el <select> con los nombres únicos */
  const nombres = new Set(gSectores.toGeoJSON().features.map(f=>f.properties.SECTOR));
  nombres.forEach(n=>{
    const opt=document.createElement("option"); opt.value=n; opt.textContent=n;
    selSector.appendChild(opt);
  });
}
selSector.onchange = ()=>{
  const val = selSector.value;
  gSectores.eachLayer(l=>l.setStyle({fillOpacity:(val==="__all__"||l.feature.properties.SECTOR===val)?0.25:0}));
  gEncuestas.eachLayer(l=>{
    const sector = l.feature.properties.SECTOR;
    (val==="__all__"||sector===val)? l.addTo(map): map.removeLayer(l);
  });
};

/* centrar */
document.getElementById("btnCenter").onclick = ()=>map.fitBounds(gPerimetro.getBounds());

/* cambiar base */
document.getElementById("btnBase").onclick = ()=>{
  map.removeLayer(currentBase);
  currentBase = (currentBase===basePositron)? baseOSM: basePositron;
  map.addLayer(currentBase);
};

/* info modal */
const modal = document.getElementById("infoModal");
document.getElementById("btnInfo").onclick = ()=>modal.style.display="block";
document.getElementById("closeModal").onclick = ()=>modal.style.display="none";
window.addEventListener("click",e=>{if(e.target===modal) modal.style.display="none"});

/* sidebar toggle */
const sidebar = document.getElementById("sidebar");
document.getElementById("toggleSidebar").onclick = ()=>{
  sidebar.classList.toggle("closed");
  sidebar.classList.toggle("open");
};