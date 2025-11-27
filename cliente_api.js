const API_BASE_URL = "http://127.0.0.1:8000/api";

let chartPaises = null;
let chartTipos = null;


async function obtenerToken() {
    const username = document.getElementById("api-username").value;
    const password = document.getElementById("api-password").value;

    const msg = document.getElementById("login-message");

    if (!username || !password) {
        msg.innerText = "Ingresa usuario y contraseña";
        msg.classList = "text-red-600";
        return;
    }

    msg.innerText = "Verificando...";
    msg.classList = "text-gray-600";

    try {
        const res = await fetch(`${API_BASE_URL}/token/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password }),
        });

        if (!res.ok) {
            msg.innerText = "Credenciales incorrectas";
            msg.classList = "text-red-600";
            return;
        }

        const data = await res.json();
        localStorage.setItem("access_token", data.access);

        msg.innerText = "Acceso concedido";
        msg.classList = "text-green-600";

        setTimeout(mostrarDashboard, 600);

    } catch (e) {
        msg.innerText = "Error de conexión";
        msg.classList = "text-red-600";
    }
}

function mostrarDashboard() {
    document.getElementById("login-section").classList.add("hidden");

    const sec = document.getElementById("data-section");
    sec.classList.remove("hidden");

    setTimeout(() => sec.classList.add("show"), 50);

    document.getElementById(
        "token-display"
    ).innerText = "Token activo";

    cargarCalificaciones();
}

function cerrarSesion() {
    localStorage.clear();
    location.reload();
}




async function cargarCalificaciones() {
    const token = localStorage.getItem("access_token");

    const res = await fetch(`${API_BASE_URL}/calificaciones/`, {
        headers: { Authorization: `Bearer ${token}` }
    });

    const data = await res.json();
    const lista = data.results || data;  

    actualizarTabla(lista);
    generarEstadisticas(lista);
    generarGraficos(lista);
}



function actualizarTabla(lista) {
    const tabla = document.getElementById("tabla-body");
    tabla.innerHTML = "";

    lista.forEach(r => {
        tabla.innerHTML += `
            <tr class="border-b hover:bg-gray-50">
                <td class="p-3">#${r.id}</td>
                <td class="p-3">${r.pais}</td>
                <td class="p-3">${r.tipo}</td>
                <td class="p-3">$${r.monto_base}</td>
                <td class="p-3">${r.factor}</td>
                <td class="p-3">${r.analista_username}</td>
            </tr>
        `;
    });
}



function generarEstadisticas(lista) {

    // Total
    document.getElementById("stat-total").innerText = lista.length;

    // Promedio monto
    const promedio =
        lista.reduce((acc, r) => acc + parseFloat(r.monto_base), 0) / lista.length;

    document.getElementById("stat-promedio").innerText =
        promedio.toFixed(2);

    // País más común
    let conteo = {};
    lista.forEach(r => {
        conteo[r.pais] = (conteo[r.pais] || 0) + 1;
    });

    const maxPais = Object.entries(conteo).sort((a, b) => b[1] - a[1])[0];
    document.getElementById("stat-top-pais").innerText = maxPais ? maxPais[0] : "-";
}



function generarGraficos(lista) {

    const porPais = {};
    const porTipo = {};

    lista.forEach(r => {
        porPais[r.pais] = (porPais[r.pais] || 0) + 1;
        porTipo[r.tipo] = (porTipo[r.tipo] || 0) + 1;
    });

    const ctx1 = document.getElementById("chartPaises").getContext("2d");
    const ctx2 = document.getElementById("chartTipos").getContext("2d");

    if (chartPaises) chartPaises.destroy();
    if (chartTipos) chartTipos.destroy();

    chartPaises = new Chart(ctx1, {
        type: "bar",
        data: {
            labels: Object.keys(porPais),
            datasets: [{
                label: "Cantidad",
                data: Object.values(porPais),
                backgroundColor: ["#3b82f6", "#38bdf8", "#1e40af"],
            }],
        }
    });

    chartTipos = new Chart(ctx2, {
        type: "doughnut",
        data: {
            labels: Object.keys(porTipo),
            datasets: [{
                data: Object.values(porTipo),
                backgroundColor: ["#10b981", "#6366f1", "#f59e0b"],
            }],
        }
    });
}
