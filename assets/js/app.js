import { API_URL } from './config.js';

function getHeaders(){
  return {
    'Content-Type':'application/json',
    'Authorization': 'Bearer ' + localStorage.getItem('access')
  };
}

export function logout(){
  localStorage.removeItem('access');
  localStorage.removeItem('refresh');
  window.location.href = 'index.html';
}

document.getElementById?.('btnLogout')?.addEventListener('click', logout);
document.getElementById?.('btnReload')?.addEventListener('click', ()=>window.location.reload());

// cargar lista in calificaciones.html and dashboard
export async function cargarCalificacionesTable(){
  const resp = await fetch(API_URL + '/calificaciones/', { headers: getHeaders() });
  if (resp.status === 401) { logout(); return; }
  const data = await resp.json();
  const rows = data.results || data;
  const tbody_all = document.querySelectorAll('#tablaCalificaciones tbody');
  tbody_all.forEach(tbody=>{
    tbody.innerHTML = '';
    rows.forEach(item=>{
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${item.id}</td>
        <td>${item.pais}</td>
        <td>${item.tipo}</td>
        <td>${item.monto_base}</td>
        <td>${item.factor}</td>
        <td>${item.analista_username || item.analista}</td>
        <td>
          <a class="btn" href="editar.html?id=${item.id}">Editar</a>
          <button class="btn danger" data-id="${item.id}" onclick="borrar(${item.id})">Eliminar</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  });
}

window.cargarCalificacionesTable = cargarCalificacionesTable;

export async function borrar(id){
  if (!confirm('Eliminar registro?')) return;
  const resp = await fetch(API_URL + '/calificaciones/' + id + '/', {
    method:'DELETE', headers: getHeaders()
  });
  if (resp.status === 204 || resp.ok) {
    alert('Eliminado');
    cargarCalificacionesTable();
  } else {
    alert('No autorizado o error');
  }
}

async function cargarLogs(){
  const resp = await fetch(API_URL + '/logs/', { headers: getHeaders() });
  if (resp.status === 401) { logout(); return; }
  const data = await resp.json();
  const tbody = document.querySelector('#tablaLogs tbody');
  if (!tbody) return;
  tbody.innerHTML = '';
  data.forEach(item=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${item.usuario_username}</td><td>${item.accion}</td><td>${item.detalle}</td><td>${item.fecha_hora}</td>`;
    tbody.appendChild(tr);
  });
}
window.cargarLogs = cargarLogs;

// form crear
const formCrear = document.getElementById('formCrear');
if (formCrear){
  formCrear.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const payload = {
      pais: document.getElementById('pais').value,
      tipo: document.getElementById('tipo').value,
      monto_base: document.getElementById('monto_base').value,
      factor: document.getElementById('factor').value
    };
    const resp = await fetch(API_URL + '/calificaciones/', {
      method:'POST', headers:getHeaders(), body: JSON.stringify(payload)
    });
    if (resp.ok) {
      document.getElementById('msg').textContent = 'Creado correctamente';
      setTimeout(()=> location.href = 'calificaciones.html', 900);
    } else {
      document.getElementById('msg').textContent = 'Error o no autorizado';
    }
  });
}

// form editar
const formEditar = document.getElementById('formEditar');
if (formEditar){
  // leer id desde query
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  if (!id) location.href = 'calificaciones.html';
  (async ()=>{
    const resp = await fetch(API_URL + '/calificaciones/' + id + '/', { headers: getHeaders() });
    if (!resp.ok) { logout(); return; }
    const data = await resp.json();
    document.getElementById('edit_id').value = data.id;
    document.getElementById('edit_pais').value = data.pais;
    document.getElementById('edit_tipo').value = data.tipo;
    document.getElementById('edit_monto_base').value = data.monto_base;
    document.getElementById('edit_factor').value = data.factor;
  })();

  formEditar.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const id = document.getElementById('edit_id').value;
    const payload = {
      pais: document.getElementById('edit_pais').value,
      tipo: document.getElementById('edit_tipo').value,
      monto_base: document.getElementById('edit_monto_base').value,
      factor: document.getElementById('edit_factor').value
    };
    const resp = await fetch(API_URL + '/calificaciones/' + id + '/', {
      method:'PUT', headers:getHeaders(), body: JSON.stringify(payload)
    });
    if (resp.ok) {
      document.getElementById('msg_edit').textContent = 'Guardado correctamente';
      setTimeout(()=> location.href = 'calificaciones.html', 900);
    } else {
      document.getElementById('msg_edit').textContent = 'Error o no autorizado';
    }
  });
}

// on load actions
document.addEventListener('DOMContentLoaded', ()=>{
  cargarCalificacionesTable();
  cargarLogs();
});
