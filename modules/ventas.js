// modules/ventas.js - Historial de ventas con Supabase

let ventas = [];
let productosCatalogo = [];

// Cargar datos desde Supabase
async function cargarVentas() {
    const client = window.supabaseClient?.getClient();
    
    if (!client) {
        console.error('❌ Cliente Supabase no disponible');
        ventas = [];
        return;
    }
    
    try {
        const { data, error } = await client
            .from('ventas')
            .select('*')
            .order('id', { ascending: false });
        
        if (error) {
            console.error('Error cargando ventas:', error);
            ventas = [];
            return;
        }
        
        ventas = (data || []).map(v => ({
            ...v,
            id: v.id,
            fecha: v.fecha,
            productoId: v.producto_id,
            productoNombre: v.producto_nombre,
            tipo: v.tipo,
            unidadesPorPresentacion: v.unidades_por_presentacion || 1,
            cantidad: Number(v.cantidad) || 0,
            unidadesVendidas: Number(v.unidades_vendidas) || 0,
            precioUnitario: Number(v.precio_unitario) || 0,
            total: Number(v.total) || 0
        }));
        
        console.log(`✅ ${ventas.length} ventas cargadas desde Supabase`);
    } catch (e) {
        console.error('Error cargando ventas:', e);
        ventas = [];
    }
}

async function cargarProductosCatalogo() {
    const client = window.supabaseClient?.getClient();
    
    if (!client) {
        productosCatalogo = [];
        return;
    }
    
    try {
        const { data, error } = await client
            .from('productos')
            .select('*')
            .order('id', { ascending: true });
        
        if (error) {
            console.error('Error cargando productos:', error);
            productosCatalogo = [];
            return;
        }
        
        productosCatalogo = data || [];
    } catch (e) {
        console.error('Error cargando productos:', e);
        productosCatalogo = [];
    }
}

// Función para calcular total general
function calcularTotalGeneral() {
    return ventas.reduce((sum, v) => sum + (Number(v.total) || 0), 0);
}

// Función para mostrar el historial de ventas
async function mostrarVentas() {
    console.log('Cargando historial de ventas desde Supabase...');
    
    // Mostrar loading mientras carga
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = `
        <h2>📋 Historial de Ventas</h2>
        <div style="text-align: center; padding: 3rem;">
            <p style="font-size: 1.2rem;">🔄 Cargando datos desde Supabase...</p>
        </div>
    `;
    
    const moduloActual = document.getElementById('historial-ventas');
    if (moduloActual) {
        moduloActual.innerHTML = tempDiv.innerHTML;
    }
    
    await cargarVentas();
    await cargarProductosCatalogo();
    
    const ventasOrdenadas = [...ventas].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    const totalGeneral = calcularTotalGeneral();
    const totalUnidades = ventas.reduce((sum, v) => sum + (v.unidadesVendidas || 0), 0);
    
    // Agrupar ventas por día para estadísticas
    const ventasPorDia = {};
    ventas.forEach(v => {
        ventasPorDia[v.fecha] = (ventasPorDia[v.fecha] || 0) + (Number(v.total) || 0);
    });
    
    const diasConVentas = Object.keys(ventasPorDia).length;
    const promedioDiario = diasConVentas > 0 ? totalGeneral / diasConVentas : 0;
    
    return `
        <h2>📋 Historial de Ventas</h2>
        
        <div style="background: white; padding: 1.5rem; border-radius: 10px; margin-bottom: 2rem;">
            <h3>Resumen General</h3>
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem;">
                <div style="text-align: center; padding: 1rem; background: #f5f5f5; border-radius: 8px;">
                    <strong>Total Ventas</strong>
                    <p style="font-size: 1.8rem; color: #2E7D32; margin: 0.5rem 0;">${formatearMoneda(totalGeneral)}</p>
                </div>
                <div style="text-align: center; padding: 1rem; background: #f5f5f5; border-radius: 8px;">
                    <strong>Número de Ventas</strong>
                    <p style="font-size: 1.8rem; margin: 0.5rem 0;">${ventas.length}</p>
                </div>
                <div style="text-align: center; padding: 1rem; background: #f5f5f5; border-radius: 8px;">
                    <strong>Unidades Vendidas</strong>
                    <p style="font-size: 1.8rem; margin: 0.5rem 0;">${totalUnidades}</p>
                </div>
                <div style="text-align: center; padding: 1rem; background: #f5f5f5; border-radius: 8px;">
                    <strong>Promedio por Día</strong>
                    <p style="font-size: 1.8rem; color: #1976D2; margin: 0.5rem 0;">${formatearMoneda(promedioDiario)}</p>
                </div>
            </div>
        </div>
        
        <div style="display: flex; gap: 1rem; margin-bottom: 1rem;">
            <button class="btn btn-info" onclick="sincronizarVentas()">
                🔄 Sincronizar Ventas
            </button>
            <button class="btn btn-info" onclick="window.exportarAExcel ? window.exportarAExcel('ventas') : mostrarNotificacion('Módulo de exportación no disponible', 'error')">
                📊 Exportar a Excel
            </button>
            <button class="btn btn-info" onclick="window.generarPDFVentas ? window.generarPDFVentas() : mostrarNotificacion('Módulo de exportación no disponible', 'error')">
                📄 Exportar a PDF
            </button>
        </div>
        
        <div class="table-container">
            <h3>Todas las Ventas</h3>
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Fecha</th>
                        <th>Producto</th>
                        <th>Presentación</th>
                        <th>Cantidad</th>
                        <th>Unidades</th>
                        <th>Precio Unit.</th>
                        <th>Total</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody id="ventas-body">
                    ${renderizarHistorialVentas(ventasOrdenadas)}
                </tbody>
                <tfoot>
                    <tr style="background: #f0f0f0; font-weight: bold;">
                        <td colspan="7" style="text-align: right;">TOTAL GENERAL:</td>
                        <td>${formatearMoneda(totalGeneral)}</td>
                        <td></td>
                    </tr>
                </tfoot>
            </table>
        </div>
        
        <!-- Paginación simple -->
        <div style="margin-top: 1rem; display: flex; justify-content: center; gap: 0.5rem;">
            <button class="btn" onclick="cambiarPaginaVentas('anterior')" id="btn-anterior" disabled>← Anterior</button>
            <span id="pagina-actual" style="padding: 0.5rem 1rem;">Página 1</span>
            <button class="btn" onclick="cambiarPaginaVentas('siguiente')" id="btn-siguiente">Siguiente →</button>
        </div>
        
        <button class="btn" style="margin-top: 1rem;" onclick="volverAlInicio()">← Volver al Inicio</button>
    `;
}

