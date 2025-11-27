const API_URL = "http://127.0.0.1:8000/api/";

let token = null;

// ---------------------- LOGIN ------------------------
async function obtenerToken() {
    const username = document.getElementById("api-username").value;
    const password = document.getElementById("api-password").value;

    const mensaje = document.getElementById("login-message");

    if (!username || !password) {
        mensaje.innerText = "Debe ingresar usuario y contraseña.";
        mensaje.classList.add("text-red-600");
        return;
    }

    try {
        const response = await fetch(API_URL + "token/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password })
        });

        if (!response.ok) {
            mensaje.innerText = "Credenciales incorrectas.";
            mensaje.classList.add("text-red-600");
            return;
        }

        const data = await response.json();
        token = data.access;

        mensaje.innerText = "";
        mostrarPanelDatos();

    } catch (error) {
        console.error("Error al obtener token:", error);
    }
}

// ---------------------- MOSTRAR DASHBOARD ------------------------
function mostrarPanelDatos() {
    document.getElementById("login-section").classList.add("hidden");

    const panel = document.getElementById("data-section");
    panel.classList.remove("hidden");

    setTimeout(() => panel.classList.add("show"), 50);

    cargarCalificaciones();
}

// ---------------------- CERRAR SESIÓN ------------------------
function cerrarSesion() {
    token = null;
    document.getElementById("data-section").classList.add("hidden");
    document.getElementById("login-section").classList.remove("hidden");
}

// ---------------------------------------------------------------
// ---------------------- CARGAR DATOS ---------------------------
// ---------------------------------------------------------------
async function cargarCalificaciones() {
    try {
        const resp = await fetch(API_URL + "calificaciones/", {
            headers: { Authorization: `Bearer ${token}` }
        });

        const datos = await resp.json();

        llenarTabla(datos);
        actualizarEstadisticas(datos);
        graficarPaises(datos);
        graficarTipos(datos);

    } catch (error) {
        console.error("Error al cargar calificaciones:", error);
    }
}

// ---------------------- TABLA ------------------------
function llenarTabla(data) {
    const tbody = document.getElementById("tabla-body");
    tbody.innerHTML = "";

    data.forEach(c => {
        tbody.innerHTML += `
            <tr class="border-b">
                <td class="p-3">${c.id}</td>
                <td class="p-3">${c.pais}</td>
                <td class="p-3">${c.tipo}</td>
                <td class="p-3">${c.monto_base}</td>
                <td class="p-3">${c.factor}</td>
                <td class="p-3">${c.analista_username}</td>
            </tr>
        `;
    });
}

// ---------------------- TARJETAS ------------------------
function actualizarEstadisticas(data) {
    if (!data.length) {
        document.getElementById("stat-total").innerText = 0;
        document.getElementById("stat-promedio").innerText = 0;
        document.getElementById("stat-top-pais").innerText = "-";
        return;
    }

    document.getElementById("stat-total").innerText = data.length;

    const promedio = data.reduce((acc, x) => acc + parseFloat(x.monto_base), 0) / data.length;
    document.getElementById("stat-promedio").innerText = promedio.toFixed(2);

    const countPaises = {};
    data.forEach(x => {
        countPaises[x.pais] = (countPaises[x.pais] || 0) + 1;
    });

    const top = Object.entries(countPaises).sort((a, b) => b[1] - a[1])[0][0];
    document.getElementById("stat-top-pais").innerText = top;
}

// ---------------------- GRÁFICO PAÍSES ------------------------
let chartPaises = null;

function graficarPaises(data) {
    const cont = document.getElementById("chartPaises").getContext("2d");

    if (chartPaises) chartPaises.destroy();

    const counts = {};
    data.forEach(c => counts[c.pais] = (counts[c.pais] || 0) + 1);

    chartPaises = new Chart(cont, {
        type: "bar",
        data: {
            labels: Object.keys(counts),
            datasets: [{
                label: "Cantidad",
                data: Object.values(counts)
            }]
        }
    });
}

// ---------------------- GRÁFICO TIPOS ------------------------
let chartTipos = null;

function graficarTipos(data) {
    const cont = document.getElementById("chartTipos").getContext("2d");

    if (chartTipos) chartTipos.destroy();

    const counts = {};
    data.forEach(c => counts[c.tipo] = (counts[c.tipo] || 0) + 1);

    chartTipos = new Chart(cont, {
        type: "pie",
        data: {
            labels: Object.keys(counts),
            datasets: [{
                data: Object.values(counts)
            }]
        }
    });
}
