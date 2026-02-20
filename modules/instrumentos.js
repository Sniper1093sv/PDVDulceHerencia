// modules/instrumentos.js - Módulo de gestión de instrumentos con total invertido

// Datos de ejemplo (luego los guardaremos en localStorage)
let instrumentos = [];

// Función para calcular el total invertido
function calcularTotalInvertido() {
    return instrumentos.reduce((total, inst) => total + inst.precio, 0);
}

// Función para obtener el instrumento más caro
function obtenerInstrumentoMasCaro() {
    if (instrumentos.length === 0) return null;
    return instrumentos.reduce((max, inst) => inst.precio > max.precio ? inst : max, instrumentos[0]);
}

// Función para obtener el instrumento más reciente
function obtenerInstrumentoMasReciente() {
    if (instrumentos.length === 0) return null;
    return instrumentos.reduce((reciente, inst) => new Date(inst.fecha) > new Date(reciente.fecha) ? inst : reciente, instrumentos[0]);
}

// Función para mostrar el módulo
function mostrarInstrumentos() {
    const total = calcularTotalInvertido();
    const masCaro = obtenerInstrumentoMasCaro();
    const masReciente = obtenerInstrumentoMasReciente();
    
    return `
        <h2>🛠️ Gestión de Instrumentos</h2>
        
        <!-- Tarjeta de resumen con total invertido -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem;">
            <div style="background: linear-gradient(135deg, #8B4513, #D2691E); color: white; padding: 1.5rem; border-radius: 10px; box-shadow: var(--sombra);">
                <h3 style="margin: 0; font-size: 0.9rem; opacity: 0.9;">TOTAL INVERTIDO</h3>
                <p style="font-size: 2rem; font-weight: bold; margin: 0.5rem 0;">${formatearMoneda(total)}</p>
                <p style="margin: 0; font-size: 0.8rem;">${instrumentos.length} instrumentos</p>
            </div>
            
            <div style="background: white; padding: 1.5rem; border-radius: 10px; box-shadow: var(--sombra);">
                <h3 style="margin: 0; color: #666; font-size: 0.9rem;">INSTRUMENTO MÁS CARO</h3>
                ${masCaro ? `
                    <p style="font-size: 1.2rem; font-weight: bold; margin: 0.5rem 0;">${formatearMoneda(masCaro.precio)}</p>
                    <p style="margin: 0; color: #666;">${masCaro.proveedor}</p>
                ` : `
                    <p style="margin: 0.5rem 0;">No hay datos</p>
                `}
            </div>
            
            <div style="background: white; padding: 1.5rem; border-radius: 10px; box-shadow: var(--sombra);">
                <h3 style="margin: 0; color: #666; font-size: 0.9rem;">ÚLTIMO INSTRUMENTO</h3>
                ${masReciente ? `
                    <p style="font-size: 1.2rem; font-weight: bold; margin: 0.5rem 0;">${new Date(masReciente.fecha).toLocaleDateString('es-ES')}</p>
                    <p style="margin: 0; color: #666;">${masReciente.proveedor}</p>
                ` : `
                    <p style="margin: 0.5rem 0;">No hay datos</p>
                `}
            </div>
        </div>
        
        <!-- Formulario para agregar -->
        <div class="form-container" style="background: white; padding: 1.5rem; border-radius: 10px; margin-bottom: 2rem;">
            <h3>Agregar Nuevo Instrumento</h3>
            <form id="form-instrumento" onsubmit="event.preventDefault(); guardarInstrumento();">
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
                    <div class="form-group">
                        <label for="fecha">Fecha:</label>
                        <input type="date" id="fecha" required>
                    </div>
                    <div class="form-group">
                        <label for="precio">Precio ($):</label>
                        <input type="number" id="precio" step="0.01" min="0" required>
                    </div>
                    <div class="form-group">
                        <label for="proveedor">Proveedor:</label>
                        <input type="text" id="proveedor" placeholder="Ej: Hornos Industriales SA" required>
                    </div>
                </div>
                <button type="submit" class="btn btn-success" style="margin-top: 1rem;">Guardar Instrumento</button>
            </form>
        </div>
        
        <!-- Tabla de instrumentos -->
        <div class="table-container">
            <h3>Lista de Instrumentos</h3>
            <table id="tabla-instrumentos">
                <thead>
                    <tr>
                        <th>Fecha</th>
                        <th>Precio</th>
                        <th>Proveedor</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody id="instrumentos-body">
                    ${renderizarInstrumentos()}
                </tbody>
                <!-- Fila de total al final de la tabla -->
                ${instrumentos.length > 0 ? `
                    <tfoot>
                        <tr style="background-color: #f0f0f0; font-weight: bold;">
                            <td colspan="1" style="text-align: right;">TOTAL:</td>
                            <td>${formatearMoneda(total)}</td>
                            <td colspan="2"></td>
                        </tr>
                    </tfoot>
                ` : ''}
            </table>
        </div>
        
        <button class="btn" style="margin-top: 1rem;" onclick="volverAlInicio()">← Volver al Inicio</button>
    `;
}

