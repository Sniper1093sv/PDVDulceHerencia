// modules/ganancias.js - Cálculo de ganancias y metas con Supabase

// Variables para las metas (valores por defecto)
let metas = {
    diaria: 100,
    quincenal: 1500,
    mensual: 2500
};

// Variable para inversiones
let inversiones = [];

// Cargar metas desde Supabase
async function cargarMetas() {
    const client = window.supabaseClient?.getClient();
    
    if (!client) {
        console.error('❌ Cliente Supabase no disponible');
        return;
    }
    
    try {
        const { data, error } = await client
            .from('metas')
            .select('*')
            .eq('id', 1)
            .single();
        
        if (error) {
            console.error('Error cargando metas:', error);
            return;
        }
        
        if (data) {
            metas = {
                diaria: Number(data.diaria) || 100,
                quincenal: Number(data.quincenal) || 1500,
                mensual: Number(data.mensual) || 2500
            };
        }
        
        console.log('✅ Metas cargadas desde Supabase');
    } catch (e) {
        console.error('Error cargando metas:', e);
    }
}

// Guardar metas en Supabase
async function guardarMetas() {
    const client = window.supabaseClient?.getClient();
    
    if (!client) {
        console.error('❌ Cliente Supabase no disponible');
        return;
    }
    
    try {
        const { error } = await client
            .from('metas')
            .upsert({
                id: 1,
                diaria: metas.diaria,
                quincenal: metas.quincenal,
                mensual: metas.mensual,
                updated_at: new Date()
            });
        
        if (error) {
            console.error('Error guardando metas:', error);
        }
    } catch (e) {
        console.error('Error guardando metas:', e);
    }
}

// Cargar inversiones desde Supabase
async function cargarInversiones() {
    const client = window.supabaseClient?.getClient();
    
    if (!client) {
        console.error('❌ Cliente Supabase no disponible');
        inversiones = [];
        return;
    }
    
    try {
        const { data, error } = await client
            .from('inversiones')
            .select('*')
            .order('fecha', { ascending: false });
        
        if (error) {
            console.error('Error cargando inversiones:', error);
            inversiones = [];
            return;
        }
        
        inversiones = (data || []).map(inv => ({
            ...inv,
            monto: Number(inv.monto) || 0
        }));
        
        console.log(`✅ ${inversiones.length} inversiones cargadas desde Supabase`);
    } catch (e) {
        console.error('Error cargando inversiones:', e);
        inversiones = [];
    }
}

// Función para guardar inversión
async function guardarInversionManual() {
    const client = window.supabaseClient?.getClient();
    
    if (!client) {
        mostrarNotificacion('Error: Cliente Supabase no disponible', 'error');
        return;
    }
    
    const fecha = document.getElementById('inv-fecha')?.value;
    const categoria = document.getElementById('inv-categoria')?.value;
    const descripcion = document.getElementById('inv-descripcion')?.value;
    const monto = parseFloat(document.getElementById('inv-monto')?.value);
    
    if (!fecha || !categoria || isNaN(monto)) {
        mostrarNotificacion('Completa fecha, categoría y monto', 'error');
        return;
    }
    
    const nuevaInversion = {
        fecha: fecha,
        categoria: categoria,
        descripcion: descripcion || '',
        monto: monto
    };
    
    try {
        const { data, error } = await client
            .from('inversiones')
            .insert([nuevaInversion])
            .select();
        
        if (error) {
            console.error('Error guardando inversión:', error);
            mostrarNotificacion('Error al guardar inversión', 'error');
            return;
        }
        
        // Agregar a lista local
        if (data && data[0]) {
            inversiones.push({
                ...data[0],
                monto: Number(data[0].monto) || 0
            });
        }
        
        // Limpiar campos
        const fechaInput = document.getElementById('inv-fecha');
        const categoriaSelect = document.getElementById('inv-categoria');
        const descripcionInput = document.getElementById('inv-descripcion');
        const montoInput = document.getElementById('inv-monto');
        
        if (fechaInput) fechaInput.value = new Date().toISOString().split('T')[0];
        if (categoriaSelect) categoriaSelect.value = 'general';
        if (descripcionInput) descripcionInput.value = '';
        if (montoInput) montoInput.value = '';
        
        actualizarTablaInversiones();
        
        // Actualizar vista principal
        const moduloGanancias = document.getElementById('ganancias');
        if (moduloGanancias && moduloGanancias.classList.contains('active')) {
            moduloGanancias.innerHTML = await mostrarGanancias();
        }
        
        mostrarNotificacion('Inversión guardada', 'exito');
    } catch (e) {
        console.error('Error guardando inversión:', e);
        mostrarNotificacion('Error al guardar inversión', 'error');
    }
}

