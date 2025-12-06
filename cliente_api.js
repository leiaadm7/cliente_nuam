const API_URL = "https://proyecto-nuam.onrender.com/api/";

let token = null;
let datosGlobales = [];
let userRole = "NINGUNO"; 
let chartPaises = null;
let chartTipos = null;

async function obtenerToken() {
    const username = document.getElementById("api-username").value;
    const password = document.getElementById("api-password").value;
    const mensaje = document.getElementById("login-message");

    if (!username || !password) {
        mensaje.innerText = "Faltan credenciales.";
        return;
    }

    try {
        const response = await fetch(API_URL + "token/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password })
        });

        if (!response.ok) {
            mensaje.innerText = "Usuario o contraseña incorrectos.";
            return;
        }

        const data = await response.json();
        token = data.access;

        await identificarUsuario();

        document.getElementById("user-display").innerText = username.toUpperCase();
        mostrarPanelDatos();

    } catch (error) {
        console.error("Error:", error);
        mensaje.innerText = "Error de conexión.";
    }
}

async function identificarUsuario() {
    try {
        const resp = await fetch(API_URL + "whoami/", {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (resp.ok) {
            const info = await resp.json();
            userRole = info.grupo; 
            aplicarPermisosVisuales();
        }
    } catch (e) {
        console.error("No se pudo identificar rol");
    }
}

function aplicarPermisosVisuales() {
    document.getElementById("btn-nuevo").classList.add("hidden");
    document.getElementById("btn-auditoria").classList.add("hidden");

    if (userRole === "ADMIN") {
        document.getElementById("btn-nuevo").classList.remove("hidden");
        document.getElementById("btn-auditoria").classList.remove("hidden");
    } 
    else if (userRole === "INTERNO") {
        document.getElementById("btn-nuevo").classList.remove("hidden");
    } 
    else if (userRole === "AUDITOR") {
        document.getElementById("btn-auditoria").classList.remove("hidden");
    }
}

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

async function cargarCalificaciones() {
    try {
        const resp = await fetch(API_URL + "calificaciones/", {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (resp.status === 401) {
            alert("Tu sesión expiró.");
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

function llenarTabla(data) {
    const tbody = document.getElementById("tabla-body");
    tbody.innerHTML = "";

    data.forEach(c => {
        const montoFormateado = parseFloat(c.monto_base).toLocaleString('es-CL', { minimumFractionDigits: 2 });
        
        let colorPais = "bg-gray-100 text-gray-600 border-gray-100";
        if(c.pais === "CHILE") colorPais = "bg-blue-50 text-blue-700 border-blue-100";
        if(c.pais === "PERU") colorPais = "bg-rose-50 text-rose-700 border-rose-100";
        if(c.pais === "COLOMBIA") colorPais = "bg-amber-50 text-amber-700 border-amber-100";
        
        let botonesAccion = "";
        
        if (userRole === "ADMIN" || userRole === "INTERNO") {
            botonesAccion += `
                <button onclick="abrirModal(${c.id})" class="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition mr-1" title="Editar">
                    <i class="bi bi-pencil-fill"></i>
                </button>
            `;
        }

        if (userRole === "ADMIN") {
            botonesAccion += `
                <button onclick="eliminarCalificacion(${c.id})" class="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition" title="Eliminar">
                    <i class="bi bi-trash-fill"></i>
                </button>
            `;
        }

        if (botonesAccion === "") {
            botonesAccion = '<span class="text-gray-300">-</span>';
        }

        tbody.innerHTML += `
            <tr class="bg-white border-b hover:bg-slate-50 transition duration-150 group">
                <td class="px-6 py-4 font-bold text-gray-700 text-xs text-center">#${c.id}</td>
                <td class="px-6 py-4 text-center">
                    <span class="px-3 py-1 inline-flex text-[10px] font-bold uppercase tracking-wider rounded-full ${colorPais}">
                        ${c.pais_nombre}
                    </span>
                </td>
                <td class="px-6 py-4 text-gray-600 text-xs text-center">${c.tipo_nombre}</td>
                <td class="px-6 py-4 text-right font-mono text-xs font-medium text-gray-700">$${montoFormateado}</td>
                <td class="px-6 py-4 text-right text-xs text-gray-500">${c.factor}</td>
                <td class="px-6 py-4 text-xs text-center text-gray-500">
                    ${c.analista_username}
                </td>
                <td class="px-6 py-4 text-center">
                    <div class="flex justify-center items-center">
                        ${botonesAccion}
                    </div>
                </td>
            </tr>
        `;
    });
    
    const contador = document.getElementById("contador-registros");
    if(contador) contador.innerText = data.length;
}

async function abrirHistorial() {
    const modal = document.getElementById("modal-historial");
    const tbody = document.getElementById("tabla-historial-body");
    modal.classList.remove("hidden");
    tbody.innerHTML = '<tr><td colspan="4" class="text-center py-4 text-gray-400">Cargando...</td></tr>';

    try {
        const resp = await fetch(API_URL + "historial/", {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        if (!resp.ok) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center py-4 text-red-500">Acceso denegado.</td></tr>';
            return;
        }

        const logs = await resp.json();
        tbody.innerHTML = "";
        
        if(logs.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center py-4 text-gray-400">Sin registros.</td></tr>';
            return;
        }

        logs.forEach(log => {
            const fecha = new Date(log.fecha_hora).toLocaleString();
            tbody.innerHTML += `
                <tr class="bg-white border-b hover:bg-gray-50 transition">
                    <td class="px-6 py-3 font-mono text-xs text-gray-600 whitespace-nowrap">${fecha}</td>
                    <td class="px-6 py-3 text-xs font-bold text-gray-700">${log.usuario_username || "Sistema"}</td>
                    <td class="px-6 py-3 text-center text-xs font-bold text-gray-800 uppercase tracking-wide">${log.accion}</td>
                    <td class="px-6 py-3 text-xs text-gray-600 font-mono">${log.detalle}</td>
                </tr>
            `;
        });

    } catch (error) {
        console.error("Error historial:", error);
    }
}

function cerrarHistorial() {
    document.getElementById("modal-historial").classList.add("hidden");
}

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
        const codigo = x.pais;
        if (!statsPorPais[codigo]) statsPorPais[codigo] = { suma: 0, cuenta: 0 };
        statsPorPais[codigo].suma += parseFloat(x.monto_base);
        statsPorPais[codigo].cuenta += 1;
    });

    const contenedor = document.getElementById("stat-promedio");
    contenedor.className = "flex flex-col justify-center h-full space-y-1 mt-2";
    let html = "";
    const config = {
        'CHILE': { bandera: '🇨🇱', moneda: '$', color: 'text-slate-700' },
        'PERU': { bandera: '🇵🇪', moneda: 'S/', color: 'text-slate-700' },
        'COLOMBIA': { bandera: '🇨🇴', moneda: '$', color: 'text-slate-700' }
    };

    Object.keys(statsPorPais).forEach(pais => {
        const d = statsPorPais[pais];
        const prom = d.suma / d.cuenta;
        const conf = config[pais] || { bandera: '🏳️', moneda: '$', color: 'text-gray' };
        
        html += `
            <div class="grid grid-cols-[1fr_auto_auto] gap-x-3 items-center py-1 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition rounded px-1">
                <div class="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wide">
                    <span class="text-base grayscale-[0.2]">${conf.bandera}</span> ${pais}
                </div>
                <div class="text-xs font-semibold text-gray-400 text-right w-6">${conf.moneda}</div>
                <div class="font-mono font-bold text-sm ${conf.color} text-right min-w-[80px]">
                    ${Math.round(prom).toLocaleString('es-CL')}
                </div>
            </div>`;
    });
    contenedor.innerHTML = html;

    const counts = {};
    data.forEach(x => counts[x.pais_nombre] = (counts[x.pais_nombre] || 0) + 1);
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    document.getElementById("stat-top-pais").innerText = top ? top[0] : "-";
}

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
                label: "Total",
                data: Object.values(counts),
                backgroundColor: ["#93C5FD", "#FDA4AF", "#FCD34D", "#A78BFA"],
                borderRadius: 6
            }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true }, x: { grid: { display: false } } } }
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
                backgroundColor: ["#5EEAD4", "#C4B5FD", "#FDBA74"],
                borderWidth: 0, hoverOffset: 6
            }]
        },
        options: { responsive: true, maintainAspectRatio: false, cutout: '75%', plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8 } } } }
    });
}

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

