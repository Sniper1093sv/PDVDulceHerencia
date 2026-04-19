// modules/materia_prima.js - Gestión de inventario de materia prima con Supabase

let materiaPrima = [];

// Cargar datos desde Supabase
async function cargarMateriaPrima() {
    const client = window.supabaseClient?.getClient();
    
    if (!client) {
        console.error('❌ Cliente Supabase no disponible');
        materiaPrima = [];
        return;
    }
    
    try {
        const { data, error } = await client
            .from('materia_prima')
            .select('*')
            .order('nombre', { ascending: true });
        
        if (error) {
            console.error('Error cargando materia prima:', error);
            materiaPrima = [];
            return;
        }
        
        materiaPrima = (data || []).map(item => ({
            ...item,
            cantidad: Number(item.cantidad) || 0,
            precioUnitario: Number(item.precio_unitario) || 0
        }));
        
        // Si no hay datos, crear ejemplos
        if (materiaPrima.length === 0) {
            await crearMateriaPrimaEjemplo();
        }
        
        console.log(`✅ ${materiaPrima.length} items de materia prima cargados desde Supabase`);
    } catch (e) {
        console.error('Error cargando materia prima:', e);
        materiaPrima = [];
    }
}

// Crear datos de ejemplo
async function crearMateriaPrimaEjemplo() {
    const client = window.supabaseClient?.getClient();
    if (!client) return;
    
    const ejemplos = [
        { nombre: 'Harina', cantidad: 50, unidad: 'kg', precio_unitario: 0.80, fecha_compra: '2026-02-01', proveedor: 'Distribuidora Central' },
        { nombre: 'Azúcar', cantidad: 30, unidad: 'kg', precio_unitario: 1.20, fecha_compra: '2026-02-05', proveedor: 'Distribuidora Central' },
        { nombre: 'Huevos', cantidad: 120, unidad: 'unidades', precio_unitario: 0.15, fecha_compra: '2026-02-10', proveedor: 'Granja Local' },
        { nombre: 'Mantequilla', cantidad: 20, unidad: 'kg', precio_unitario: 4.50, fecha_compra: '2026-02-12', proveedor: 'Lácteos SA' },
        { nombre: 'Levadura', cantidad: 5, unidad: 'kg', precio_unitario: 3.20, fecha_compra: '2026-02-15', proveedor: 'Distribuidora Central' }
    ];
    
    try {
        const { data, error } = await client
            .from('materia_prima')
            .insert(ejemplos)
            .select();
        
        if (error) {
            console.error('Error creando ejemplos:', error);
            return;
        }
        
        materiaPrima = (data || []).map(item => ({
            ...item,
            cantidad: Number(item.cantidad) || 0,
            precioUnitario: Number(item.precio_unitario) || 0
        }));
        
        console.log('✅ Ejemplos de materia prima creados');
    } catch (e) {
        console.error('Error creando ejemplos:', e);
    }
}

// Función para calcular total invertido en materia prima
function calcularTotalInvertido() {
    return materiaPrima.reduce((total, item) => {
        return total + ((Number(item.cantidad) || 0) * (Number(item.precioUnitario) || 0));
    }, 0);
}