// Función para eliminar inversión
async function eliminarInversion(id) {
    const client = window.supabaseClient?.getClient();
    
    if (!client) {
        mostrarNotificacion('Error: Cliente Supabase no disponible', 'error');
        return;
    }
    
    if (confirm('¿Eliminar esta inversión?')) {
        try {
            const { error } = await client
                .from('inversiones')
                .delete()
                .eq('id', id);
            
            if (error) {
                console.error('Error eliminando inversión:', error);
                mostrarNotificacion('Error al eliminar', 'error');
                return;
            }
            
            // Actualizar lista local
            const index = inversiones.findIndex(i => i.id === id);
            if (index !== -1) {
                inversiones.splice(index, 1);
            }
            
            actualizarTablaInversiones();
            
            const moduloGanancias = document.getElementById('ganancias');
            if (moduloGanancias && moduloGanancias.classList.contains('active')) {
                moduloGanancias.innerHTML = await mostrarGanancias();
            }
            
            mostrarNotificacion('Inversión eliminada', 'info');
        } catch (e) {
            console.error('Error eliminando inversión:', e);
            mostrarNotificacion('Error al eliminar', 'error');
        }
    }
}

// Función para mostrar modal de inversiones
function mostrarModalInversiones() {
    const modal = document.getElementById('modal-inversiones');
    if (modal) {
        actualizarTablaInversiones();
        modal.style.display = 'flex';
    }
}

function cerrarModalInversiones() {
    const modal = document.getElementById('modal-inversiones');
    if (modal) {
        modal.style.display = 'none';
    }
}

function actualizarTablaInversiones() {
    const tbody = document.getElementById('inversiones-tbody');
    if (!tbody) return;
    
    if (inversiones.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">No hay inversiones registradas</td></tr>';
        return;
    }
    
    tbody.innerHTML = inversiones.map(inv => `
        <tr>
            <td>${inv.fecha ? new Date(inv.fecha).toLocaleDateString('es-ES') : ''}</td>
            <td>${inv.categoria || 'General'}</td>
            <td>${inv.descripcion || '-'}</td>
            <td class="negativo">${formatearMoneda(inv.monto || 0)}</td>
            <td>
                <button class="btn" style="background-color: var(--color-peligro); padding: 0.2rem 0.5rem;" onclick="eliminarInversion(${inv.id})">
                    🗑️
                </button>
            </td>
        </tr>
    `).join('');
}

// Función para mostrar el modal de configuración de metas
function mostrarModalMetas() {
    const modal = document.getElementById('modal-metas');
    if (modal) {
        document.getElementById('meta-diaria').value = metas.diaria;
        document.getElementById('meta-quincenal').value = metas.quincenal;
        document.getElementById('meta-mensual').value = metas.mensual;
        modal.style.display = 'flex';
    }
}

