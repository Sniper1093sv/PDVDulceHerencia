// modules/empleados.js - Módulo de gestión de empleados y cálculo de planilla

// Estructura de datos
let empleados = [];
let gananciasQuincenales = 0; // Este valor se actualizará desde el módulo de ganancias

// Cargar datos iniciales
function cargarEmpleados() {
    const datos = localStorage.getItem('empleados');
    if (datos) {
        empleados = JSON.parse(datos);
    } else {
        // Datos de ejemplo
        empleados = [
            { id: 1, nombre: 'Juan Pérez', activo: true },
            { id: 2, nombre: 'María García', activo: true },
            { id: 3, nombre: 'Carlos López', activo: false },
        ];
        guardarEmpleados();
    }
}

function guardarEmpleados() {
    localStorage.setItem('empleados', JSON.stringify(empleados));
}

// Función para obtener ganancias quincenales (simulada - luego se conectará con el otro módulo)
function obtenerGananciasQuincenales() {
    // Por ahora simulamos un valor, luego esto vendrá del módulo de ganancias
    const ganancias = localStorage.getItem('gananciasQuincenales');
    return ganancias ? parseFloat(ganancias) : 2500.00; // Valor de ejemplo
}

// Calcular planilla quincenal
function calcularPlanilla() {
    const empleadosActivos = empleados.filter(e => e.activo).length;
    const totalPlanilla = empleadosActivos * 15 * 15; // $15/día * 15 días
    const ganancias = obtenerGananciasQuincenales();
    const saldoRestante = ganancias - totalPlanilla;
    
    return {
        empleadosActivos,
        totalPlanilla,
        ganancias,
        saldoRestante,
        puedePagar: saldoRestante >= 0
    };
}

// Función para mostrar el módulo
function mostrarEmpleados() {
    const planilla = calcularPlanilla();
    
    return `
        <h2>👥 Gestión de Empleados</h2>
        
        <!-- Tarjetas de resumen -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem;">
            <div style="background: linear-gradient(135deg, #2E7D32, #4CAF50); color: white; padding: 1.5rem; border-radius: 10px;">
                <h3 style="margin: 0; font-size: 0.9rem;">EMPLEADOS ACTIVOS</h3>
                <p style="font-size: 2rem; font-weight: bold; margin: 0.5rem 0;">${planilla.empleadosActivos}</p>
                <p style="margin: 0;">Total en nómina</p>
            </div>
            
            <div style="background: linear-gradient(135deg, #8B4513, #D2691E); color: white; padding: 1.5rem; border-radius: 10px;">
                <h3 style="margin: 0; font-size: 0.9rem;">TOTAL PLANILLA (QUINCENA)</h3>
                <p style="font-size: 2rem; font-weight: bold; margin: 0.5rem 0;">${formatearMoneda(planilla.totalPlanilla)}</p>
                <p style="margin: 0;">$${15} x ${planilla.empleadosActivos} x 15 días</p>
            </div>
            
            <div style="background: linear-gradient(135deg, #1976D2, #2196F3); color: white; padding: 1.5rem; border-radius: 10px;">
                <h3 style="margin: 0; font-size: 0.9rem;">GANANCIAS QUINCENA</h3>
                <p style="font-size: 2rem; font-weight: bold; margin: 0.5rem 0;">${formatearMoneda(planilla.ganancias)}</p>
                <p style="margin: 0;">Disponible para pago</p>
            </div>
            
            <div style="background: ${planilla.puedePagar ? 'linear-gradient(135deg, #2E7D32, #4CAF50)' : 'linear-gradient(135deg, #C62828, #D32F2F)'}; color: white; padding: 1.5rem; border-radius: 10px;">
                <h3 style="margin: 0; font-size: 0.9rem;">SALDO DESPUÉS DE PLANILLA</h3>
                <p style="font-size: 2rem; font-weight: bold; margin: 0.5rem 0;">${formatearMoneda(planilla.saldoRestante)}</p>
                <p style="margin: 0;">${planilla.puedePagar ? '✅ Suficiente para pagar' : '❌ Fondos insuficientes'}</p>
            </div>
        </div>
        
        <!-- Formulario para agregar empleado -->
        <div class="form-container" style="background: white; padding: 1.5rem; border-radius: 10px; margin-bottom: 2rem;">
            <h3>Agregar Nuevo Empleado</h3>
            <form id="form-empleado" onsubmit="event.preventDefault(); guardarEmpleado();">
                <div style="display: grid; grid-template-columns: 2fr 1fr auto; gap: 1rem; align-items: end;">
                    <div class="form-group">
                        <label for="nombre">Nombre completo:</label>
                        <input type="text" id="nombre" placeholder="Ej: Juan Pérez" required>
                    </div>
                    <div class="form-group">
                        <label for="activo">Estado:</label>
                        <select id="activo">
                            <option value="true">Activo</option>
                            <option value="false">Inactivo</option>
                        </select>
                    </div>
                    <button type="submit" class="btn btn-success" style="height: 42px;">➕ Agregar</button>
                </div>
            </form>
        </div>
        
        <!-- Tabla de empleados -->
        <div class="table-container">
            <h3>Lista de Empleados</h3>
            <table id="tabla-empleados">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Nombre</th>
                        <th>Estado</th>
                        <th>Costo Quincenal</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody id="empleados-body">
                    ${renderizarEmpleados()}
                </tbody>
                <tfoot>
                    <tr style="background-color: #f0f0f0; font-weight: bold;">
                        <td colspan="3" style="text-align: right;">TOTAL PLANILLA:</td>
                        <td>${formatearMoneda(planilla.totalPlanilla)}</td>
                        <td></td>
                    </tr>
                </tfoot>
            </table>
        </div>
        
        <!-- Botón para pagar planilla -->
        <div style="margin-top: 2rem; text-align: center;">
            <button class="btn btn-success" style="font-size: 1.2rem; padding: 1rem 2rem;" onclick="pagarPlanilla()" ${!planilla.puedePagar ? 'disabled style="opacity: 0.5;"' : ''}>
                💰 PAGAR PLANILLA QUINCENAL (${formatearMoneda(planilla.totalPlanilla)})
            </button>
            <p style="margin-top: 0.5rem; color: #666;">
                Se descontará del total de ganancias: ${formatearMoneda(planilla.ganancias)} → ${formatearMoneda(planilla.saldoRestante)}
            </p>
        </div>
        
        <button class="btn" style="margin-top: 1rem;" onclick="volverAlInicio()">← Volver al Inicio</button>
    `;
}

