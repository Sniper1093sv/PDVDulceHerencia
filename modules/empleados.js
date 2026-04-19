// modules/empleados.js - Módulo de gestión de empleados con Supabase

let empleados = [];

// Cargar empleados desde Supabase
async function cargarEmpleados() {
    const client = window.supabaseClient?.getClient();
    
    if (!client) {
        console.error('❌ Cliente Supabase no disponible');
        empleados = [];
        return;
    }
    
    try {
        const { data, error } = await client
            .from('empleados')
            .select('*')
            .order('id', { ascending: true });
        
        if (error) {
            console.error('Error cargando empleados:', error);
            empleados = [];
            return;
        }
        
        empleados = data || [];
        
        // Si no hay empleados, crear algunos de ejemplo
        if (empleados.length === 0) {
            await crearEmpleadosEjemplo();
        }
        
        console.log(`✅ ${empleados.length} empleados cargados desde Supabase`);
    } catch (e) {
        console.error('Error cargando empleados:', e);
        empleados = [];
    }
}

// Crear empleados de ejemplo
async function crearEmpleadosEjemplo() {
    const client = window.supabaseClient?.getClient();
    if (!client) return;
    
    const empleadosEjemplo = [
        { nombre: 'Juan Pérez', activo: true },
        { nombre: 'María García', activo: true },
        { nombre: 'Carlos López', activo: false }
    ];
    
    try {
        const { data, error } = await client
            .from('empleados')
            .insert(empleadosEjemplo)
            .select();
        
        if (error) {
            console.error('Error creando empleados de ejemplo:', error);
            return;
        }
        
        empleados = data || [];
        console.log('✅ Empleados de ejemplo creados');
    } catch (e) {
        console.error('Error creando empleados de ejemplo:', e);
    }
}

// Función para obtener ganancias quincenales desde Supabase
async function obtenerGananciasQuincenales() {
    const client = window.supabaseClient?.getClient();
    if (!client) {
        console.error('❌ Cliente Supabase no disponible');
        return 0;
    }
    
    try {
        // Calcular fecha de hace 15 días
        const hoy = new Date();
        const hace15Dias = new Date();
        hace15Dias.setDate(hoy.getDate() - 15);
        
        const fechaInicio = hace15Dias.toISOString().split('T')[0];
        const fechaFin = hoy.toISOString().split('T')[0];
        
        console.log(`📅 Consultando ventas desde ${fechaInicio} hasta ${fechaFin}`);
        
        const { data, error } = await client
            .from('ventas')
            .select('total')
            .gte('fecha', fechaInicio)
            .lte('fecha', fechaFin);
        
        if (error) {
            console.error('Error obteniendo ganancias quincenales:', error);
            return 0;
        }
        
        const total = (data || []).reduce((sum, v) => sum + (Number(v.total) || 0), 0);
        console.log(`💰 Ganancias quincenales calculadas: ${formatearMoneda(total)} (${data.length} ventas)`);
        
        return total;
    } catch (e) {
        console.error('Error calculando ganancias quincenales:', e);
        return 0;
    }
}

