// modules/productos.js - Catálogo de productos con presentaciones

let productos = [];

// Cargar productos de localStorage
function cargarProductos() {
    const datos = localStorage.getItem('productos');
    if (datos) {
        try {
            productos = JSON.parse(datos);
        } catch (e) {
            console.error('Error cargando productos:', e);
            productos = [];
        }
    } else {
        // Datos de ejemplo
        productos = [
            { 
                id: 1, 
                nombre: 'Pan Francés', 
                presentaciones: [
                    { tipo: 'unidad', precio: 1.50, unidades: 1 },
                    { tipo: 'bolsa', precio: 7.00, unidades: 5 }
                ],
                stock: 100,
                vendidos: 0
            },
            { 
                id: 2, 
                nombre: 'Croissant', 
                presentaciones: [
                    { tipo: 'unidad', precio: 2.00, unidades: 1 },
                    { tipo: 'bolsa', precio: 9.00, unidades: 5 }
                ],
                stock: 80,
                vendidos: 0
            },
            { 
                id: 3, 
                nombre: 'Pan Dulce', 
                presentaciones: [
                    { tipo: 'unidad', precio: 3.50, unidades: 1 },
                    { tipo: 'bolsa', precio: 16.00, unidades: 5 }
                ],
                stock: 60,
                vendidos: 0
            },
        ];
        guardarProductos();
    }
}

function guardarProductos() {
    localStorage.setItem('productos', JSON.stringify(productos));
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
        
        <button class="btn" style="margin-top: 1rem;" onclick="volverAlInicio()">← Volver al Inicio</button>
        
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
        return `<tr><td colspan="6" style="text-align: center;">No hay productos registrados</td></tr>`;
    }
    
    return productos.map((prod) => {
        if (!prod) return '';
        
        const presentaciones = prod.presentaciones ? prod.presentaciones.map(p => 
            `${p.tipo === 'unidad' ? '🍞 Unidad' : '📦 Bolsa'}: ${formatearMoneda(p.precio || 0)} (${p.unidades || 1} und)`
        ).join('<br>') : 'Sin presentaciones';
        
        return `
            <tr>
                <td>${prod.id || ''}</td>
                <td><strong>${prod.nombre || ''}</strong></td>
                <td>${presentaciones}</td>
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

function guardarProducto() {
    const nombre = document.getElementById('nombre-producto').value;
    const precioUnidad = parseFloat(document.getElementById('precio-unidad').value);
    const precioBolsa = document.getElementById('precio-bolsa').value;
    
    if (!nombre || !precioUnidad) {
        mostrarNotificacion('Completa al menos el nombre y precio por unidad', 'error');
        return;
    }
    
    const nuevoId = productos.length > 0 ? Math.max(...productos.map(p => p.id || 0)) + 1 : 1;
    
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
    
    productos.push({
        id: nuevoId,
        nombre: nombre,
        presentaciones: presentaciones,
        stock: 100,
        vendidos: 0
    });
    
    guardarProductos();
    
    document.getElementById('nombre-producto').value = '';
    document.getElementById('precio-unidad').value = '';
    document.getElementById('precio-bolsa').value = '';
    
    actualizarVistaProductos();
    mostrarNotificacion('Producto agregado correctamente', 'exito');
}

// Variables para el modal de edición
let productoEnEdicion = null;

function abrirModalEditar(productoId) {
    const producto = productos.find(p => p && p.id === productoId);
    if (!producto) return;
    
    productoEnEdicion = producto;
    
    document.getElementById('editar-id').value = producto.id;
    document.getElementById('editar-nombre').value = producto.nombre || '';
    
    const unidad = producto.presentaciones ? producto.presentaciones.find(p => p && p.tipo === 'unidad') : null;
    const bolsa = producto.presentaciones ? producto.presentaciones.find(p => p && p.tipo === 'bolsa') : null;
    
    document.getElementById('editar-precio-unidad').value = unidad ? unidad.precio : '';
    document.getElementById('editar-precio-bolsa').value = bolsa ? bolsa.precio : '';
    document.getElementById('editar-stock').value = producto.stock || 0;
    
    document.getElementById('modal-editar').style.display = 'flex';
}

function cerrarModalEditar() {
    document.getElementById('modal-editar').style.display = 'none';
    productoEnEdicion = null;
}

function guardarEdicion() {
    if (!productoEnEdicion) return;
    
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
    
    const index = productos.findIndex(p => p && p.id === productoEnEdicion.id);
    if (index !== -1) {
        productos[index] = {
            ...productos[index],
            nombre: nombre,
            presentaciones: presentaciones,
            stock: stock
        };
        guardarProductos();
        actualizarVistaProductos();
        cerrarModalEditar();
        mostrarNotificacion('Producto actualizado', 'exito');
    }
}

function eliminarProducto(id) {
    if (confirm('¿Eliminar este producto?')) {
        const index = productos.findIndex(p => p && p.id === id);
        if (index !== -1) {
            productos.splice(index, 1);
            guardarProductos();
            actualizarVistaProductos();
            mostrarNotificacion('Producto eliminado', 'info');
        }
    }
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
    if (!producto || !producto.presentaciones) return 0;
    const presentacion = producto.presentaciones.find(p => p && p.tipo === tipo);
    return presentacion ? presentacion.precio || 0 : 0;
}

// Función para actualizar stock y vendidos
function registrarVentaProducto(productoId, tipo, cantidadVendida) {
    const index = productos.findIndex(p => p && p.id === productoId);
    if (index === -1) return false;
    
    const producto = productos[index];
    if (!producto.presentaciones) return false;
    
    const presentacion = producto.presentaciones.find(p => p && p.tipo === tipo);
    
    if (!presentacion) return false;
    
    const unidadesVendidas = (presentacion.unidades || 1) * cantidadVendida;
    
    productos[index].stock = (productos[index].stock || 0) - unidadesVendidas;
    productos[index].vendidos = (productos[index].vendidos || 0) + unidadesVendidas;
    
    guardarProductos();
    return true;
}

// Inicializar
cargarProductos();

// Exponer funciones
window.mostrarProductos = mostrarProductos;
window.guardarProducto = guardarProducto;
window.eliminarProducto = eliminarProducto;
window.abrirModalEditar = abrirModalEditar;
window.cerrarModalEditar = cerrarModalEditar;
window.guardarEdicion = guardarEdicion;
window.obtenerProductos = () => productos;
window.obtenerPrecioProducto = obtenerPrecioProducto;
window.registrarVentaProducto = registrarVentaProducto;

console.log('🥐 Módulo de Productos cargado correctamente');