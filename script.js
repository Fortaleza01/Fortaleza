const map = L.map('map').setView([7.90, -72.50], 16);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

// Layer controls
const layers = {};
const urls = {
  perimetro: 'data/PERIMETRO.json',
  sectores: 'data/SECTORES.json',
  constru: 'data/CONSTRUCCIONES.json',
  vias: 'data/VIAS.json',
  encuestas: 'data/ENCUESTAS.json'
};

function loadGeo(label, styleOrPoint, popupProp) {
  fetch(urls[label]).then(r=>r.json()).then(data=>{
    layers[label] = L.geoJSON(data, {
      ...(typeof styleOrPoint === 'function' ? { style: styleOrPoint } : { pointToLayer: styleOrPoint }),
      onEachFeature: popupProp ? (f, l) => l.bindPopup(`${popupProp}: ${f.properties[popupProp]}`) : null
    }).addTo(map);
  });
}

// Load layers
loadGeo('perimetro', { color:'#ffdd00', weight:2, fillOpacity:0.1 });
loadGeo('sectores', f=>({ color:'#000', fillColor: styleColor(f.properties.SECTOR), fillOpacity:0.5, weight:1 }), 'SECTOR');
loadGeo('constru', (feature, latlng)=>L.circleMarker(latlng, { radius:4, fillColor:'#cc0000', color:'#000', weight:0.5, fillOpacity:0.7 }));
loadGeo('vias', { color:'#f57c00', weight:2 });
loadGeo('encuestas', (feature, latlng)=>L.circleMarker(latlng, { radius:5, fillColor:'#2a70d8', color:'#0d47a1', fillOpacity:0.9 }), 'SECTOR');

// Toggle panel
const panel = document.getElementById('panel');
document.getElementById('togglePanel').onclick = ()=>panel.classList.toggle('open');
document.getElementById('closePanel').onclick = ()=>panel.classList.remove('open');

// Tab switching
document.querySelectorAll('.tab').forEach(btn=>{
  btn.onclick=()=>{
    document.querySelectorAll('.tab').forEach(b=>b.classList.remove('active'));
    document.querySelectorAll('.tabcontent').forEach(c=>c.style.display='none');
    btn.classList.add('active');
    document.getElementById(btn.dataset.tab).style.display='block';
  };
});

// Checkbox listeners
['perimetro','sectores','constru','vias','encuestas'].forEach(id=>{
  document.getElementById('ck_'+id).onchange = function(){
    layers[id][this.checked?'addTo':'removeFrom'](map);
  };
});

// Utility color function
function styleColor(name) {
  const c = { 'ALTO DEL PADRE':'#f94144','BRISAS PAZ Y FUTURO':'#f3722c','BUENA VISTA':'#fee08b', /*...*/ };
  return c[name]||'#ccc';
}