// Función para mostrar el módulo
async function mostrarMateriaPrima() {
    await cargarMateriaPrima();
    
    const totalInvertido = calcularTotalInvertido();
    const itemsBajoStock = materiaPrima.filter(item => {
        const cantidad = Number(item.cantidad) || 0;
        if (item.unidad === 'kg' || item.unidad === 'litros') return cantidad < 10;
        if (item.unidad === 'unidades') return cantidad < 50;
        if (item.unidad === 'gramos') return cantidad < 1000;
        return false;
    }).length;
    
    return `
        <h2>📦 Gestión de Materia Prima</h2>
        
        <!-- Tarjetas de resumen -->
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 2rem;">
            <div style="background: linear-gradient(135deg, #2E7D32, #4CAF50); color: white; padding: 1.5rem; border-radius: 10px;">
                <h3 style="margin:0; font-size:0.9rem;">TOTAL ITEMS</h3>
                <p style="font-size:2rem; font-weight:bold; margin:0.5rem 0;">${materiaPrima.length}</p>
            </div>
            <div style="background: linear-gradient(135deg, #8B4513, #D2691E); color: white; padding: 1.5rem; border-radius: 10px;">
                <h3 style="margin:0; font-size:0.9rem;">INVERSIÓN TOTAL</h3>
                <p style="font-size:2rem; font-weight:bold; margin:0.5rem 0;">${formatearMoneda(totalInvertido)}</p>
            </div>
            <div style="background: linear-gradient(135deg, ${itemsBajoStock > 0 ? '#C62828' : '#1976D2'}, ${itemsBajoStock > 0 ? '#D32F2F' : '#2196F3'}); color: white; padding: 1.5rem; border-radius: 10px;">
                <h3 style="margin:0; font-size:0.9rem;">⚠️ BAJO STOCK</h3>
                <p style="font-size:2rem; font-weight:bold; margin:0.5rem 0;">${itemsBajoStock}</p>
            </div>
        </div>
        
        <!-- Formulario para agregar -->
        <div style="background: white; padding: 1.5rem; border-radius: 10px; margin-bottom: 2rem;">
            <h3>Agregar Nueva Materia Prima</h3>
            <form id="form-materia-prima" onsubmit="event.preventDefault(); guardarMateriaPrimaItem();">
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem;">
                    <div class="form-group">
                        <label for="mp-nombre">Producto:</label>
                        <input type="text" id="mp-nombre" placeholder="Ej: Harina" required>
                    </div>
                    <div class="form-group">
                        <label for="mp-cantidad">Cantidad:</label>
                        <input type="number" id="mp-cantidad" step="0.01" min="0" required>
                    </div>
                    <div class="form-group">
                        <label for="mp-unidad">Unidad:</label>
                        <select id="mp-unidad" required>
                            <option value="kg">Kilogramos (kg)</option>
                            <option value="litros">Litros</option>
                            <option value="unidades">Unidades</option>
                            <option value="gramos">Gramos</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="mp-precio">Precio Unitario ($):</label>
                        <input type="number" id="mp-precio" step="0.01" min="0" required>
                    </div>
                    <div class="form-group">
                        <label for="mp-proveedor">Proveedor:</label>
                        <input type="text" id="mp-proveedor" required>
                    </div>
                    <div class="form-group">
                        <label for="mp-fecha">Fecha Compra:</label>
                        <input type="date" id="mp-fecha" value="${new Date().toISOString().split('T')[0]}" required>
                    </div>
                </div>
                <button type="submit" class="btn btn-success" style="margin-top: 1rem;">➕ Agregar al Inventario</button>
            </form>
        </div>
        
        <!-- Botones de acción -->
        <div style="display: flex; gap: 1rem; margin-bottom: 1rem;">
            <button class="btn btn-info" onclick="sincronizarMateriaPrima()">
                🔄 Sincronizar con Supabase
            </button>
            <button class="btn btn-info" onclick="exportarMateriaPrimaCSV()">
                📊 Exportar a CSV
            </button>
        </div>
        
        <!-- Tabla de inventario -->
        <div class="table-container">
            <h3>Inventario Actual</h3>
            <table>
                <thead>
                    <tr>
                        <th>Producto</th>
                        <th>Cantidad</th>
                        <th>Unidad</th>
                        <th>Precio Unit.</th>
                        <th>Total</th>
                        <th>Proveedor</th>
                        <th>Fecha</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody id="materia-prima-body">
                    ${renderizarMateriaPrima()}
                </tbody>
                <tfoot>
                    <tr style="background: #f0f0f0; font-weight: bold;">
                        <td colspan="4" style="text-align: right;">TOTAL INVERTIDO:</td>
                        <td>${formatearMoneda(totalInvertido)}</td>
                        <td colspan="3"></td>
                    </tr>
                </tfoot>
            </table>
        </div>
        
        <button class="btn" style="margin-top: 1rem;" onclick="volverAlInicio()">← Volver al Inicio</button>
        
        <!-- Modal para editar/ajustar stock -->
        <div id="modal-ajustar-stock" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); justify-content: center; align-items: center; z-index: 1000;">
            <div style="background: white; padding: 2rem; border-radius: 10px; width: 400px;">
                <h3 style="margin-top: 0;">📦 Ajustar Stock</h3>
                <div class="form-group">
                    <label for="ajustar-nombre">Producto:</label>
                    <input type="text" id="ajustar-nombre" readonly style="background: #f5f5f5;">
                </div>
                <div class="form-group">
                    <label for="ajustar-cantidad-actual">Cantidad Actual:</label>
                    <input type="text" id="ajustar-cantidad-actual" readonly style="background: #f5f5f5;">
                </div>
                <div class="form-group">
                    <label for="ajustar-operacion">Operación:</label>
                    <select id="ajustar-operacion">
                        <option value="sumar">➕ Agregar stock</option>
                        <option value="restar">➖ Consumir/Gastar</option>
                        <option value="actualizar">📝 Actualizar cantidad exacta</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="ajustar-cantidad">Cantidad a ajustar:</label>
                    <input type="number" id="ajustar-cantidad" step="0.01" min="0" required>
                </div>
                <div style="display: flex; gap: 1rem; justify-content: flex-end;">
                    <button class="btn" onclick="cerrarModalAjustar()">Cancelar</button>
                    <button class="btn btn-success" onclick="guardarAjusteStock()">Guardar Cambios</button>
                </div>
            </div>
        </div>
    `;
}

