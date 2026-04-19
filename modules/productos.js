// modules/productos.js - Catálogo de productos con Supabase

let productos = [];

// Cargar productos desde Supabase
async function cargarProductos() {
    const client = window.supabaseClient?.getClient();
    
    if (!client) {
        console.error('❌ Cliente Supabase no disponible');
        productos = [];
        return;
    }
    
    try {
        const { data, error } = await client
            .from('productos')
            .select('*')
            .order('id', { ascending: true });
        
        if (error) {
            console.error('Error cargando productos:', error);
            productos = [];
            return;
        }
        
        productos = data || [];
        console.log(`✅ ${productos.length} productos cargados desde Supabase`);
    } catch (e) {
        console.error('Error cargando productos:', e);
        productos = [];
    }
}

async function guardarProductos() {
    // Ya no se usa - las operaciones son directas a Supabase
}

// Función para mostrar el módulo de productos
function mostrarProductos() {
    return `
        <h2>🥐 Catálogo de Productos</h2>
        
        <div style="margin-bottom: 2rem; background: white; padding: 1.5rem; border-radius: 10px;">
            <h3>Agregar Nuevo Producto</h3>
            <form id="form-producto" onsubmit="event.preventDefault(); guardarProducto();">
                <div style="display: grid; grid-template-columns: 2fr 1fr 1fr auto; gap: 1rem;">
                    <div class="form-group">
                        <label for="nombre-producto">Nombre del Producto:</label>
                        <input type="text" id="nombre-producto" placeholder="Ej: Pan Francés" required>
                    </div>
                    <div class="form-group">
                        <label for="precio-unidad">Precio por Unidad ($):</label>
                        <input type="number" id="precio-unidad" step="0.01" min="0" required>
                    </div>
                    <div class="form-group">
                        <label for="precio-bolsa">Precio por Bolsa (5 und) ($):</label>
                        <input type="number" id="precio-bolsa" step="0.01" min="0" placeholder="Opcional">
                    </div>
                    <button type="submit" class="btn btn-success" style="height: 42px; align-self: flex-end;">➕ Agregar</button>
                </div>
                <small style="color: #666;">La bolsa incluye 5 unidades. Si no especificas precio de bolsa, solo se venderá por unidad.</small>
            </form>
        </div>
        
        <div class="table-container">
            <h3>Productos Disponibles</h3>
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Producto</th>
                        <th>Presentaciones</th>
                        <th>Stock</th>
                        <th>Vendidos</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody id="productos-body">
                    ${renderizarProductos()}
                </tbody>
            </table>
        </div>
        
        <div style="margin-top: 1rem; display: flex; gap: 1rem;">
            <button class="btn" onclick="volverAlInicio()">← Volver al Inicio</button>
            <button class="btn btn-info" onclick="sincronizarProductos()">🔄 Sincronizar con Supabase</button>
        </div>
        
        <!-- Modal para editar producto -->
        <div id="modal-editar" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); justify-content: center; align-items: center; z-index: 1000;">
            <div style="background: white; padding: 2rem; border-radius: 10px; width: 500px;">
                <h3 style="margin-top: 0;">✏️ Editar Producto</h3>
                <input type="hidden" id="editar-id">
                <div class="form-group">
                    <label for="editar-nombre">Nombre:</label>
                    <input type="text" id="editar-nombre" required>
                </div>
                <div class="form-group">
                    <label for="editar-precio-unidad">Precio por Unidad ($):</label>
                    <input type="number" id="editar-precio-unidad" step="0.01" min="0" required>
                </div>
                <div class="form-group">
                    <label for="editar-precio-bolsa">Precio por Bolsa (5 und) ($):</label>
                    <input type="number" id="editar-precio-bolsa" step="0.01" min="0" placeholder="Dejar vacío si no aplica">
                </div>
                <div class="form-group">
                    <label for="editar-stock">Stock Actual:</label>
                    <input type="number" id="editar-stock" min="0" required>
                </div>
                <div style="display: flex; gap: 1rem; justify-content: flex-end;">
                    <button class="btn" onclick="cerrarModalEditar()">Cancelar</button>
                    <button class="btn btn-success" onclick="guardarEdicion()">Guardar Cambios</button>
                </div>
            </div>
        </div>
    `;
}