// Función para guardar las metas
async function guardarMetasConfig() {
    const diaria = parseFloat(document.getElementById('meta-diaria')?.value);
    const quincenal = parseFloat(document.getElementById('meta-quincenal')?.value);
    const mensual = parseFloat(document.getElementById('meta-mensual')?.value);
    
    if (isNaN(diaria) || isNaN(quincenal) || isNaN(mensual)) {
        mostrarNotificacion('Ingresa valores válidos', 'error');
        return;
    }
    
    metas = { diaria, quincenal, mensual };
    await guardarMetas();
    cerrarModalMetas();
    
    // Actualizar la vista si estamos en el módulo de ganancias
    const moduloGanancias = document.getElementById('ganancias');
    if (moduloGanancias && moduloGanancias.classList.contains('active')) {
        moduloGanancias.innerHTML = await mostrarGanancias();
    }
    
    mostrarNotificacion('Metas actualizadas', 'exito');
}

function cerrarModalMetas() {
    const modal = document.getElementById('modal-metas');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Obtener ventas desde Supabase
async function obtenerVentas() {
    const client = window.supabaseClient?.getClient();
    
    if (!client) {
        return [];
    }
    
    try {
        const { data, error } = await client
            .from('ventas')
            .select('*')
            .order('fecha', { ascending: false });
        
        if (error) {
            console.error('Error obteniendo ventas:', error);
            return [];
        }
        
        return (data || []).map(v => ({
            ...v,
            total: Number(v.total) || 0,
            unidadesVendidas: Number(v.unidades_vendidas) || 0,
            cantidad: Number(v.cantidad) || 0,
            productoId: v.producto_id,
            productoNombre: v.producto_nombre
        }));
    } catch (e) {
        console.error('Error obteniendo ventas:', e);
        return [];
    }
}

// Función para calcular el progreso de metas
function calcularProgresoMetas(ventas) {
    const hoy = new Date();
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    
    // Calcular inicio de quincena (día 1 o 16)
    const inicioQuincena = hoy.getDate() <= 15 
        ? new Date(hoy.getFullYear(), hoy.getMonth(), 1)
        : new Date(hoy.getFullYear(), hoy.getMonth(), 16);
    
    // Ventas de hoy
    const hoyStr = hoy.toISOString().split('T')[0];
    const ventasHoy = ventas.filter(v => v.fecha === hoyStr);
    const totalHoy = ventasHoy.reduce((sum, v) => sum + (Number(v.total) || 0), 0);
    
    // Ventas de la quincena actual
    const ventasQuincena = ventas.filter(v => new Date(v.fecha) >= inicioQuincena);
    const totalQuincena = ventasQuincena.reduce((sum, v) => sum + (Number(v.total) || 0), 0);
    
    // Ventas del mes actual
    const ventasMes = ventas.filter(v => new Date(v.fecha) >= inicioMes);
    const totalMes = ventasMes.reduce((sum, v) => sum + (Number(v.total) || 0), 0);
    
    // Calcular días restantes para contexto
    const diasTranscurridosMes = hoy.getDate();
    const diasEnMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).getDate();
    const diasRestantesMes = diasEnMes - diasTranscurridosMes;
    
    const diasTranscurridosQuincena = hoy.getDate() <= 15 ? hoy.getDate() : hoy.getDate() - 15;
    const diasEnQuincena = hoy.getDate() <= 15 ? 15 : diasEnMes - 15;
    const diasRestantesQuincena = diasEnQuincena - diasTranscurridosQuincena;
    
    return {
        diaria: {
            actual: totalHoy,
            meta: metas.diaria,
            porcentaje: Math.min(100, (totalHoy / metas.diaria) * 100),
            cumplida: totalHoy >= metas.diaria,
            restante: Math.max(0, metas.diaria - totalHoy)
        },
        quincenal: {
            actual: totalQuincena,
            meta: metas.quincenal,
            porcentaje: Math.min(100, (totalQuincena / metas.quincenal) * 100),
            cumplida: totalQuincena >= metas.quincenal,
            restante: Math.max(0, metas.quincenal - totalQuincena),
            diasRestantes: diasRestantesQuincena,
            promedioNecesario: diasRestantesQuincena > 0 ? (metas.quincenal - totalQuincena) / diasRestantesQuincena : 0
        },
        mensual: {
            actual: totalMes,
            meta: metas.mensual,
            porcentaje: Math.min(100, (totalMes / metas.mensual) * 100),
            cumplida: totalMes >= metas.mensual,
            restante: Math.max(0, metas.mensual - totalMes),
            diasRestantes: diasRestantesMes,
            promedioNecesario: diasRestantesMes > 0 ? (metas.mensual - totalMes) / diasRestantesMes : 0
        }
    };
}

