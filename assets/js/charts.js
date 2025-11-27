import { API_URL } from './config.js';

function getHeaders(){
  return {
    'Content-Type':'application/json',
    'Authorization': 'Bearer ' + localStorage.getItem('access')
  };
}

async function cargarCharts(){
  // paises
  const res1 = await fetch(API_URL + '/calificaciones/resumen_por_pais/', { headers: getHeaders() });
  if (!res1.ok) return;
  const paises = await res1.json();
  const labels = paises.map(p=>p.pais);
  const valores = paises.map(p=>p.total);

  const ctx = document.getElementById('chartPaises');
  if (ctx) new Chart(ctx, { type:'bar', data:{ labels, datasets:[{ label:'Registros', data:valores }] } });

  // tipos: compute locally from calificaciones endpoint
  const res2 = await fetch(API_URL + '/calificaciones/', { headers: getHeaders() });
  if (!res2.ok) return;
  const data = await res2.json();
  const rows = data.results || data;
  const tipos = {};
  rows.forEach(r=>{
    tipos[r.tipo] = (tipos[r.tipo]||0) + 1;
  });
  const labels2 = Object.keys(tipos), vals2 = Object.values(tipos);
  const ctx2 = document.getElementById('chartTipos');
  if (ctx2) new Chart(ctx2, { type:'pie', data:{ labels: labels2, datasets:[{ data: vals2 }] } });

  // KPIs
  document.getElementById('kpi-total').textContent = 'Total: ' + (data.count || rows.length);
  document.getElementById('kpi-paises').textContent = 'Países: ' + labels.length;
  document.getElementById('kpi-tipos').textContent = 'Tipos: ' + labels2.length;

  // último log
  const res3 = await fetch(API_URL + '/logs/', { headers: getHeaders() });
  if (res3.ok){
    const logs = await res3.json();
    if (logs.length) document.getElementById('kpi-ultimolog').textContent = 'Último log: ' + logs[0].accion;
  }
}

document.addEventListener('DOMContentLoaded', cargarCharts);
