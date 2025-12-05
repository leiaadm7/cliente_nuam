const API_URL = "https://proyecto-nuam.onrender.com/api/";


let token = null;
let datosGlobales = [];
let chartPaises = null;
let chartTipos = null;

// ---------------------- LOGIN ------------------------
async function obtenerToken() {
    const username = document.getElementById("api-username").value;
    const password = document.getElementById("api-password").value;
    const mensaje = document.getElementById("login-message");

    if (!username || !password) {
        mensaje.innerText = "Usuario y contraseña requeridos.";
        return;
    }

    try {
        const response = await fetch(API_URL + "token/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password })
        });

        if (!response.ok) {
            mensaje.innerText = "Acceso denegado.";
            return;
        }

        const data = await response.json();
        token = data.access;
        document.getElementById("user-display").innerText = username;
        mostrarPanelDatos();

    } catch (error) {
        console.error("Error:", error);
        mensaje.innerText = "Sin conexión al servidor.";
    }
}

// ---------------------- NAVEGACIÓN ------------------------
function mostrarPanelDatos() {
    document.getElementById("login-section").classList.add("hidden");
    const panel = document.getElementById("data-section");
    panel.classList.remove("hidden");
    setTimeout(() => panel.classList.add("show"), 50);
    cargarCalificaciones();
}

function cerrarSesion() {
    token = null;
    datosGlobales = [];
    location.reload(); 
}