// Función para renderizar las barras de progreso
function renderizarBarraProgreso(porcentaje, color = '#8B4513', altura = '20px') {
    const ancho = Math.min(100, Math.max(0, porcentaje));
    return `
        <div style="width: 100%; height: ${altura}; background: #f0f0f0; border-radius: 10px; overflow: hidden; margin: 5px 0;">
            <div style="width: ${ancho}%; height: 100%; background: ${color}; transition: width 0.3s;"></div>
        </div>
    `;
}

// Función para renderizar productos más vendidos
function renderizarProductosMasVendidos(ventas) {
    const ventasPorProducto = {};
    
    ventas.forEach(v => {
        if (!ventasPorProducto[v.productoNombre]) {
            ventasPorProducto[v.productoNombre] = {
                cantidad: 0,
                unidades: 0,
                total: 0
            };
        }
        ventasPorProducto[v.productoNombre].cantidad += v.cantidad || 1;
        ventasPorProducto[v.productoNombre].unidades += v.unidadesVendidas || 0;
        ventasPorProducto[v.productoNombre].total += v.total || 0;
    });
    
    const ranking = Object.entries(ventasPorProducto)
        .map(([nombre, datos]) => ({ nombre, ...datos }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 5);
    
    if (ranking.length === 0) {
        return '<p>No hay datos de ventas</p>';
    }
    
    return `
        <table style="width:100%;">
            <thead>
                <tr>
                    <th>Producto</th>
                    <th>Ventas</th>
                    <th>Unidades</th>
                    <th>Total</th>
                </tr>
            </thead>
            <tbody>
                ${ranking.map(p => `
                    <tr>
                        <td><strong>${p.nombre}</strong></td>
                        <td>${p.cantidad}</td>
                        <td>${p.unidades}</td>
                        <td>${formatearMoneda(p.total)}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

// Función principal para mostrar el módulo de ganancias
async function mostrarGanancias() {
    // Cargar datos
    await cargarMetas();
    await cargarInversiones();
    
    const ventas = await obtenerVentas();
    
    // Calcular progreso de metas
    const progreso = calcularProgresoMetas(ventas);
    
    // Calcular totales por período
    const hoy = new Date().toISOString().split('T')[0];
    const fechaSemana = new Date();
    fechaSemana.setDate(fechaSemana.getDate() - 7);
    const fechaMes = new Date();
    fechaMes.setMonth(fechaMes.getMonth() - 1);
    
    const ventasHoy = ventas.filter(v => v.fecha === hoy);
    const ventasSemana = ventas.filter(v => new Date(v.fecha) >= fechaSemana);
    const ventasMes = ventas.filter(v => new Date(v.fecha) >= fechaMes);
    
    const totalHoy = ventasHoy.reduce((sum, v) => sum + (Number(v.total) || 0), 0);
    const totalSemana = ventasSemana.reduce((sum, v) => sum + (Number(v.total) || 0), 0);
    const totalMes = ventasMes.reduce((sum, v) => sum + (Number(v.total) || 0), 0);
    const totalGeneral = ventas.reduce((sum, v) => sum + (Number(v.total) || 0), 0);
    
    // Calcular unidades totales
    const unidadesHoy = ventasHoy.reduce((sum, v) => sum + (Number(v.unidadesVendidas) || 0), 0);
    const unidadesMes = ventasMes.reduce((sum, v) => sum + (Number(v.unidadesVendidas) || 0), 0);
    const unidadesTotal = ventas.reduce((sum, v) => sum + (Number(v.unidadesVendidas) || 0), 0);
    
    // Obtener empleados activos y costo de planilla
    let empleadosActivos = 0;
    if (window.obtenerEmpleadosActivos) {
        empleadosActivos = await window.obtenerEmpleadosActivos();
    }
    const costoPlanillaMensual = empleadosActivos * 15 * 30;
    
    // Calcular total de inversiones
    const totalInversiones = inversiones.reduce((sum, inv) => sum + (inv.monto || 0), 0);
    
    // Calcular ganancia neta
    const gananciaNeta = totalGeneral - totalInversiones - costoPlanillaMensual;
    
    return `
        <h2>📊 Análisis de Ganancias y Metas</h2>
        
        <!-- Botones de acción -->
        <div style="margin-bottom: 2rem; display: flex; gap: 1rem; flex-wrap: wrap;">
            <button class="btn btn-info" onclick="mostrarModalInversiones()">
                💰 Editar Inversiones
            </button>
            <button class="btn btn-info" onclick="window.generarPDFGanancias ? window.generarPDFGanancias() : mostrarNotificacion('Módulo de exportación no disponible', 'error')">
                📄 Exportar a PDF
            </button>
            <button class="btn btn-info" onclick="mostrarModalMetas()">
                ⚙️ Configurar Metas
            </button>
            <button class="btn btn-info" onclick="sincronizarGanancias()">
                🔄 Sincronizar
            </button>
        </div>
        
        <!-- Sección de Metas -->
        <div style="background: white; padding: 1.5rem; border-radius: 10px; margin-bottom: 2rem;">
            <h3>🎯 Progreso de Metas</h3>
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 2rem;">
                
                <!-- Meta Diaria -->
                <div style="text-align: center;">
                    <div style="font-size: 1.2rem; margin-bottom: 0.5rem;">
                        <span style="color: ${progreso.diaria.cumplida ? '#2E7D32' : '#8B4513'}">
                            ${progreso.diaria.cumplida ? '✅' : '🎯'} Meta Diaria
                        </span>
                    </div>
                    <div style="font-size: 1.5rem; font-weight: bold;">
                        ${formatearMoneda(progreso.diaria.actual)}
                        <span style="font-size: 1rem; color: #666;">/ ${formatearMoneda(progreso.diaria.meta)}</span>
                    </div>
                    ${renderizarBarraProgreso(progreso.diaria.porcentaje, progreso.diaria.cumplida ? '#2E7D32' : '#8B4513')}
                    <div style="margin-top: 0.5rem;">
                        <span style="color: ${progreso.diaria.cumplida ? '#2E7D32' : '#666'};">
                            ${progreso.diaria.porcentaje.toFixed(1)}% cumplido
                        </span>
                        ${!progreso.diaria.cumplida ? `
                            <br><small>Faltan ${formatearMoneda(progreso.diaria.restante)}</small>
                        ` : ''}
                    </div>
                </div>
                
                <!-- Meta Quincenal -->
                <div style="text-align: center;">
                    <div style="font-size: 1.2rem; margin-bottom: 0.5rem;">
                        <span style="color: ${progreso.quincenal.cumplida ? '#2E7D32' : '#8B4513'}">
                            ${progreso.quincenal.cumplida ? '✅' : '🎯'} Meta Quincenal
                        </span>
                    </div>
                    <div style="font-size: 1.5rem; font-weight: bold;">
                        ${formatearMoneda(progreso.quincenal.actual)}
                        <span style="font-size: 1rem; color: #666;">/ ${formatearMoneda(progreso.quincenal.meta)}</span>
                    </div>
                    ${renderizarBarraProgreso(progreso.quincenal.porcentaje, progreso.quincenal.cumplida ? '#2E7D32' : '#8B4513')}
                    <div style="margin-top: 0.5rem;">
                        <span style="color: ${progreso.quincenal.cumplida ? '#2E7D32' : '#666'};">
                            ${progreso.quincenal.porcentaje.toFixed(1)}% cumplido
                        </span>
                        ${!progreso.quincenal.cumplida ? `
                            <br><small>Faltan ${formatearMoneda(progreso.quincenal.restante)} | ${progreso.quincenal.diasRestantes} días</small>
                            ${progreso.quincenal.promedioNecesario > 0 ? `
                                <br><small>Necesitas ${formatearMoneda(progreso.quincenal.promedioNecesario)}/día</small>
                            ` : ''}
                        ` : ''}
                    </div>
                </div>
                
                <!-- Meta Mensual -->
                <div style="text-align: center;">
                    <div style="font-size: 1.2rem; margin-bottom: 0.5rem;">
                        <span style="color: ${progreso.mensual.cumplida ? '#2E7D32' : '#8B4513'}">
                            ${progreso.mensual.cumplida ? '✅' : '🎯'} Meta Mensual
                        </span>
                    </div>
                    <div style="font-size: 1.5rem; font-weight: bold;">
                        ${formatearMoneda(progreso.mensual.actual)}
                        <span style="font-size: 1rem; color: #666;">/ ${formatearMoneda(progreso.mensual.meta)}</span>
                    </div>
                    ${renderizarBarraProgreso(progreso.mensual.porcentaje, progreso.mensual.cumplida ? '#2E7D32' : '#8B4513')}
                    <div style="margin-top: 0.5rem;">
                        <span style="color: ${progreso.mensual.cumplida ? '#2E7D32' : '#666'};">
                            ${progreso.mensual.porcentaje.toFixed(1)}% cumplido
                        </span>
                        ${!progreso.mensual.cumplida ? `
                            <br><small>Faltan ${formatearMoneda(progreso.mensual.restante)} | ${progreso.mensual.diasRestantes} días</small>
                            ${progreso.mensual.promedioNecesario > 0 ? `
                                <br><small>Necesitas ${formatearMoneda(progreso.mensual.promedioNecesario)}/día</small>
                            ` : ''}
                        ` : ''}
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Tarjetas de resumen por período -->
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 2rem;">
            <div style="background: linear-gradient(135deg, #2E7D32, #4CAF50); color: white; padding: 1.5rem; border-radius: 10px;">
                <h3 style="margin:0; font-size:0.9rem;">HOY</h3>
                <p style="font-size:1.8rem; font-weight:bold; margin:0.5rem 0;">${formatearMoneda(totalHoy)}</p>
                <p style="margin:0;">${unidadesHoy} unidades | ${ventasHoy.length} ventas</p>
            </div>
            
            <div style="background: linear-gradient(135deg, #1976D2, #2196F3); color: white; padding: 1.5rem; border-radius: 10px;">
                <h3 style="margin:0; font-size:0.9rem;">ÚLTIMOS 7 DÍAS</h3>
                <p style="font-size:1.8rem; font-weight:bold; margin:0.5rem 0;">${formatearMoneda(totalSemana)}</p>
                <p style="margin:0;">${ventasSemana.length} ventas</p>
            </div>
            
            <div style="background: linear-gradient(135deg, #8B4513, #D2691E); color: white; padding: 1.5rem; border-radius: 10px;">
                <h3 style="margin:0; font-size:0.9rem;">ÚLTIMOS 30 DÍAS</h3>
                <p style="font-size:1.8rem; font-weight:bold; margin:0.5rem 0;">${formatearMoneda(totalMes)}</p>
                <p style="margin:0;">${unidadesMes} unidades | ${ventasMes.length} ventas</p>
            </div>
            
            <div style="background: linear-gradient(135deg, #9C27B0, #BA68C8); color: white; padding: 1.5rem; border-radius: 10px;">
                <h3 style="margin:0; font-size:0.9rem;">TOTAL HISTÓRICO</h3>
                <p style="font-size:1.8rem; font-weight:bold; margin:0.5rem 0;">${formatearMoneda(totalGeneral)}</p>
                <p style="margin:0;">${unidadesTotal} unidades | ${ventas.length} ventas</p>
            </div>
        </div>
        
        <!-- Análisis de gastos -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-bottom: 2rem;">
            <div style="background: white; padding: 1.5rem; border-radius: 10px;">
                <h3>💰 Análisis Financiero</h3>
                <table style="width:100%;">
                    <tr>
                        <td>Ingresos Totales:</td>
                        <td><strong style="color: #2E7D32;">${formatearMoneda(totalGeneral)}</strong></td>
                    </tr>
                    <tr>
                        <td>Total Inversiones:</td>
                        <td><strong style="color: #C62828;">-${formatearMoneda(totalInversiones)}</strong></td>
                    </tr>
                    <tr>
                        <td>Costo Planilla (Mensual):</td>
                        <td><strong style="color: #C62828;">-${formatearMoneda(costoPlanillaMensual)}</strong></td>
                    </tr>
                    <tr style="border-top: 2px solid #ddd;">
                        <td><strong>GANANCIA NETA:</strong></td>
                        <td><strong style="color: ${gananciaNeta > 0 ? '#2E7D32' : '#C62828'}; font-size: 1.2rem;">
                            ${formatearMoneda(gananciaNeta)}
                        </strong></td>
                    </tr>
                </table>
                <p style="margin-top: 1rem; font-size: 0.9rem; color: #666;">
                    <em>💡 Puedes editar las inversiones usando el botón "Editar Inversiones"</em>
                </p>
            </div>
            
            <div style="background: white; padding: 1.5rem; border-radius: 10px;">
                <h3>📈 Proyecciones y Métricas</h3>
                <table style="width:100%;">
                    <tr>
                        <td>Promedio por venta:</td>
                        <td><strong>${formatearMoneda(totalGeneral / (ventas.length || 1))}</strong></td>
                    </tr>
                    <tr>
                        <td>Promedio unidades/venta:</td>
                        <td><strong>${(unidadesTotal / (ventas.length || 1)).toFixed(1)} und</strong></td>
                    </tr>
                    <tr>
                        <td>Rentabilidad:</td>
                        <td><strong style="color: ${gananciaNeta > 0 ? '#2E7D32' : '#C62828'}">
                            ${((gananciaNeta / (totalGeneral || 1)) * 100).toFixed(1)}%
                        </strong></td>
                    </tr>
                    <tr>
                        <td>Días para recuperar inversión:</td>
                        <td><strong>${(totalInversiones / (totalHoy || 1)).toFixed(1)} días</strong></td>
                    </tr>
                </table>
            </div>
        </div>
        
        <!-- Productos más vendidos -->
        <div style="background: white; padding: 1.5rem; border-radius: 10px; margin-bottom: 2rem;">
            <h3>🥐 Top 5 Productos Más Vendidos</h3>
            <div style="overflow-x: auto;">
                ${renderizarProductosMasVendidos(ventas)}
            </div>
        </div>
        
        <button class="btn" style="margin-top: 1rem;" onclick="volverAlInicio()">← Volver al Inicio</button>
        
        <!-- Modal para configurar metas -->
        <div id="modal-metas" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); justify-content: center; align-items: center; z-index: 1000;">
            <div style="background: white; padding: 2rem; border-radius: 10px; width: 400px;">
                <h3 style="margin-top: 0;">🎯 Configurar Metas</h3>
                <div class="form-group">
                    <label for="meta-diaria">Meta Diaria ($):</label>
                    <input type="number" id="meta-diaria" step="0.01" min="0" value="${metas.diaria}" required>
                </div>
                <div class="form-group">
                    <label for="meta-quincenal">Meta Quincenal ($):</label>
                    <input type="number" id="meta-quincenal" step="0.01" min="0" value="${metas.quincenal}" required>
                </div>
                <div class="form-group">
                    <label for="meta-mensual">Meta Mensual ($):</label>
                    <input type="number" id="meta-mensual" step="0.01" min="0" value="${metas.mensual}" required>
                </div>
                <div style="display: flex; gap: 1rem; justify-content: flex-end;">
                    <button class="btn" onclick="cerrarModalMetas()">Cancelar</button>
                    <button class="btn btn-success" onclick="guardarMetasConfig()">Guardar Metas</button>
                </div>
            </div>
        </div>
        
        <!-- Modal para editar inversiones -->
        <div id="modal-inversiones" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); justify-content: center; align-items: center; z-index: 1000;">
            <div style="background: white; padding: 2rem; border-radius: 10px; width: 600px; max-height: 80vh; overflow-y: auto;">
                <h3 style="margin-top: 0;">💰 Editar Inversiones</h3>
                
                <div style="background: #f5f5f5; padding: 1rem; border-radius: 5px; margin-bottom: 1rem;">
                    <h4>Agregar Nueva Inversión</h4>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem;">
                        <div class="form-group">
                            <label>Fecha:</label>
                            <input type="date" id="inv-fecha" value="${new Date().toISOString().split('T')[0]}">
                        </div>
                        <div class="form-group">
                            <label>Categoría:</label>
                            <select id="inv-categoria">
                                <option value="general">General</option>
                                <option value="instrumentos">Instrumentos</option>
                                <option value="materia_prima">Materia Prima</option>
                                <option value="equipos">Equipos</option>
                                <option value="renovacion">Renovación</option>
                                <option value="otros">Otros</option>
                            </select>
                        </div>
                        <div class="form-group" style="grid-column: span 2;">
                            <label>Descripción:</label>
                            <input type="text" id="inv-descripcion" placeholder="Ej: Horno nuevo, Harina, etc.">
                        </div>
                        <div class="form-group">
                            <label>Monto ($):</label>
                            <input type="number" id="inv-monto" step="0.01" min="0">
                        </div>
                        <div style="display: flex; align-items: flex-end;">
                            <button class="btn btn-success" onclick="guardarInversionManual()">➕ Agregar</button>
                        </div>
                    </div>
                </div>
                
                <h4>Inversiones Registradas</h4>
                <div style="max-height: 300px; overflow-y: auto;">
                    <table style="width:100%;">
                        <thead>
                            <tr>
                                <th>Fecha</th>
                                <th>Categoría</th>
                                <th>Descripción</th>
                                <th>Monto</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody id="inversiones-tbody">
                            <tr><td colspan="5" style="text-align: center;">Cargando...</td></tr>
                        </tbody>
                    </table>
                </div>
                
                <div style="margin-top: 1rem; text-align: right;">
                    <button class="btn" onclick="cerrarModalInversiones()">Cerrar</button>
                </div>
            </div>
        </div>
    `;
}

// Función para sincronizar manualmente
async function sincronizarGanancias() {
    await cargarMetas();
    await cargarInversiones();
    
    const moduloGanancias = document.getElementById('ganancias');
    if (moduloGanancias && moduloGanancias.classList.contains('active')) {
        moduloGanancias.innerHTML = await mostrarGanancias();
    }
    
    mostrarNotificacion('Datos sincronizados con Supabase', 'exito');
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
        await cargarMetas();
        await cargarInversiones();
        console.log('✅ Módulo de Ganancias inicializado con Supabase');
    } else {
        console.error('❌ No se pudo conectar con Supabase');
    }
})();

// Exponer funciones
window.mostrarGanancias = mostrarGanancias;
window.mostrarModalMetas = mostrarModalMetas;
window.guardarMetasConfig = guardarMetasConfig;
window.cerrarModalMetas = cerrarModalMetas;
window.mostrarModalInversiones = mostrarModalInversiones;
window.cerrarModalInversiones = cerrarModalInversiones;
window.guardarInversionManual = guardarInversionManual;
window.eliminarInversion = eliminarInversion;
window.sincronizarGanancias = sincronizarGanancias;

console.log('📊 Módulo de Ganancias (Supabase) cargado correctamente');