// Función para renderizar la tabla de empleados
function renderizarEmpleados() {
    if (empleados.length === 0) {
        return `<tr><td colspan="5" style="text-align: center; padding: 2rem;">No hay empleados registrados</td></tr>`;
    }
    
    return empleados.map((emp, index) => {
        const costoQuincenal = emp.activo ? 15 * 15 : 0; // $15/día * 15 días si está activo
        
        return `
            <tr style="${!emp.activo ? 'opacity: 0.6;' : ''}">
                <td>${emp.id || index + 1}</td>
                <td>${emp.nombre}</td>
                <td>
                    <span style="background-color: ${emp.activo ? '#4CAF50' : '#9E9E9E'}; color: white; padding: 0.3rem 0.8rem; border-radius: 20px; font-size: 0.8rem;">
                        ${emp.activo ? 'ACTIVO' : 'INACTIVO'}
                    </span>
                </td>
                <td>${costoQuincenal > 0 ? formatearMoneda(costoQuincenal) : '-'}</td>
                <td>
                    <button class="btn" style="background-color: var(--color-peligro); padding: 0.3rem 0.8rem;" onclick="eliminarEmpleado(${index})">
                        🗑️ Eliminar
                    </button>
                    <button class="btn" style="background-color: ${emp.activo ? '#9E9E9E' : '#4CAF50'}; padding: 0.3rem 0.8rem;" onclick="toggleEstadoEmpleado(${index})">
                        ${emp.activo ? '❌ Desactivar' : '✅ Activar'}
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// Función para guardar un nuevo empleado
function guardarEmpleado() {
    const nombre = document.getElementById('nombre').value;
    const activo = document.getElementById('activo').value === 'true';
    
    if (!nombre) {
        mostrarNotificacion('Por favor ingresa el nombre del empleado', 'error');
        return;
    }
    
    // Generar nuevo ID
    const nuevoId = empleados.length > 0 ? Math.max(...empleados.map(e => e.id || 0)) + 1 : 1;
    
    empleados.push({
        id: nuevoId,
        nombre: nombre,
        activo: activo
    });
    
    guardarEmpleados();
    
    // Actualizar interfaz
    const moduloEmpleados = document.getElementById('empleados');
    if (moduloEmpleados && moduloEmpleados.classList.contains('active')) {
        moduloEmpleados.innerHTML = mostrarEmpleados();
    }
    
    // Limpiar formulario
    document.getElementById('nombre').value = '';
    
    mostrarNotificacion('Empleado agregado correctamente', 'exito');
}

// Función para eliminar empleado
function eliminarEmpleado(index) {
    if (confirm('¿Estás seguro de eliminar este empleado?')) {
        empleados.splice(index, 1);
        guardarEmpleados();
        
        const moduloEmpleados = document.getElementById('empleados');
        if (moduloEmpleados && moduloEmpleados.classList.contains('active')) {
            moduloEmpleados.innerHTML = mostrarEmpleados();
        }
        
        mostrarNotificacion('Empleado eliminado', 'info');
    }
}

// Función para activar/desactivar empleado
function toggleEstadoEmpleado(index) {
    empleados[index].activo = !empleados[index].activo;
    guardarEmpleados();
    
    const moduloEmpleados = document.getElementById('empleados');
    if (moduloEmpleados && moduloEmpleados.classList.contains('active')) {
        moduloEmpleados.innerHTML = mostrarEmpleados();
    }
    
    mostrarNotificacion(`Empleado ${empleados[index].activo ? 'activado' : 'desactivado'}`, 'info');
}

// Función para pagar la planilla
function pagarPlanilla() {
    const planilla = calcularPlanilla();
    
    if (!planilla.puedePagar) {
        mostrarNotificacion('No hay suficientes ganancias para pagar la planilla', 'error');
        return;
    }
    
    if (confirm(`¿Confirmas el pago de planilla por ${formatearMoneda(planilla.totalPlanilla)}?\n\nSe descontará de las ganancias quincenales.`)) {
        // Obtener ganancias actuales
        let ganancias = obtenerGananciasQuincenales();
        
        // Descontar planilla
        ganancias -= planilla.totalPlanilla;
        
        // Guardar nuevas ganancias
        localStorage.setItem('gananciasQuincenales', ganancias.toString());
        
        // Registrar el pago en historial (opcional)
        const historialPagos = JSON.parse(localStorage.getItem('historialPagos') || '[]');
        historialPagos.push({
            fecha: new Date().toISOString(),
            monto: planilla.totalPlanilla,
            empleadosActivos: planilla.empleadosActivos
        });
        localStorage.setItem('historialPagos', JSON.stringify(historialPagos));
        
        // Actualizar interfaz
        const moduloEmpleados = document.getElementById('empleados');
        if (moduloEmpleados && moduloEmpleados.classList.contains('active')) {
            moduloEmpleados.innerHTML = mostrarEmpleados();
        }
        
        mostrarNotificacion(`Planilla pagada: ${formatearMoneda(planilla.totalPlanilla)}`, 'exito');
    }
}

// Función para actualizar ganancias desde otro módulo
function actualizarGananciasQuincenales(nuevasGanancias) {
    localStorage.setItem('gananciasQuincenales', nuevasGanancias.toString());
    
    // Si estamos en el módulo de empleados, actualizar vista
    const moduloEmpleados = document.getElementById('empleados');
    if (moduloEmpleados && moduloEmpleados.classList.contains('active')) {
        moduloEmpleados.innerHTML = mostrarEmpleados();
    }
}

// Función para volver al inicio
function volverAlInicio() {
    document.querySelector('[data-module="inicio"]').click();
}

// Inicializar
cargarEmpleados();

// Exponer funciones globalmente
window.mostrarEmpleados = mostrarEmpleados;
window.guardarEmpleado = guardarEmpleado;
window.eliminarEmpleado = eliminarEmpleado;
window.toggleEstadoEmpleado = toggleEstadoEmpleado;
window.pagarPlanilla = pagarPlanilla;
window.actualizarGananciasQuincenales = actualizarGananciasQuincenales;
window.volverAlInicio = volverAlInicio;

console.log('👥 Módulo de Empleados cargado');