// ---------------------- CARGAR DATOS ------------------------
async function cargarCalificaciones() {
    try {
        const resp = await fetch(API_URL + "calificaciones/", {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (resp.status === 401) {
            alert("Sesión caducada.");
            cerrarSesion();
            return;
        }

        datosGlobales = await resp.json();
        llenarTabla(datosGlobales);
        actualizarEstadisticas(datosGlobales);
        graficarPaises(datosGlobales);
        graficarTipos(datosGlobales);

    } catch (error) {
        console.error("Error cargando datos:", error);
    }
}

// ---------------------- TABLA ------------------------
function llenarTabla(data) {
    const tbody = document.getElementById("tabla-body");
    tbody.innerHTML = "";

    data.forEach(c => {
        const montoFormateado = parseFloat(c.monto_base).toLocaleString('es-CL', { minimumFractionDigits: 2 });
        
        let colorPais = "bg-gray-50 text-gray-600 border-gray-100";
        if(c.pais === "CHILE") colorPais = "bg-blue-50 text-blue-700 border border-blue-100";
        if(c.pais === "PERU") colorPais = "bg-rose-50 text-rose-700 border border-rose-100";
        if(c.pais === "COLOMBIA") colorPais = "bg-amber-50 text-amber-700 border border-amber-100";

        tbody.innerHTML += `
            <tr class="bg-white border-b hover:bg-slate-50 transition duration-150 group">
                <td class="px-6 py-4 font-bold text-gray-700 text-xs">#${c.id}</td>
                <td class="px-6 py-4 text-center">
                    <span class="px-3 py-1 inline-flex text-[10px] font-bold uppercase tracking-wider rounded-full ${colorPais}">
                        ${c.pais_nombre}
                    </span>
                </td>
                <td class="px-6 py-4 text-gray-600 text-xs">${c.tipo_nombre}</td>
                <td class="px-6 py-4 text-right font-mono font-medium text-gray-700 text-xs">$${montoFormateado}</td>
                <td class="px-6 py-4 text-right text-gray-500 text-xs">${c.factor}</td>
                <td class="px-6 py-4 text-gray-500 text-xs flex items-center gap-2">
                    <div class="w-6 h-6 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center text-[10px]"><i class="bi bi-person-fill"></i></div>
                    ${c.analista_username}
                </td>
                <td class="px-6 py-4 text-center">
                    <div class="flex justify-center gap-1 opacity-60 group-hover:opacity-100 transition">
                        <button onclick="abrirModal(${c.id})" class="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition flex items-center justify-center"><i class="bi bi-pencil-fill text-xs"></i></button>
                        <button onclick="eliminarCalificacion(${c.id})" class="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition flex items-center justify-center"><i class="bi bi-trash-fill text-xs"></i></button>
                    </div>
                </td>
            </tr>
        `;
    });

    // Actualizar el contador de registros
    const contador = document.getElementById("contador-registros");
    if (contador) contador.innerText = data.length;
}

// ---------------------- ESTADÍSTICAS (LISTA ORDENADA) ------------------------
function actualizarEstadisticas(data) {
    if (!data.length) {
        document.getElementById("stat-total").innerText = "0";
        document.getElementById("stat-promedio").innerHTML = "-";
        document.getElementById("stat-top-pais").innerText = "-";
        return;
    }

    document.getElementById("stat-total").innerText = data.length;

    const statsPorPais = {};
    
    data.forEach(x => {
        const codigoPais = x.pais; 
        if (!statsPorPais[codigoPais]) {
            statsPorPais[codigoPais] = { suma: 0, cuenta: 0 };
        }
        statsPorPais[codigoPais].suma += parseFloat(x.monto_base);
        statsPorPais[codigoPais].cuenta += 1;
    });

    const contenedor = document.getElementById("stat-promedio");
    contenedor.className = "flex flex-col justify-center h-full space-y-1 mt-2";
    
    let htmlPromedios = "";
    
    const config = {
        'CHILE':    { bandera: '🇨🇱', moneda: '$',  color: 'text-slate-700' },
        'PERU':     { bandera: '🇵🇪', moneda: 'S/', color: 'text-slate-700' },
        'COLOMBIA': { bandera: '🇨🇴', moneda: '$',  color: 'text-slate-700' }
    };

    Object.keys(statsPorPais).forEach(pais => {
        const datos = statsPorPais[pais];
        const promedio = datos.suma / datos.cuenta;
        const conf = config[pais] || { bandera: '🏳️', moneda: '$', color: 'text-gray-600' };
        
        const numFmt = Math.round(promedio).toLocaleString('es-CL');

        htmlPromedios += `
            <div class="grid grid-cols-[1fr_auto_auto] gap-x-3 items-center py-1 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition rounded px-1">
                <div class="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wide">
                    <span class="text-base grayscale-[0.2]">${conf.bandera}</span> ${pais}
                </div>
                <div class="text-xs font-semibold text-gray-400 text-right w-6">
                    ${conf.moneda}
                </div>
                <div class="font-mono font-bold text-sm ${conf.color} text-right min-w-[80px]">
                    ${numFmt}
                </div>
            </div>
        `;
    });

    contenedor.innerHTML = htmlPromedios;

    const counts = {};
    data.forEach(x => counts[x.pais_nombre] = (counts[x.pais_nombre] || 0) + 1);
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    document.getElementById("stat-top-pais").innerText = top ? top[0] : "-";
}

// ---------------------- GRÁFICOS (COLORES PASTEL) ------------------------
function graficarPaises(data) {
    const ctx = document.getElementById("chartPaises").getContext("2d");
    if (chartPaises) chartPaises.destroy();

    const counts = {};
    data.forEach(c => counts[c.pais_nombre] = (counts[c.pais_nombre] || 0) + 1);

    chartPaises = new Chart(ctx, {
        type: "bar",
        data: {
            labels: Object.keys(counts),
            datasets: [{
                label: "Registros",
                data: Object.values(counts),
                backgroundColor: ["#93C5FD", "#FDA4AF", "#FCD34D", "#A78BFA", "#6EE7B7"],
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, grid: { color: "#f3f4f6" } },
                x: { grid: { display: false } }
            }
        }
    });
}

function graficarTipos(data) {
    const ctx = document.getElementById("chartTipos").getContext("2d");
    if (chartTipos) chartTipos.destroy();

    const counts = {};
    data.forEach(c => counts[c.tipo_nombre] = (counts[c.tipo_nombre] || 0) + 1);

    chartTipos = new Chart(ctx, {
        type: "doughnut",
        data: {
            labels: Object.keys(counts),
            datasets: [{
                data: Object.values(counts),
                backgroundColor: ["#5EEAD4", "#C4B5FD", "#FDBA74", "#93C5FD"],
                borderWidth: 0,
                hoverOffset: 6
            }]
        },
        options: { 
            responsive: true, 
            maintainAspectRatio: false,
            cutout: '75%',
            plugins: {
                legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8 } }
            }
        }
    });
}

// ---------------------- MODALES (CRUD & HISTORIAL) ------------------------
function abrirModal(id = null) {
    const modal = document.getElementById("modal-form");
    modal.classList.remove("hidden");
    const titulo = document.getElementById("modal-titulo");

    if (id) {
        const dato = datosGlobales.find(d => d.id === id);
        titulo.innerText = `Editar #${id}`;
        document.getElementById("calif-id").value = id;
        document.getElementById("campo-pais").value = dato.pais;
        document.getElementById("campo-tipo").value = dato.tipo;
        document.getElementById("campo-monto").value = dato.monto_base;
        document.getElementById("campo-factor").value = dato.factor;
    } else {
        titulo.innerText = "Nuevo Registro";
        document.getElementById("calif-id").value = "";
        document.getElementById("campo-pais").value = "CHILE";
        document.getElementById("campo-monto").value = "";
        document.getElementById("campo-factor").value = "";
    }
}