// Calcular planilla quincenal
async function calcularPlanilla() {
    const empleadosActivos = empleados.filter(e => e.activo).length;
    const totalPlanilla = empleadosActivos * 15 * 15; // $15/día * 15 días
    const ganancias = await obtenerGananciasQuincenales();
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
async function mostrarEmpleados() {
    await cargarEmpleados();
    const planilla = await calcularPlanilla();
    
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
                <p style="margin: 0;">$15 x ${planilla.empleadosActivos} x 15 días</p>
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
        
        <!-- Botones de acción -->
        <div style="display: flex; gap: 1rem; margin-bottom: 1rem;">
            <button class="btn btn-info" onclick="sincronizarEmpleados()">
                🔄 Sincronizar con Supabase
            </button>
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
                Se registrará el pago de planilla por ${formatearMoneda(planilla.totalPlanilla)}
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
    
    return empleados.map((emp) => {
        const costoQuincenal = emp.activo ? 15 * 15 : 0;
        
        return `
            <tr style="${!emp.activo ? 'opacity: 0.6;' : ''}">
                <td>${emp.id || ''}</td>
                <td>${emp.nombre || ''}</td>
                <td>
                    <span style="background-color: ${emp.activo ? '#4CAF50' : '#9E9E9E'}; color: white; padding: 0.3rem 0.8rem; border-radius: 20px; font-size: 0.8rem;">
                        ${emp.activo ? 'ACTIVO' : 'INACTIVO'}
                    </span>
                </td>
                <td>${costoQuincenal > 0 ? formatearMoneda(costoQuincenal) : '-'}</td>
                <td>
                    <button class="btn" style="background-color: var(--color-peligro); padding: 0.3rem 0.8rem; margin-right: 0.5rem;" onclick="eliminarEmpleado(${emp.id})">
                        🗑️ Eliminar
                    </button>
                    <button class="btn" style="background-color: ${emp.activo ? '#9E9E9E' : '#4CAF50'}; padding: 0.3rem 0.8rem;" onclick="toggleEstadoEmpleado(${emp.id})">
                        ${emp.activo ? '❌ Desactivar' : '✅ Activar'}
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// Función para guardar un nuevo empleado
async function guardarEmpleado() {
    const client = window.supabaseClient?.getClient();
    
    if (!client) {
        mostrarNotificacion('Error: Cliente Supabase no disponible', 'error');
        return;
    }
    
    const nombre = document.getElementById('nombre').value;
    const activo = document.getElementById('activo').value === 'true';
    
    if (!nombre) {
        mostrarNotificacion('Por favor ingresa el nombre del empleado', 'error');
        return;
    }
    
    const nuevoEmpleado = {
        nombre: nombre,
        activo: activo
    };
    
    try {
        const { data, error } = await client
            .from('empleados')
            .insert([nuevoEmpleado])
            .select();
        
        if (error) {
            console.error('Error guardando empleado:', error);
            mostrarNotificacion('Error al guardar empleado', 'error');
            return;
        }
        
        if (data && data[0]) {
            empleados.push(data[0]);
        }
        
        document.getElementById('nombre').value = '';
        
        const moduloEmpleados = document.getElementById('empleados');
        if (moduloEmpleados && moduloEmpleados.classList.contains('active')) {
            moduloEmpleados.innerHTML = await mostrarEmpleados();
        }
        
        mostrarNotificacion('Empleado agregado correctamente', 'exito');
    } catch (e) {
        console.error('Error guardando empleado:', e);
        mostrarNotificacion('Error al guardar empleado', 'error');
    }
}

// Función para eliminar empleado
async function eliminarEmpleado(id) {
    const client = window.supabaseClient?.getClient();
    
    if (!client) {
        mostrarNotificacion('Error: Cliente Supabase no disponible', 'error');
        return;
    }
    
    if (confirm('¿Estás seguro de eliminar este empleado?')) {
        try {
            const { error } = await client
                .from('empleados')
                .delete()
                .eq('id', id);
            
            if (error) {
                console.error('Error eliminando empleado:', error);
                mostrarNotificacion('Error al eliminar empleado', 'error');
                return;
            }
            
            const index = empleados.findIndex(e => e.id === id);
            if (index !== -1) {
                empleados.splice(index, 1);
            }
            
            const moduloEmpleados = document.getElementById('empleados');
            if (moduloEmpleados && moduloEmpleados.classList.contains('active')) {
                moduloEmpleados.innerHTML = await mostrarEmpleados();
            }
            
            mostrarNotificacion('Empleado eliminado', 'info');
        } catch (e) {
            console.error('Error eliminando empleado:', e);
            mostrarNotificacion('Error al eliminar empleado', 'error');
        }
    }
}

// Función para activar/desactivar empleado
async function toggleEstadoEmpleado(id) {
    const client = window.supabaseClient?.getClient();
    
    if (!client) {
        mostrarNotificacion('Error: Cliente Supabase no disponible', 'error');
        return;
    }
    
    const empleado = empleados.find(e => e.id === id);
    if (!empleado) return;
    
    const nuevoEstado = !empleado.activo;
    
    try {
        const { data, error } = await client
            .from('empleados')
            .update({ activo: nuevoEstado })
            .eq('id', id)
            .select();
        
        if (error) {
            console.error('Error actualizando empleado:', error);
            mostrarNotificacion('Error al actualizar empleado', 'error');
            return;
        }
        
        const index = empleados.findIndex(e => e.id === id);
        if (index !== -1 && data && data[0]) {
            empleados[index] = data[0];
        }
        
        const moduloEmpleados = document.getElementById('empleados');
        if (moduloEmpleados && moduloEmpleados.classList.contains('active')) {
            moduloEmpleados.innerHTML = await mostrarEmpleados();
        }
        
        mostrarNotificacion(`Empleado ${nuevoEstado ? 'activado' : 'desactivado'}`, 'info');
    } catch (e) {
        console.error('Error actualizando empleado:', e);
        mostrarNotificacion('Error al actualizar empleado', 'error');
    }
}

// Función para pagar la planilla
async function pagarPlanilla() {
    const planilla = await calcularPlanilla();
    
    if (!planilla.puedePagar) {
        mostrarNotificacion('No hay suficientes ganancias para pagar la planilla', 'error');
        return;
    }
    
    if (confirm(`¿Confirmas el registro de pago de planilla por ${formatearMoneda(planilla.totalPlanilla)}?`)) {
        mostrarNotificacion(`Planilla pagada: ${formatearMoneda(planilla.totalPlanilla)}`, 'exito');
        
        const moduloEmpleados = document.getElementById('empleados');
        if (moduloEmpleados && moduloEmpleados.classList.contains('active')) {
            moduloEmpleados.innerHTML = await mostrarEmpleados();
        }
    }
}

// Función para sincronizar manualmente
async function sincronizarEmpleados() {
    await cargarEmpleados();
    
    const moduloEmpleados = document.getElementById('empleados');
    if (moduloEmpleados && moduloEmpleados.classList.contains('active')) {
        moduloEmpleados.innerHTML = await mostrarEmpleados();
    }
    
    mostrarNotificacion('Empleados sincronizados con Supabase', 'exito');
}

// Función para obtener empleados activos
async function obtenerEmpleadosActivos() {
    await cargarEmpleados();
    return empleados.filter(e => e.activo).length;
}

// Función para calcular costo de planilla mensual
async function obtenerCostoPlanillaMensual() {
    const empleadosActivos = await obtenerEmpleadosActivos();
    return empleadosActivos * 15 * 30;
}

// Inicializar
(async function inicializar() {
    let intentos = 0;
    const maxIntentos = 50;
    
    while (!window.supabaseClient?.isReady() && intentos < maxIntentos) {
        await new Promise(resolve => setTimeout(resolve, 100));
        intentos++;
    }
    
    if (window.supabaseClient?.isReady()) {
        await cargarEmpleados();
        console.log('✅ Módulo de Empleados inicializado con Supabase');
    } else {
        console.error('❌ No se pudo conectar con Supabase');
    }
})();

// Exponer funciones globalmente
window.mostrarEmpleados = mostrarEmpleados;
window.guardarEmpleado = guardarEmpleado;
window.eliminarEmpleado = eliminarEmpleado;
window.toggleEstadoEmpleado = toggleEstadoEmpleado;
window.pagarPlanilla = pagarPlanilla;
window.sincronizarEmpleados = sincronizarEmpleados;
window.obtenerEmpleadosActivos = obtenerEmpleadosActivos;
window.obtenerCostoPlanillaMensual = obtenerCostoPlanillaMensual;

console.log('👥 Módulo de Empleados (Supabase) cargado correctamente');