const API_BASE_URL = "http://127.0.0.1:8000/api";

let chartInstance = null;

async function obtenerToken() {
    const user = document.getElementById("api-username").value;
    const pass = document.getElementById("api-password").value;

    if (!user || !pass) {
        mostrarMensajeLogin("Ingrese usuario y contraseña", "text-rose-500");
        return;
    }

    mostrarMensajeLogin("Verificando...", "text-gray-500");

    const res = await fetch(`${API_BASE_URL}/token/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: user, password: pass })
    });

    if (!res.ok) {
        mostrarMensajeLogin("Credenciales incorrectas", "text-red-500");
        return;
    }

    const data = await res.json();
    localStorage.setItem("access_token", data.access);

    mostrarMensajeLogin("Acceso correcto. Cargando...", "text-emerald-500");
    setTimeout(mostrarPanelDatos, 700);
}

function mostrarMensajeLogin(msg, clase) {
    document.getElementById("login-message").className = clase;
    document.getElementById("login-message").innerText = msg;
}

function mostrarPanelDatos() {
    const token = localStorage.getItem("access_token");
    if (!token) return;

    document.getElementById("login-section").classList.add("hidden");
    const ds = document.getElementById("data-section");
    ds.classList.remove("hidden");

    setTimeout(() => {
        ds.classList.remove("opacity-0", "translate-y-4");
    }, 60);

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

    if (res.status === 401) return cerrarSesion();

    const data = await res.json();
    const lista = data.results || data;

    const tabla = document.getElementById("tabla-body");
    tabla.innerHTML = "";

    let hoy = 0;

    lista.forEach(item => {
        const fechaHoy = new Date().toISOString().slice(0, 10);

        if (item.fecha_registro.startsWith(fechaHoy)) hoy++;

        tabla.innerHTML += `
            <tr class="hover:bg-pink-50">
                <td class="px-6 py-4">#${item.id}</td>
                <td class="px-6 py-4">${item.pais}</td>
                <td class="px-6 py-4">${item.tipo}</td>
                <td class="px-6 py-4">$${item.monto_base}</td>
                <td class="px-6 py-4">${item.factor}</td>
                <td class="px-6 py-4">${item.analista_username}</td>
                <td class="px-6 py-4">${item.fecha_registro}</td>
            </tr>
        `;
    });

    document.getElementById("stat-hoy").innerText = hoy;
    document.getElementById("total-registros").innerText = `${lista.length}`;

    cargarGrafico();
}

async function cargarGrafico() {
    const token = localStorage.getItem("access_token");

    const res = await fetch(`${API_BASE_URL}/calificaciones/resumen_por_pais/`, {
        headers: { Authorization: `Bearer ${token}` }
    });

    const data = await res.json();

    const labels = data.map(x => x.pais);
    const counts = data.map(x => x.total);

    const ctx = document.getElementById("chartVisitas").getContext("2d");

    if (chartInstance) chartInstance.destroy();

    chartInstance = new Chart(ctx, {
        type: "bar",
        data: {
            labels: labels,
            datasets: [{
                data: counts,
                backgroundColor: "rgba(105, 88, 255, 0.7)",
                borderColor: "rgba(105, 88, 255, 0.7)",
                borderWidth: 2,
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}

document.addEventListener("DOMContentLoaded", () => {
    if (localStorage.getItem("access_token")) {
        mostrarPanelDatos();
    }
});
