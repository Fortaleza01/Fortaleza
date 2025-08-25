function norm(str) {
  return (str || "").toString().trim().toUpperCase();
}
let map, basePositron, baseOSM, currentBase = "positron";
let panes = {}, layers = {}, sectorColors = {}, sectorNameDisplay = {}, sectorCenters = {};
let allConstrucciones = [], allEncuestas = [], totalSectores = 0;

document.addEventListener("DOMContentLoaded", init);

async function init() {
  map = L.map("map", { zoomControl: true });
  basePositron = L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", { attribution: "&copy; CartoDB" }).addTo(map);
  baseOSM = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "&copy; OpenStreetMap" });
  ["sectores","construcciones","vias","encuestas","perimetro"].forEach((name,i) => {
    panes[name] = map.createPane(name + "Pane");
    panes[name].style.zIndex = 200 + i * 100;
  });
  await loadAllData();
  wireUI();
  updateStatsGlobal();
  buildLegend();

  // Ocultar mensaje de bienvenida al cargar el mapa
  setTimeout(() => {
    const welcome = document.getElementById('map-welcome');
    if (welcome) welcome.style.display = 'none';
  }, 2000);

  // Gestión del menú lateral (sidebar)
  const toggleBtn = document.getElementById('toggle-sidebar');
  const sidebar = document.getElementById('sidebar');
  if (toggleBtn && sidebar) {
    toggleBtn.onclick = function() {
      if (sidebar.style.display === 'none' || getComputedStyle(sidebar).display === 'none') {
        sidebar.style.display = 'block';
        sidebar.setAttribute('tabindex', '-1');
        sidebar.focus();
      } else {
        sidebar.style.display = 'none';
      }
    };
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && sidebar.style.display !== 'none') {
        sidebar.style.display = 'none';
        toggleBtn.focus();
      }
    });
  }

  // Gestión del info-box desplegable
  const infoBox = document.getElementById('info-box');
  if (infoBox) {
    // Crear botón para mostrar/ocultar info-box
    const infoToggleBtn = document.createElement('button');
    infoToggleBtn.textContent = 'Mostrar/Ocultar información';
    infoToggleBtn.className = 'info-toggle-btn active';
    infoToggleBtn.setAttribute('aria-label', 'Mostrar u ocultar información del proyecto');
    infoBox.parentNode.insertBefore(infoToggleBtn, infoBox);

    // Animación y estado
    infoBox.style.transition = 'max-height 0.3s ease';
    infoBox.style.overflow = 'hidden';
    infoBox.style.maxHeight = '400px';
    let infoVisible = true;

    infoToggleBtn.onclick = function() {
      infoVisible = !infoVisible;
      infoBox.style.maxHeight = infoVisible ? '400px' : '0';
      infoToggleBtn.classList.toggle('active', infoVisible);
      infoToggleBtn.classList.toggle('inactive', !infoVisible);
    };

    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && infoVisible) {
        infoVisible = false;
        infoBox.style.maxHeight = '0';
        infoToggleBtn.classList.remove('active');
        infoToggleBtn.classList.add('inactive');
        infoToggleBtn.focus();
      }
    });
  }
}

async function loadAllData() {
  const [perimetro, sectores, construcciones, encuestas, vias] = await Promise.all([
    fetch("data/PERIMETRO.json").then(r => r.json()),
    fetch("data/SECTORES.json").then(r => r.json()),
    fetch("data/CONSTRUCCIONES.json").then(r => r.json()),
    fetch("data/ENCUESTAS.json").then(r => r.json()),
    fetch("data/VIAS.geojson").then(r => r.json())
  ]);
  layers.perimetro = L.geoJSON(perimetro, {
    pane: "perimetroPane",
    style: { color: "#000", weight: 2, fillOpacity: 0 }
  }).addTo(map);
  map.fitBounds(layers.perimetro.getBounds());

  const palette = ["#f94144","#f3722c","#f8961e","#f9c74f","#90be6d","#43aa8b","#577590","#9d4edd","#ffb703"];
  let colorIdx = 0;
  layers.sectores = L.geoJSON(sectores, {
    pane: "sectoresPane",
    style: f => {
      const rawName = f.properties.SECTOR || f.properties.NOMBRESECT || "SIN NOMBRE";
      const key = norm(rawName);
      if (!sectorColors[key]) {
        sectorColors[key] = palette[colorIdx % palette.length];
        sectorNameDisplay[key] = rawName;
        colorIdx++;
      }
      return { color: "#333", weight: 1, fillColor: sectorColors[key], fillOpacity: 0.6 };
    },
    onEachFeature: (f, layer) => {
      const rawName = f.properties.SECTOR || f.properties.NOMBRESECT || "SIN NOMBRE";
      const key = norm(rawName);
      sectorCenters[key] = layer.getBounds().getCenter();
      layer.bindTooltip(rawName, { permanent: true, direction: "center", className: "sector-label" });
      layer.on("click", () => {
        map.fitBounds(layer.getBounds(), { padding: [20, 20] });
        document.getElementById("sector-filter").value = rawName;
        applySectorFilter(rawName);
      });
    }
  }).addTo(map);
  totalSectores = Object.keys(sectorColors).length;

  allConstrucciones = construcciones.features;
  layers.construcciones = L.geoJSON(construcciones, {
    pane: "construccionesPane",
    style: { color: "#e63946", weight: 1, fillColor: "#8338ec", fillOpacity: 0.7 }
  }).addTo(map);

  layers.vias = L.geoJSON(vias, { pane: "viasPane", style: { color: "#d9a509", weight: 2 } }).addTo(map);

  allEncuestas = encuestas.features;
  layers.encuestas = L.geoJSON(encuestas, {
    pane: "encuestasPane",
    pointToLayer: (f, latlng) => L.circleMarker(latlng, {
      radius: 7, fillColor: "#f9ef23", color: "#14d2dc", weight: 2, fillOpacity: 1
    })
  }).addTo(map);

  const sel = document.getElementById("sector-filter");
  Object.values(sectorNameDisplay).sort().forEach(name => {
    const opt = document.createElement("option");
    opt.value = name; opt.textContent = name;
    sel.appendChild(opt);
  });
}