function filtrarDatos() {
    const texto = document.getElementById("buscador").value.toLowerCase();
    const fDesde = document.getElementById("fecha-desde").value;
    const fHasta = document.getElementById("fecha-hasta").value;
    
    const filtrados = datosGlobales.filter(item => {
        const coincideTexto = (
            item.pais_nombre.toLowerCase().includes(texto) ||
            item.tipo_nombre.toLowerCase().includes(texto) ||
            item.analista_username.toLowerCase().includes(texto) ||
            item.monto_base.toString().includes(texto)
        );

        let coincideFecha = true;
        const fechaItem = new Date(item.fecha_registro).toISOString().split('T')[0];

        if (fDesde && fechaItem < fDesde) coincideFecha = false;
        if (fHasta && fechaItem > fHasta) coincideFecha = false;

        return coincideTexto && coincideFecha;
    });

    llenarTabla(filtrados);
    document.getElementById("contador-registros").innerText = filtrados.length;
}

function exportarExcel() {
    if (datosGlobales.length === 0) { alert("Sin datos"); return; }
    let csv = "ID,PAIS,TIPO,MONTO,FACTOR,ANALISTA,FECHA\n";
    datosGlobales.forEach(row => {
        csv += [row.id, row.pais_nombre, row.tipo_nombre, row.monto_base, row.factor, row.analista_username, new Date(row.fecha_registro).toLocaleDateString()].join(",") + "\n";
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "reporte_nuam.csv";
    link.click();
}