function renderizarProductos() {
    if (!productos || productos.length === 0) {
        return `<tr><td colspan="6" style="text-align: center;">Cargando productos desde Supabase...</td></tr>`;
    }
    
    return productos.map((prod) => {
        if (!prod) return '';
        
        let presentacionesTexto = '';
        try {
            const presentaciones = typeof prod.presentaciones === 'string' 
                ? JSON.parse(prod.presentaciones) 
                : prod.presentaciones;
            
            if (presentaciones && Array.isArray(presentaciones)) {
                presentacionesTexto = presentaciones.map(p => 
                    `${p.tipo === 'unidad' ? '🍞 Unidad' : '📦 Bolsa'}: ${formatearMoneda(p.precio || 0)} (${p.unidades || 1} und)`
                ).join('<br>');
            } else {
                presentacionesTexto = 'Sin presentaciones';
            }
        } catch (e) {
            presentacionesTexto = 'Error en datos';
        }
        
        return `
            <tr>
                <td>${prod.id || ''}</td>
                <td><strong>${prod.nombre || ''}</strong></td>
                <td>${presentacionesTexto}</td>
                <td>${prod.stock || 0} unidades</td>
                <td>${prod.vendidos || 0} unidades</td>
                <td>
                    <button class="btn" style="background-color: var(--color-info); padding: 0.3rem 0.8rem; margin-right: 0.5rem;" onclick="abrirModalEditar(${prod.id})">
                        ✏️ Editar
                    </button>
                    <button class="btn" style="background-color: var(--color-peligro); padding: 0.3rem 0.8rem;" onclick="eliminarProducto(${prod.id})">
                        🗑️ Eliminar
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

async function guardarProducto() {
    const client = window.supabaseClient?.getClient();
    if (!client) {
        mostrarNotificacion('Error: Cliente Supabase no disponible', 'error');
        return;
    }
    
    const nombre = document.getElementById('nombre-producto').value;
    const precioUnidad = parseFloat(document.getElementById('precio-unidad').value);
    const precioBolsa = document.getElementById('precio-bolsa').value;
    
    if (!nombre || !precioUnidad) {
        mostrarNotificacion('Completa al menos el nombre y precio por unidad', 'error');
        return;
    }
    
    const presentaciones = [
        { tipo: 'unidad', precio: precioUnidad, unidades: 1 }
    ];
    
    if (precioBolsa && parseFloat(precioBolsa) > 0) {
        presentaciones.push({ 
            tipo: 'bolsa', 
            precio: parseFloat(precioBolsa), 
            unidades: 5 
        });
    }
    
    const nuevoProducto = {
        nombre: nombre,
        presentaciones: presentaciones,
        stock: 100,
        vendidos: 0
    };
    
    try {
        const { data, error } = await client
            .from('productos')
            .insert([nuevoProducto])
            .select();
        
        if (error) {
            console.error('Error guardando producto:', error);
            mostrarNotificacion('Error al guardar producto', 'error');
            return;
        }
        
        // Actualizar lista local
        if (data && data[0]) {
            productos.push(data[0]);
        }
        
        // Limpiar formulario
        document.getElementById('nombre-producto').value = '';
        document.getElementById('precio-unidad').value = '';
        document.getElementById('precio-bolsa').value = '';
        
        actualizarVistaProductos();
        mostrarNotificacion('Producto agregado correctamente', 'exito');
    } catch (e) {
        console.error('Error guardando producto:', e);
        mostrarNotificacion('Error al guardar producto', 'error');
    }
}

// Variables para el modal de edición
let productoEnEdicion = null;

function abrirModalEditar(productoId) {
    const producto = productos.find(p => p && p.id === productoId);
    if (!producto) return;
    
    productoEnEdicion = producto;
    
    document.getElementById('editar-id').value = producto.id;
    document.getElementById('editar-nombre').value = producto.nombre || '';
    
    let presentaciones = producto.presentaciones;
    try {
        if (typeof presentaciones === 'string') {
            presentaciones = JSON.parse(presentaciones);
        }
    } catch (e) {
        presentaciones = [];
    }
    
    const unidad = presentaciones ? presentaciones.find(p => p && p.tipo === 'unidad') : null;
    const bolsa = presentaciones ? presentaciones.find(p => p && p.tipo === 'bolsa') : null;
    
    document.getElementById('editar-precio-unidad').value = unidad ? unidad.precio : '';
    document.getElementById('editar-precio-bolsa').value = bolsa ? bolsa.precio : '';
    document.getElementById('editar-stock').value = producto.stock || 0;
    
    document.getElementById('modal-editar').style.display = 'flex';
}

function cerrarModalEditar() {
    document.getElementById('modal-editar').style.display = 'none';
    productoEnEdicion = null;
}

async function guardarEdicion() {
    const client = window.supabaseClient?.getClient();
    if (!client) {
        mostrarNotificacion('Error: Cliente Supabase no disponible', 'error');
        return;
    }
    
    if (!productoEnEdicion) return;
    
    const id = parseInt(document.getElementById('editar-id').value);
    const nombre = document.getElementById('editar-nombre').value;
    const precioUnidad = parseFloat(document.getElementById('editar-precio-unidad').value);
    const precioBolsa = document.getElementById('editar-precio-bolsa').value;
    const stock = parseInt(document.getElementById('editar-stock').value);
    
    if (!nombre || !precioUnidad) {
        mostrarNotificacion('El nombre y precio por unidad son obligatorios', 'error');
        return;
    }
    
    const presentaciones = [
        { tipo: 'unidad', precio: precioUnidad, unidades: 1 }
    ];
    
    if (precioBolsa && parseFloat(precioBolsa) > 0) {
        presentaciones.push({ 
            tipo: 'bolsa', 
            precio: parseFloat(precioBolsa), 
            unidades: 5 
        });
    }
    
    try {
        const { data, error } = await client
            .from('productos')
            .update({
                nombre: nombre,
                presentaciones: presentaciones,
                stock: stock
            })
            .eq('id', id)
            .select();
        
        if (error) {
            console.error('Error actualizando producto:', error);
            mostrarNotificacion('Error al actualizar producto', 'error');
            return;
        }
        
        // Actualizar lista local
        const index = productos.findIndex(p => p && p.id === id);
        if (index !== -1 && data && data[0]) {
            productos[index] = data[0];
        }
        
        actualizarVistaProductos();
        cerrarModalEditar();
        mostrarNotificacion('Producto actualizado', 'exito');
    } catch (e) {
        console.error('Error actualizando producto:', e);
        mostrarNotificacion('Error al actualizar producto', 'error');
    }
}

async function eliminarProducto(id) {
    const client = window.supabaseClient?.getClient();
    if (!client) {
        mostrarNotificacion('Error: Cliente Supabase no disponible', 'error');
        return;
    }
    
    if (confirm('¿Eliminar este producto?')) {
        try {
            const { error } = await client
                .from('productos')
                .delete()
                .eq('id', id);
            
            if (error) {
                console.error('Error eliminando producto:', error);
                mostrarNotificacion('Error al eliminar producto', 'error');
                return;
            }
            
            // Actualizar lista local
            const index = productos.findIndex(p => p && p.id === id);
            if (index !== -1) {
                productos.splice(index, 1);
            }
            
            actualizarVistaProductos();
            mostrarNotificacion('Producto eliminado', 'info');
        } catch (e) {
            console.error('Error eliminando producto:', e);
            mostrarNotificacion('Error al eliminar producto', 'error');
        }
    }
}

async function sincronizarProductos() {
    await cargarProductos();
    actualizarVistaProductos();
    mostrarNotificacion('Productos sincronizados con Supabase', 'exito');
}

function actualizarVistaProductos() {
    const tablaBody = document.getElementById('productos-body');
    if (tablaBody) {
        tablaBody.innerHTML = renderizarProductos();
    }
}

// Función para obtener precio de producto según presentación
function obtenerPrecioProducto(productoId, tipo = 'unidad') {
    const producto = productos.find(p => p && p.id === productoId);
    if (!producto) return 0;
    
    let presentaciones = producto.presentaciones;
    try {
        if (typeof presentaciones === 'string') {
            presentaciones = JSON.parse(presentaciones);
        }
    } catch (e) {
        return 0;
    }
    
    const presentacion = presentaciones ? presentaciones.find(p => p && p.tipo === tipo) : null;
    return presentacion ? presentacion.precio || 0 : 0;
}

// Función para actualizar stock y vendidos
async function registrarVentaProducto(productoId, tipo, cantidadVendida) {
    const client = window.supabaseClient?.getClient();
    if (!client) return false;
    
    const producto = productos.find(p => p && p.id === productoId);
    if (!producto) return false;
    
    let presentaciones = producto.presentaciones;
    try {
        if (typeof presentaciones === 'string') {
            presentaciones = JSON.parse(presentaciones);
        }
    } catch (e) {
        return false;
    }
    
    const presentacion = presentaciones ? presentaciones.find(p => p && p.tipo === tipo) : null;
    if (!presentacion) return false;
    
    const unidadesVendidas = (presentacion.unidades || 1) * cantidadVendida;
    const nuevoStock = (producto.stock || 0) - unidadesVendidas;
    const nuevosVendidos = (producto.vendidos || 0) + unidadesVendidas;
    
    try {
        const { data, error } = await client
            .from('productos')
            .update({
                stock: nuevoStock,
                vendidos: nuevosVendidos
            })
            .eq('id', productoId)
            .select();
        
        if (error) {
            console.error('Error actualizando stock:', error);
            return false;
        }
        
        // Actualizar lista local
        const index = productos.findIndex(p => p && p.id === productoId);
        if (index !== -1 && data && data[0]) {
            productos[index] = data[0];
        }
        
        return true;
    } catch (e) {
        console.error('Error registrando venta:', e);
        return false;
    }
}

// Función para obtener todos los productos
function obtenerProductos() {
    return productos;
}

// Inicializar - cargar productos al iniciar
(async function inicializar() {
    // Esperar a que Supabase esté listo
    let intentos = 0;
    const maxIntentos = 50;
    
    while (!window.supabaseClient?.isReady() && intentos < maxIntentos) {
        await new Promise(resolve => setTimeout(resolve, 100));
        intentos++;
    }
    
    if (window.supabaseClient?.isReady()) {
        await cargarProductos();
        console.log('✅ Módulo de Productos inicializado con Supabase');
    } else {
        console.error('❌ No se pudo conectar con Supabase');
    }
})();

// Exponer funciones
window.mostrarProductos = mostrarProductos;
window.guardarProducto = guardarProducto;
window.eliminarProducto = eliminarProducto;
window.abrirModalEditar = abrirModalEditar;
window.cerrarModalEditar = cerrarModalEditar;
window.guardarEdicion = guardarEdicion;
window.obtenerProductos = obtenerProductos;
window.obtenerPrecioProducto = obtenerPrecioProducto;
window.registrarVentaProducto = registrarVentaProducto;
window.sincronizarProductos = sincronizarProductos;

console.log('🥐 Módulo de Productos (Supabase) cargado correctamente');