// Variables para paginación
let paginaActual = 1;
const ventasPorPagina = 20;

function renderizarHistorialVentas(ventasOrdenadas) {
    if (!ventasOrdenadas || ventasOrdenadas.length === 0) {
        return `<tr><td colspan="9" style="text-align: center; padding: 2rem;">No hay ventas registradas en Supabase</td></tr>`;
    }
    
    // Aplicar paginación
    const inicio = (paginaActual - 1) * ventasPorPagina;
    const fin = inicio + ventasPorPagina;
    const ventasPaginadas = ventasOrdenadas.slice(inicio, fin);
    
    // Actualizar estado de botones
    setTimeout(() => {
        const btnAnterior = document.getElementById('btn-anterior');
        const btnSiguiente = document.getElementById('btn-siguiente');
        const paginaSpan = document.getElementById('pagina-actual');
        
        if (btnAnterior) {
            btnAnterior.disabled = paginaActual === 1;
        }
        if (btnSiguiente) {
            btnSiguiente.disabled = fin >= ventasOrdenadas.length;
        }
        if (paginaSpan) {
            const totalPaginas = Math.ceil(ventasOrdenadas.length / ventasPorPagina);
            paginaSpan.textContent = `Página ${paginaActual} de ${totalPaginas}`;
        }
    }, 100);
    
    return ventasPaginadas.map(venta => {
        const presentacionTexto = venta.tipo === 'unidad' ? 
            '🍞 Unidad' : `📦 Bolsa (${venta.unidadesPorPresentacion || 5} und)`;
        
        return `
            <tr>
                <td>${venta.id || ''}</td>
                <td>${venta.fecha ? new Date(venta.fecha).toLocaleDateString('es-ES') : ''}</td>
                <td><strong>${venta.productoNombre || ''}</strong></td>
                <td>${presentacionTexto}</td>
                <td>${venta.cantidad || 0}</td>
                <td>${venta.unidadesVendidas || 0}</td>
                <td>${formatearMoneda(venta.precioUnitario || 0)}</td>
                <td style="font-weight: bold; color: #2E7D32;">${formatearMoneda(venta.total || 0)}</td>
                <td>
                    <button class="btn" style="background-color: var(--color-peligro); padding: 0.2rem 0.5rem; font-size: 0.8rem;" onclick="eliminarVenta(${venta.id})">
                        🗑️
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function cambiarPaginaVentas(direccion) {
    if (direccion === 'anterior' && paginaActual > 1) {
        paginaActual--;
    } else if (direccion === 'siguiente') {
        paginaActual++;
    }
    
    // Recargar la vista
    const moduloVentas = document.getElementById('historial-ventas');
    if (moduloVentas && moduloVentas.classList.contains('active')) {
        mostrarVentas().then(html => {
            moduloVentas.innerHTML = html;
        });
    }
}

async function eliminarVenta(id) {
    const client = window.supabaseClient?.getClient();
    if (!client) {
        mostrarNotificacion('Error: Cliente Supabase no disponible', 'error');
        return;
    }
    
    if (confirm('¿Eliminar esta venta? Esta acción no se puede deshacer.')) {
        try {
            // Obtener la venta antes de eliminarla para restaurar stock
            const venta = ventas.find(v => v.id === id);
            
            const { error } = await client
                .from('ventas')
                .delete()
                .eq('id', id);
            
            if (error) {
                console.error('Error eliminando venta:', error);
                mostrarNotificacion('Error al eliminar venta', 'error');
                return;
            }
            
            // Restaurar stock del producto si es necesario
            if (venta && venta.productoId) {
                await restaurarStockProducto(venta.productoId, venta.unidadesVendidas || 0);
            }
            
            // Actualizar lista local
            const index = ventas.findIndex(v => v.id === id);
            if (index !== -1) {
                ventas.splice(index, 1);
            }
            
            // Recargar vista
            const moduloVentas = document.getElementById('historial-ventas');
            if (moduloVentas && moduloVentas.classList.contains('active')) {
                moduloVentas.innerHTML = await mostrarVentas();
            }
            
            mostrarNotificacion('Venta eliminada', 'info');
        } catch (e) {
            console.error('Error eliminando venta:', e);
            mostrarNotificacion('Error al eliminar venta', 'error');
        }
    }
}

async function restaurarStockProducto(productoId, unidades) {
    const client = window.supabaseClient?.getClient();
    if (!client) return;
    
    try {
        // Obtener producto actual
        const { data: producto } = await client
            .from('productos')
            .select('stock')
            .eq('id', productoId)
            .single();
        
        if (producto) {
            const nuevoStock = (producto.stock || 0) + unidades;
            await client
                .from('productos')
                .update({ stock: nuevoStock })
                .eq('id', productoId);
        }
    } catch (e) {
        console.error('Error restaurando stock:', e);
    }
}

async function sincronizarVentas() {
    paginaActual = 1;
    await cargarVentas();
    
    const moduloVentas = document.getElementById('historial-ventas');
    if (moduloVentas && moduloVentas.classList.contains('active')) {
        moduloVentas.innerHTML = await mostrarVentas();
    }
    
    mostrarNotificacion('Ventas sincronizadas con Supabase', 'exito');
}

// Función para agregar una nueva venta (usada por punto_venta.js)
async function agregarVenta(ventaData) {
    const client = window.supabaseClient?.getClient();
    if (!client) {
        console.error('❌ Cliente Supabase no disponible');
        return null;
    }
    
    try {
        const nuevaVenta = {
            fecha: ventaData.fecha,
            producto_id: ventaData.productoId,
            producto_nombre: ventaData.productoNombre,
            tipo: ventaData.tipo,
            unidades_por_presentacion: ventaData.unidadesPorPresentacion || 1,
            cantidad: ventaData.cantidad,
            unidades_vendidas: ventaData.unidadesVendidas,
            precio_unitario: ventaData.precioUnitario,
            total: ventaData.total
        };
        
        const { data, error } = await client
            .from('ventas')
            .insert([nuevaVenta])
            .select();
        
        if (error) {
            console.error('Error agregando venta:', error);
            return null;
        }
        
        // Agregar a lista local
        if (data && data[0]) {
            const ventaFormateada = {
                ...data[0],
                productoId: data[0].producto_id,
                productoNombre: data[0].producto_nombre,
                unidadesPorPresentacion: data[0].unidades_por_presentacion,
                unidadesVendidas: data[0].unidades_vendidas,
                precioUnitario: data[0].precio_unitario
            };
            ventas.push(ventaFormateada);
        }
        
        return data ? data[0] : null;
    } catch (e) {
        console.error('Error agregando venta:', e);
        return null;
    }
}

// Función para obtener todas las ventas
function obtenerVentas() {
    return ventas;
}

// Función para obtener ventas por fecha
function obtenerVentasPorFecha(fecha) {
    return ventas.filter(v => v.fecha === fecha);
}

// Función para obtener total de ventas por fecha
function obtenerTotalVentasPorFecha(fecha) {
    return ventas
        .filter(v => v.fecha === fecha)
        .reduce((sum, v) => sum + (Number(v.total) || 0), 0);
}

// Función para obtener ventas por rango de fechas
function obtenerVentasPorRango(fechaInicio, fechaFin) {
    return ventas.filter(v => v.fecha >= fechaInicio && v.fecha <= fechaFin);
}

// Inicializar - cargar ventas al iniciar
(async function inicializar() {
    // Esperar a que Supabase esté listo
    let intentos = 0;
    const maxIntentos = 50;
    
    while (!window.supabaseClient?.isReady() && intentos < maxIntentos) {
        await new Promise(resolve => setTimeout(resolve, 100));
        intentos++;
    }
    
    if (window.supabaseClient?.isReady()) {
        await cargarVentas();
        await cargarProductosCatalogo();
        console.log('✅ Módulo de Ventas inicializado con Supabase');
    } else {
        console.error('❌ No se pudo conectar con Supabase');
    }
})();

// Exponer funciones
window.mostrarVentas = mostrarVentas;
window.obtenerVentas = obtenerVentas;
window.obtenerVentasPorFecha = obtenerVentasPorFecha;
window.obtenerTotalVentasPorFecha = obtenerTotalVentasPorFecha;
window.obtenerVentasPorRango = obtenerVentasPorRango;
window.agregarVenta = agregarVenta;
window.sincronizarVentas = sincronizarVentas;
window.eliminarVenta = eliminarVenta;
window.cambiarPaginaVentas = cambiarPaginaVentas;

console.log('📋 Módulo de Historial de Ventas (Supabase) cargado correctamente');