/* ----------  mapa base  ---------- */
const map = L.map('map', { zoomControl:false });
const baseGray = L.tileLayer(
  'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
  { attribution:'&copy; OSM & Carto', maxZoom:19 }
).addTo(map);
const baseColor = L.tileLayer(
  'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  { attribution:'&copy; OpenStreetMap', maxZoom:19 }
);
let grayIsOn = true;

/* ----------  paleta de sectores  ---------- */
const palette = {
  'EL PLAN'        : '#ff6666',
  'LOS PINOS'      : '#66c2ff',
  'EL MIRADOR'     : '#ffd966',
  'ALTO DEL PADRE' : '#b86ef5',
  'EL PARAISO'     : '#5cd65c',
  'PAZ Y FUTURO'   : '#ff8c1a',
  'SAN MIGUEL'     : '#ff66c2'
};

/* ----------  capas  ---------- */
let capaPerimetro, capaSectores, cConstru, cPuntos, cVias;

/* carga simultánea de geojson */
Promise.all([
  fetch('SECTORES.json').then(r=>r.json()),
  fetch('PERIMETRO.json').then(r=>r.json()),
  fetch('CONSTRUCCIONES.json').then(r=>r.json()),
  fetch('ENCUESTAS.json').then(r=>r.json()),
  fetch('VIAS.json').then(r=>r.json())
]).then(([gSectores,gPerim,gCons,gEncu,gVias]) => {

  capaPerimetro = L.geoJSON(gPerim,{
    style:{color:'#007ad6',weight:3,fill:false}
  }).addTo(map);
  map.fitBounds(capaPerimetro.getBounds());

  /* sectores */
  capaSectores = L.geoJSON(gSectores,{
    style:f=>({
      color:'#444',
      weight:2,
      fillColor: palette[f.properties.SECTOR]||'#ccc',
      fillOpacity:.35
    }),
    onEachFeature:(f,l)=>{
      l.bindTooltip(f.properties.SECTOR,{className:'sectorTT',direction:'center'});
    }
  }).addTo(map);

  /* desplegable */
  const sel = document.getElementById('sectorSel');
  Object.keys(palette).forEach(s=>{
    const o=document.createElement('option');
    o.value=s; o.textContent=s; sel.appendChild(o);
  });
  sel.onchange = e =>{
    const val=e.target.value;
    capaSectores.eachLayer(l=>{
      const ok = (val==='all') || (l.feature.properties.SECTOR===val);
      l.setStyle({opacity:ok?1:0,fillOpacity:ok?.35:0});
    });
  };

  /* construcciones */
  cConstru = L.geoJSON(gCons,{
    style:{color:'#e74c3c',weight:1,fillOpacity:.7,fillColor:'#9b59b6'}
  }).addTo(map);

  /* encuestas */
  cPuntos = L.geoJSON(gEncu,{
    pointToLayer:(f,ll)=>
      L.circleMarker(ll,{
        radius:6, weight:2, color:'#2ecc71',
        fillColor:'#fff44f', fillOpacity:.9
      }).bindPopup(`<b>${f.properties.Name||'Encuesta'}</b><br>Sector: ${f.properties.SECTOR||'n/d'}`)
  }).addTo(map);

  /* vías */
  cVias = L.geoJSON(gVias,{ style:{color:'#d4a017',weight:2} }).addTo(map);
});

/* ----------  botones  ---------- */
document.getElementById('homeBtn').onclick = ()=> capaPerimetro && map.fitBounds(capaPerimetro.getBounds());

document.getElementById('baseBtn').onclick = ()=>{
  if(grayIsOn){ map.removeLayer(baseGray); baseColor.addTo(map); }
  else        { map.removeLayer(baseColor); baseGray.addTo(map); }
  grayIsOn=!grayIsOn;
};

document.getElementById('aboutBtn').onclick = ()=> alert(
  'Visor «La Fortaleza»\nProyecto Orquídea #109089 – Minciencias\nPontificia Universidad Javeriana'
);

/* zoom a la derecha */
L.control.zoom({position:'topright'}).addTo(map);