function renderizarMateriaPrima() {
    if (materiaPrima.length === 0) {
        return `<tr><td colspan="8" style="text-align: center; padding: 2rem;">No hay materia prima registrada</td></tr>`;
    }
    
    return materiaPrima.map((item) => {
        const cantidad = Number(item.cantidad) || 0;
        const precioUnitario = Number(item.precioUnitario) || 0;
        const total = cantidad * precioUnitario;
        
        const bajoStock = (item.unidad === 'kg' && cantidad < 10) || 
                         (item.unidad === 'litros' && cantidad < 10) || 
                         (item.unidad === 'unidades' && cantidad < 50) ||
                         (item.unidad === 'gramos' && cantidad < 1000);
        
        return `
            <tr style="${bajoStock ? 'background: #ffebee;' : ''}">
                <td><strong>${item.nombre || ''}</strong></td>
                <td style="font-weight: ${bajoStock ? 'bold' : 'normal'}; color: ${bajoStock ? '#C62828' : 'inherit'};">
                    ${cantidad}
                </td>
                <td>${item.unidad || ''}</td>
                <td>${formatearMoneda(precioUnitario)}</td>
                <td>${formatearMoneda(total)}</td>
                <td>${item.proveedor || ''}</td>
                <td>${item.fecha_compra ? new Date(item.fecha_compra).toLocaleDateString('es-ES') : ''}</td>
                <td>
                    <button class="btn" style="background-color: var(--color-info); padding: 0.3rem 0.5rem; margin-right: 0.3rem;" onclick="abrirModalAjustar(${item.id})">
                        📦 Ajustar
                    </button>
                    <button class="btn" style="background-color: var(--color-peligro); padding: 0.3rem 0.5rem;" onclick="eliminarMateriaPrima(${item.id})">
                        🗑️
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// Variables para el modal de ajuste
let itemEnAjuste = null;

function abrirModalAjustar(id) {
    const item = materiaPrima.find(i => i.id === id);
    if (!item) return;
    
    itemEnAjuste = item;
    
    document.getElementById('ajustar-nombre').value = item.nombre || '';
    document.getElementById('ajustar-cantidad-actual').value = `${item.cantidad || 0} ${item.unidad || ''}`;
    document.getElementById('ajustar-cantidad').value = '';
    
    document.getElementById('modal-ajustar-stock').style.display = 'flex';
}

function cerrarModalAjustar() {
    document.getElementById('modal-ajustar-stock').style.display = 'none';
    itemEnAjuste = null;
}

async function guardarAjusteStock() {
    const client = window.supabaseClient?.getClient();
    
    if (!client) {
        mostrarNotificacion('Error: Cliente Supabase no disponible', 'error');
        return;
    }
    
    if (!itemEnAjuste) return;
    
    const operacion = document.getElementById('ajustar-operacion').value;
    const cantidadAjuste = parseFloat(document.getElementById('ajustar-cantidad').value);
    
    if (isNaN(cantidadAjuste) || cantidadAjuste < 0) {
        mostrarNotificacion('Ingresa una cantidad válida', 'error');
        return;
    }
    
    const cantidadActual = Number(itemEnAjuste.cantidad) || 0;
    let nuevaCantidad;
    
    switch(operacion) {
        case 'sumar':
            nuevaCantidad = cantidadActual + cantidadAjuste;
            break;
        case 'restar':
            if (cantidadActual < cantidadAjuste) {
                mostrarNotificacion('No hay suficiente stock', 'error');
                return;
            }
            nuevaCantidad = cantidadActual - cantidadAjuste;
            break;
        case 'actualizar':
            nuevaCantidad = cantidadAjuste;
            break;
        default:
            return;
    }
    
    try {
        const { data, error } = await client
            .from('materia_prima')
            .update({ cantidad: nuevaCantidad })
            .eq('id', itemEnAjuste.id)
            .select();
        
        if (error) {
            console.error('Error actualizando stock:', error);
            mostrarNotificacion('Error al actualizar stock', 'error');
            return;
        }
        
        // Actualizar lista local
        const index = materiaPrima.findIndex(i => i.id === itemEnAjuste.id);
        if (index !== -1 && data && data[0]) {
            materiaPrima[index] = {
                ...data[0],
                cantidad: Number(data[0].cantidad) || 0,
                precioUnitario: Number(data[0].precio_unitario) || 0
            };
        }
        
        cerrarModalAjustar();
        
        // Actualizar vista
        const tablaBody = document.getElementById('materia-prima-body');
        if (tablaBody) {
            tablaBody.innerHTML = renderizarMateriaPrima();
        }
        
        // Actualizar total
        actualizarTotalMateriaPrima();
        
        let mensaje = '';
        if (operacion === 'sumar') mensaje = `Stock agregado: +${cantidadAjuste}`;
        else if (operacion === 'restar') mensaje = `Stock consumido: -${cantidadAjuste}`;
        else mensaje = 'Stock actualizado';
        
        mostrarNotificacion(mensaje, 'exito');
    } catch (e) {
        console.error('Error actualizando stock:', e);
        mostrarNotificacion('Error al actualizar stock', 'error');
    }
}

async function guardarMateriaPrimaItem() {
    const client = window.supabaseClient?.getClient();
    
    if (!client) {
        mostrarNotificacion('Error: Cliente Supabase no disponible', 'error');
        return;
    }
    
    const nombre = document.getElementById('mp-nombre').value;
    const cantidad = parseFloat(document.getElementById('mp-cantidad').value);
    const unidad = document.getElementById('mp-unidad').value;
    const precio = parseFloat(document.getElementById('mp-precio').value);
    const proveedor = document.getElementById('mp-proveedor').value;
    const fecha = document.getElementById('mp-fecha').value;
    
    if (!nombre || isNaN(cantidad) || isNaN(precio) || !proveedor || !fecha) {
        mostrarNotificacion('Completa todos los campos', 'error');
        return;
    }
    
    const nuevoItem = {
        nombre: nombre,
        cantidad: cantidad,
        unidad: unidad,
        precio_unitario: precio,
        proveedor: proveedor,
        fecha_compra: fecha
    };
    
    try {
        const { data, error } = await client
            .from('materia_prima')
            .insert([nuevoItem])
            .select();
        
        if (error) {
            console.error('Error guardando materia prima:', error);
            mostrarNotificacion('Error al guardar', 'error');
            return;
        }
        
        // Agregar a lista local
        if (data && data[0]) {
            materiaPrima.push({
                ...data[0],
                cantidad: Number(data[0].cantidad) || 0,
                precioUnitario: Number(data[0].precio_unitario) || 0
            });
        }
        
        // Limpiar formulario
        document.getElementById('mp-nombre').value = '';
        document.getElementById('mp-cantidad').value = '';
        document.getElementById('mp-precio').value = '';
        document.getElementById('mp-proveedor').value = '';
        
        // Actualizar vista
        const tablaBody = document.getElementById('materia-prima-body');
        if (tablaBody) {
            tablaBody.innerHTML = renderizarMateriaPrima();
        }
        
        actualizarTotalMateriaPrima();
        actualizarTarjetasResumen();
        
        mostrarNotificacion('Materia prima agregada', 'exito');
    } catch (e) {
        console.error('Error guardando materia prima:', e);
        mostrarNotificacion('Error al guardar', 'error');
    }
}

async function eliminarMateriaPrima(id) {
    const client = window.supabaseClient?.getClient();
    
    if (!client) {
        mostrarNotificacion('Error: Cliente Supabase no disponible', 'error');
        return;
    }
    
    if (confirm('¿Eliminar este item del inventario?')) {
        try {
            const { error } = await client
                .from('materia_prima')
                .delete()
                .eq('id', id);
            
            if (error) {
                console.error('Error eliminando:', error);
                mostrarNotificacion('Error al eliminar', 'error');
                return;
            }
            
            // Actualizar lista local
            const index = materiaPrima.findIndex(i => i.id === id);
            if (index !== -1) {
                materiaPrima.splice(index, 1);
            }
            
            const tablaBody = document.getElementById('materia-prima-body');
            if (tablaBody) {
                tablaBody.innerHTML = renderizarMateriaPrima();
            }
            
            actualizarTotalMateriaPrima();
            actualizarTarjetasResumen();
            
            mostrarNotificacion('Item eliminado', 'info');
        } catch (e) {
            console.error('Error eliminando:', e);
            mostrarNotificacion('Error al eliminar', 'error');
        }
    }
}

function actualizarTotalMateriaPrima() {
    const totalInvertido = calcularTotalInvertido();
    const tfoot = document.querySelector('#materia-prima-body')?.closest('table')?.querySelector('tfoot td:last-child');
    if (tfoot) {
        const td = tfoot.closest('tr')?.querySelector('td:nth-child(2)');
        if (td) {
            td.textContent = formatearMoneda(totalInvertido);
        }
    }
}

function actualizarTarjetasResumen() {
    // Esta función actualizaría las tarjetas de resumen si es necesario
    // Por ahora no se implementa para mantener simple
}

async function sincronizarMateriaPrima() {
    await cargarMateriaPrima();
    
    const moduloMateriaPrima = document.getElementById('materia-prima');
    if (moduloMateriaPrima && moduloMateriaPrima.classList.contains('active')) {
        moduloMateriaPrima.innerHTML = await mostrarMateriaPrima();
    }
    
    mostrarNotificacion('Materia prima sincronizada con Supabase', 'exito');
}

function exportarMateriaPrimaCSV() {
    if (materiaPrima.length === 0) {
        mostrarNotificacion('No hay datos para exportar', 'error');
        return;
    }
    
    let csv = 'Producto,Cantidad,Unidad,Precio Unitario,Total,Proveedor,Fecha Compra\n';
    
    materiaPrima.forEach(item => {
        const total = (Number(item.cantidad) || 0) * (Number(item.precioUnitario) || 0);
        csv += `"${item.nombre || ''}",${item.cantidad || 0},${item.unidad || ''},${item.precioUnitario || 0},${total},"${item.proveedor || ''}",${item.fecha_compra || ''}\n`;
    });
    
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `materia_prima_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    mostrarNotificacion('Archivo exportado correctamente', 'exito');
}

// Función para obtener el total invertido en materia prima (usada por otros módulos)
async function obtenerTotalInvertidoMateriaPrima() {
    await cargarMateriaPrima();
    return calcularTotalInvertido();
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
        await cargarMateriaPrima();
        console.log('✅ Módulo de Materia Prima inicializado con Supabase');
    } else {
        console.error('❌ No se pudo conectar con Supabase');
    }
})();

// Exponer funciones
window.mostrarMateriaPrima = mostrarMateriaPrima;
window.guardarMateriaPrimaItem = guardarMateriaPrimaItem;
window.eliminarMateriaPrima = eliminarMateriaPrima;
window.abrirModalAjustar = abrirModalAjustar;
window.cerrarModalAjustar = cerrarModalAjustar;
window.guardarAjusteStock = guardarAjusteStock;
window.sincronizarMateriaPrima = sincronizarMateriaPrima;
window.exportarMateriaPrimaCSV = exportarMateriaPrimaCSV;
window.obtenerTotalInvertidoMateriaPrima = obtenerTotalInvertidoMateriaPrima;

console.log('📦 Módulo de Materia Prima (Supabase) cargado correctamente');