function cerrarModal() {
    document.getElementById("modal-form").classList.add("hidden");
}

async function guardarCalificacion() {
    const id = document.getElementById("calif-id").value;
    const pais = document.getElementById("campo-pais").value;
    const tipo = document.getElementById("campo-tipo").value;
    const monto = document.getElementById("campo-monto").value;
    const factor = document.getElementById("campo-factor").value;

    if (!monto || !factor) { alert("Completa los campos"); return; }

    const datos = { pais, tipo, monto_base: monto, factor };
    const metodo = id ? "PUT" : "POST";
    const url = id ? API_URL + `calificaciones/${id}/` : API_URL + "calificaciones/";

    try {
        const resp = await fetch(url, {
            method: metodo,
            headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
            body: JSON.stringify(datos)
        });
        if (resp.ok) { cerrarModal(); cargarCalificaciones(); }
        else { alert("Error al guardar."); }
    } catch (e) { console.error(e); }
}

async function eliminarCalificacion(id) {
    if (!confirm("¿Eliminar registro?")) return;
    try {
        const resp = await fetch(API_URL + `calificaciones/${id}/`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${token}` }
        });
        if (resp.ok) cargarCalificaciones();
    } catch (e) { console.error(e); }
}

async function abrirHistorial() {
    const modal = document.getElementById("modal-historial");
    const tbody = document.getElementById("tabla-historial-body");
    modal.classList.remove("hidden");
    tbody.innerHTML = '<tr><td colspan="4" class="text-center py-4">Cargando...</td></tr>';

    try {
        const resp = await fetch(API_URL + "historial/", {
            headers: { Authorization: `Bearer ${token}` }
        });
        const logs = await resp.json();
        tbody.innerHTML = "";
        if(!logs.length) tbody.innerHTML = '<tr><td colspan="4" class="text-center py-4">Sin datos</td></tr>';

        logs.forEach(log => {
            let color = "bg-gray-100 text-gray-600";
            if(log.accion === "CREAR") color = "bg-green-100 text-green-700";
            if(log.accion === "EDITAR") color = "bg-blue-100 text-blue-700";
            if(log.accion === "ELIMINAR") color = "bg-red-100 text-red-700";

            tbody.innerHTML += `
                <tr class="bg-white border-b hover:bg-purple-50">
                    <td class="px-6 py-3 font-mono text-xs text-gray-500">${new Date(log.fecha_hora).toLocaleString()}</td>
                    <td class="px-6 py-3 text-xs font-bold">${log.usuario_username || "Sistema"}</td>
                    <td class="px-6 py-3 text-center"><span class="px-2 py-1 rounded text-[10px] font-bold ${color}">${log.accion}</span></td>
                    <td class="px-6 py-3 text-xs text-gray-600">${log.detalle}</td>
                </tr>`;
        });
    } catch (e) { console.error(e); }
}

function cerrarHistorial() {
    document.getElementById("modal-historial").classList.add("hidden");
}

// ---------------------- NUEVAS FUNCIONES DE ADMINISTRACIÓN ------------------------

// Función de Búsqueda
function filtrarDatos() {
    const texto = document.getElementById("buscador").value.toLowerCase();
    
    // Filtramos sobre la variable global
    const filtrados = datosGlobales.filter(item => {
        return (
            item.pais_nombre.toLowerCase().includes(texto) ||
            item.tipo_nombre.toLowerCase().includes(texto) ||
            item.analista_username.toLowerCase().includes(texto) ||
            item.monto_base.toString().includes(texto)
        );
    });

    // Redibujamos la tabla con los resultados filtrados
    llenarTabla(filtrados);
}

// Función de Exportar a Excel (CSV)
function exportarExcel() {
    if (datosGlobales.length === 0) {
        alert("No hay datos para exportar.");
        return;
    }

    // 1. Encabezados
    let csvContent = "ID,PAIS,TIPO,MONTO,FACTOR,ANALISTA,FECHA\n";

    // 2. Datos
    datosGlobales.forEach(row => {
        const fila = [
            row.id,
            row.pais_nombre,
            row.tipo_nombre,
            row.monto_base,
            row.factor,
            row.analista_username,
            new Date(row.fecha_registro).toLocaleDateString()
        ].join(",");
        csvContent += fila + "\n";
    });
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "reporte_nuam_admin.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}