// Función para renderizar la tabla de instrumentos
function renderizarInstrumentos() {
    if (instrumentos.length === 0) {
        return `<tr><td colspan="4" style="text-align: center; padding: 2rem;">No hay instrumentos registrados</td></tr>`;
    }
    
    return instrumentos.map((inst, index) => `
        <tr>
            <td>${new Date(inst.fecha).toLocaleDateString('es-ES')}</td>
            <td style="font-weight: ${inst.precio > 1000 ? 'bold' : 'normal'}; color: ${inst.precio > 1000 ? '#8B4513' : 'inherit'};">${formatearMoneda(inst.precio)}</td>
            <td>${inst.proveedor}</td>
            <td>
                <button class="btn" style="background-color: var(--color-peligro); padding: 0.3rem 0.8rem; font-size: 0.9rem;" onclick="eliminarInstrumento(${index})">
                    🗑️ Eliminar
                </button>
            </td>
        </tr>
    `).join('');
}

// Función para actualizar toda la interfaz del módulo
function actualizarInterfaz() {
    const moduloInstrumentos = document.getElementById('instrumentos');
    if (moduloInstrumentos && moduloInstrumentos.classList.contains('active')) {
        moduloInstrumentos.innerHTML = mostrarInstrumentos();
    }
}

// Función para guardar un nuevo instrumento
function guardarInstrumento() {
    const fecha = document.getElementById('fecha').value;
    const precio = document.getElementById('precio').value;
    const proveedor = document.getElementById('proveedor').value;
    
    if (!fecha || !precio || !proveedor) {
        mostrarNotificacion('Por favor completa todos los campos', 'error');
        return;
    }
    
    // Agregar a la lista
    instrumentos.push({
        fecha: fecha,
        precio: parseFloat(precio),
        proveedor: proveedor
    });
    
    // Guardar en localStorage
    guardarEnLocalStorage();
    
    // Actualizar toda la interfaz (para que el total se actualice)
    actualizarInterfaz();
    
    // Mostrar notificación
    mostrarNotificacion('Instrumento guardado correctamente', 'exito');
}

// Función para eliminar instrumento
function eliminarInstrumento(index) {
    if (confirm('¿Estás seguro de eliminar este instrumento?')) {
        instrumentos.splice(index, 1);
        guardarEnLocalStorage();
        actualizarInterfaz();
        mostrarNotificacion('Instrumento eliminado', 'info');
    }
}

// Función para guardar en localStorage
function guardarEnLocalStorage() {
    localStorage.setItem('instrumentos', JSON.stringify(instrumentos));
}

// Función para cargar desde localStorage
function cargarDesdeLocalStorage() {
    const datos = localStorage.getItem('instrumentos');
    if (datos) {
        instrumentos = JSON.parse(datos);
    } else {
        // Datos de ejemplo si no hay nada guardado
        instrumentos = [
            { fecha: '2026-02-01', precio: 150.50, proveedor: 'Hornos Industriales SA' },
            { fecha: '2026-02-05', precio: 89.99, proveedor: 'Batidoras Express' },
            { fecha: '2026-02-10', precio: 1200.00, proveedor: 'Refrigeración Panadera' },
        ];
        guardarEnLocalStorage(); // Guardar los ejemplos
    }
}

// Función para volver al inicio
function volverAlInicio() {
    document.querySelector('[data-module="inicio"]').click();
}

// Función para exportar datos a CSV
function exportarACSV() {
    if (instrumentos.length === 0) {
        alert('No hay datos para exportar');
        return;
    }
    
    let csv = 'Fecha,Precio,Proveedor\n';
    instrumentos.forEach(inst => {
        csv += `${inst.fecha},${inst.precio},${inst.proveedor}\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'instrumentos.csv';
    a.click();
    window.URL.revokeObjectURL(url);
}

// Exponer funciones globalmente
window.mostrarInstrumentos = mostrarInstrumentos;
window.guardarInstrumento = guardarInstrumento;
window.eliminarInstrumento = eliminarInstrumento;
window.volverAlInicio = volverAlInicio;
window.exportarACSV = exportarACSV;

// Cargar datos al iniciar
cargarDesdeLocalStorage();

console.log('📊 Módulo de Instrumentos cargado con total invertido');