function wireUI() {
  document.getElementById("center-map").onclick = () => {
    if (layers.perimetro) map.fitBounds(layers.perimetro.getBounds());
  };
  document.getElementById("switch-basemap").onclick = () => {
    if (currentBase === "positron") {
      map.removeLayer(basePositron); baseOSM.addTo(map); currentBase = "osm";
    } else {
      map.removeLayer(baseOSM); basePositron.addTo(map); currentBase = "positron";
    }
  };
  document.getElementById("cap-encuestas").onchange = e => toggleLayer(layers.encuestas, e.target.checked);
  document.getElementById("cap-vias").onchange = e => toggleLayer(layers.vias, e.target.checked);
  document.getElementById("cap-construcciones").onchange = e => toggleLayer(layers.construcciones, e.target.checked);
  document.getElementById("cap-sectores").onchange = e => toggleLayer(layers.sectores, e.target.checked);
  document.getElementById("sector-filter").onchange = e => applySectorFilter(e.target.value);
}

function toggleLayer(layer, show) {
  if (!layer) return;
  show ? layer.addTo(map) : map.removeLayer(layer);
}

function applySectorFilter(rawName) {
  const selNameNorm = norm(rawName), showAll = !rawName;
  if (layers.construcciones) {
    layers.construcciones.eachLayer(l => {
      const sec = norm(l.feature?.properties?.SECTOR || "");
      const match = showAll || sec === selNameNorm;
      l.setStyle({ opacity: match ? 1 : 0.1, fillOpacity: match ? 0.7 : 0.05 });
    });
  }
  if (layers.encuestas) {
    layers.encuestas.eachLayer(l => {
      const sec = norm(l.feature?.properties?.SECTOR || "");
      const match = showAll || sec === selNameNorm;
      l.setStyle({ opacity: match ? 1 : 0.1, fillOpacity: match ? 1 : 0.1 });
    });
  }
  if (layers.sectores) {
    layers.sectores.eachLayer(l => {
      const sec = norm(l.feature?.properties?.SECTOR || l.feature?.properties?.NOMBRESECT);
      l.setStyle({ fillOpacity: (showAll || sec === selNameNorm) ? 0.6 : 0.1 });
      if (sec === selNameNorm && !showAll) map.fitBounds(l.getBounds(), { padding: [20, 20] });
    });
  }
  showAll ? updateStatsGlobal() : updateStatsSector(selNameNorm);
}

function updateStatsGlobal() {
  document.getElementById("stats").innerHTML = `
    <strong>Estadísticas:</strong><br>
    Sectores: ${totalSectores}<br>
    Construcciones: ${allConstrucciones.length}<br>
    Encuestas: ${allEncuestas.length}`;
}

function updateStatsSector(keyNorm) {
  const name = sectorNameDisplay[keyNorm] || keyNorm;
  const c = allConstrucciones.filter(f => norm(f.properties?.SECTOR) === keyNorm).length;
  const e = allEncuestas.filter(f => norm(f.properties?.SECTOR) === keyNorm).length;
  document.getElementById("stats").innerHTML = `
    <strong>Sector: ${name}</strong><br>
    Construcciones: ${c}<br>
    Encuestas: ${e}`;
}

function buildLegend() {
  const list = document.getElementById("legend-list");
  list.innerHTML = "";
  Object.entries(sectorNameDisplay).sort((a,b)=>a[1].localeCompare(b[1],"es",{sensitivity:"base"})).forEach(([key, name]) => {
    const li = document.createElement("li");
    li.innerHTML = `<span style="background:${sectorColors[key]}"></span>${name}`;
    li.addEventListener("click", () => {
      layers.sectores.eachLayer(l => {
        const sec = norm(l.feature?.properties?.SECTOR || l.feature?.properties?.NOMBRESECT);
        if (sec === key) map.fitBounds(l.getBounds(), { padding: [20, 20] });
      });
    });
    li.addEventListener("dblclick", () => {
      document.getElementById("sector-filter").value = name;
      applySectorFilter(name);
    });
    list.appendChild(li);
  });
}