// modules/punto_venta.js - Punto de Venta para registrar ventas diarias

let carrito = [];
let catalogoProductos = [];

// Cargar productos disponibles
function cargarProductosPDV() {
    const prodData = localStorage.getItem('productos');
    if (prodData) {
        try {
            catalogoProductos = JSON.parse(prodData);
        } catch (e) {
            console.error('Error cargando productos:', e);
            catalogoProductos = [];
        }
    } else {
        catalogoProductos = [];
    }
}

// Función para mostrar el Punto de Venta
function mostrarPuntoVenta() {
    cargarProductosPDV();
    
    const totalCarrito = carrito.reduce((sum, item) => sum + (item.total || 0), 0);
    
    const metas = JSON.parse(localStorage.getItem('metas') || '{"diaria":100}');
    const metaDiaria = metas.diaria || 100;
    
    const ventas = JSON.parse(localStorage.getItem('ventas') || '[]');
    const hoy = new Date().toISOString().split('T')[0];
    const ventasHoy = ventas.filter(v => v.fecha === hoy);
    const totalVentasHoy = ventasHoy.reduce((sum, v) => sum + (v.total || 0), 0);
    const progresoMeta = Math.min(100, (totalVentasHoy / metaDiaria) * 100);
    
    return `
        <div style="padding: 1rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
                <h2 style="margin:0;">🛒 Punto de Venta</h2>
                <div style="background: linear-gradient(135deg, #8B4513, #D2691E); color: white; padding: 0.8rem 1.5rem; border-radius: 10px;">
                    <span style="font-size: 1.2rem;">Ventas Hoy: ${formatearMoneda(totalVentasHoy)}</span>
                </div>
            </div>
            
            <div style="background: white; padding: 1rem; border-radius: 10px; margin-bottom: 2rem;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                    <span>🎯 Meta Diaria: ${formatearMoneda(metaDiaria)}</span>
                    <span>${progresoMeta.toFixed(1)}% completado</span>
                </div>
                <div style="width: 100%; height: 20px; background: #f0f0f0; border-radius: 10px; overflow: hidden;">
                    <div style="width: ${progresoMeta}%; height: 100%; background: ${progresoMeta >= 100 ? '#2E7D32' : '#8B4513'}; transition: width 0.3s;"></div>
                </div>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 400px; gap: 2rem;">
                
                <!-- Columna izquierda: Catálogo de productos -->
                <div style="background: white; border-radius: 10px; padding: 1.5rem;">
                    <h3>🥐 Productos Disponibles</h3>
                    
                    <div style="margin-bottom: 1rem;">
                        <input type="text" id="buscador-pdv" placeholder="🔍 Buscar producto..." 
                               style="width: 100%; padding: 0.8rem; border: 1px solid #ddd; border-radius: 5px;"
                               onkeyup="filtrarProductosPDV()">
                    </div>
                    
                    <div id="grid-productos-pdv" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 1rem; max-height: 500px; overflow-y: auto;">
                        ${renderizarGridProductosPDV()}
                    </div>
                </div>
                
                <!-- Columna derecha: Carrito de compras -->
                <div style="background: white; border-radius: 10px; padding: 1.5rem; display: flex; flex-direction: column;">
                    <h3>🛍️ Carrito de Compras</h3>
                    
                    <div id="carrito-items-pdv" style="min-height: 200px; max-height: 400px; overflow-y: auto; margin-bottom: 1rem;">
                        ${renderizarCarritoPDV()}
                    </div>
                    
                    <div style="border-top: 2px solid #f0f0f0; padding-top: 1rem;">
                        <div style="display: flex; justify-content: space-between; font-size: 1.3rem; margin-bottom: 1rem;">
                            <span><strong>TOTAL:</strong></span>
                            <span id="total-carrito-pdv" style="color: #8B4513; font-weight: bold;">${formatearMoneda(totalCarrito)}</span>
                        </div>
                        
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem;">
                            <button class="btn" style="background-color: #757575;" onclick="limpiarCarritoPDV()" ${carrito.length === 0 ? 'disabled' : ''}>
                                🧹 Limpiar
                            </button>
                            <button class="btn btn-success" onclick="finalizarVentaPDV()" ${carrito.length === 0 ? 'disabled' : ''}>
                                💰 Cobrar
                            </button>
                        </div>
                        
                        <button class="btn" style="margin-top: 1rem; width: 100%;" onclick="volverAlInicio()">
                            ← Volver al Menú
                        </button>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Modal para seleccionar presentación -->
        <div id="modal-producto-pdv" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); justify-content: center; align-items: center; z-index: 1000;">
            <div style="background: white; padding: 2rem; border-radius: 10px; width: 400px;">
                <h3 style="margin-top: 0;" id="modal-titulo-producto">Seleccionar Producto</h3>
                
                <input type="hidden" id="modal-producto-id">
                
                <div class="form-group">
                    <label>Presentación:</label>
                    <div id="modal-presentaciones" style="margin: 1rem 0;"></div>
                </div>
                
                <div class="form-group">
                    <label for="modal-cantidad">Cantidad:</label>
                    <input type="number" id="modal-cantidad" min="1" value="1" style="width: 100%; padding: 0.8rem; border: 1px solid #ddd; border-radius: 5px;">
                </div>
                
                <div id="modal-preview-total" style="margin: 1rem 0; font-size: 1.2rem; font-weight: bold; color: #8B4513; text-align: center;">
                    Total: $0.00
                </div>
                
                <div style="display: flex; gap: 1rem; justify-content: flex-end;">
                    <button class="btn" onclick="cerrarModalProductoPDV()">Cancelar</button>
                    <button class="btn btn-success" onclick="agregarAlCarritoPDV()">Agregar al Carrito</button>
                </div>
            </div>
        </div>
    `;
}

function renderizarGridProductosPDV() {
    if (!catalogoProductos || catalogoProductos.length === 0) {
        return '<p style="grid-column: 1/-1; text-align: center; color: #666;">No hay productos disponibles. Ve a "Productos" para agregar.</p>';
    }
    
    return catalogoProductos.map(prod => {
        if (!prod) return '';
        
        const stockTotal = prod.stock || 0;
        const sinStock = stockTotal <= 0;
        const precioBase = prod.presentaciones && prod.presentaciones[0] ? prod.presentaciones[0].precio : 0;
        
        return `
            <div onclick="${sinStock ? '' : `abrirModalProductoPDV(${prod.id})`}" 
                 style="border: 1px solid #ddd; border-radius: 8px; padding: 1rem; text-align: center; 
                        cursor: ${sinStock ? 'not-allowed' : 'pointer'}; 
                        background: ${sinStock ? '#f5f5f5' : 'white'};
                        transition: all 0.2s;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">🥐</div>
                <div style="font-weight: bold; margin-bottom: 0.5rem;">${prod.nombre || 'Producto'}</div>
                <div style="color: #0059ce; font-weight: bold; margin-bottom: 0.5rem;">
                    ${formatearMoneda(precioBase)}
                </div>
                <div style="font-size: 0.9rem; color: ${sinStock ? '#C62828' : '#2E7D32'};">
                    ${sinStock ? '❌ Sin stock' : `📦 Stock: ${stockTotal}`}
                </div>
            </div>
        `;
    }).join('');
}

function renderizarCarritoPDV() {
    if (!carrito || carrito.length === 0) {
        return '<p style="text-align: center; color: #666; padding: 2rem;">El carrito está vacío</p>';
    }
    
    return carrito.map((item, index) => `
        <div style="background: #f9f9f9; border-radius: 8px; padding: 1rem; margin-bottom: 0.8rem; border-left: 4px solid #8B4513;">
            <div style="display: flex; justify-content: space-between;">
                <div>
                    <div style="font-weight: bold;">${item.productoNombre || 'Producto'}</div>
                    <div style="font-size: 0.9rem; color: #666;">
                        ${item.presentacionTexto || 'Producto'} x${item.cantidad || 0}
                    </div>
                    <div style="font-size: 0.8rem;">${item.unidades || 0} unidades</div>
                </div>
                <div style="text-align: right;">
                    <div style="font-weight: bold; color: #8B4513;">${formatearMoneda(item.total || 0)}</div>
                    <button class="btn" style="background-color: var(--color-peligro); padding: 0.2rem 0.5rem; font-size: 0.8rem; margin-top: 0.3rem;" onclick="eliminarDelCarritoPDV(${index})">
                        🗑️
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

let productoSeleccionadoPDV = null;

function abrirModalProductoPDV(productoId) {
    const producto = catalogoProductos.find(p => p && p.id === productoId);
    if (!producto) return;
    
    productoSeleccionadoPDV = producto;
    
    document.getElementById('modal-titulo-producto').textContent = `📦 ${producto.nombre || 'Producto'}`;
    document.getElementById('modal-producto-id').value = productoId;
    
    const presentacionesDiv = document.getElementById('modal-presentaciones');
    presentacionesDiv.innerHTML = '';
    
    if (producto.presentaciones && producto.presentaciones.length > 0) {
        producto.presentaciones.forEach((p, idx) => {
            const div = document.createElement('div');
            div.style.margin = '0.5rem 0';
            div.innerHTML = `
                <label style="display: flex; align-items: center; gap: 1rem; padding: 0.8rem; border: 2px solid ${idx === 0 ? '#8B4513' : '#ddd'}; border-radius: 8px; cursor: pointer;">
                    <input type="radio" name="presentacion-pdv" value="${p.tipo || 'unidad'}" data-precio="${p.precio || 0}" data-unidades="${p.unidades || 1}" ${idx === 0 ? 'checked' : ''}>
                    <div>
                        <strong>${p.tipo === 'unidad' ? '🍞 Unidad' : '📦 Bolsa'}</strong>
                        <div>${formatearMoneda(p.precio || 0)} ${p.tipo === 'bolsa' ? `(${formatearMoneda((p.precio || 0)/(p.unidades || 1))}/und)` : ''}</div>
                    </div>
                </label>
            `;
            presentacionesDiv.appendChild(div);
        });
    }
    
    document.getElementById('modal-cantidad').value = '1';
    document.getElementById('modal-cantidad').oninput = actualizarPreviewTotal;
    
    document.querySelectorAll('input[name="presentacion-pdv"]').forEach(radio => {
        radio.addEventListener('change', actualizarPreviewTotal);
    });
    
    actualizarPreviewTotal();
    document.getElementById('modal-producto-pdv').style.display = 'flex';
}

function actualizarPreviewTotal() {
    const selectedRadio = document.querySelector('input[name="presentacion-pdv"]:checked');
    if (!selectedRadio) return;
    
    const precio = parseFloat(selectedRadio.dataset.precio) || 0;
    const cantidad = parseInt(document.getElementById('modal-cantidad').value) || 1;
    const total = precio * cantidad;
    
    document.getElementById('modal-preview-total').textContent = `Total: ${formatearMoneda(total)}`;
}

function cerrarModalProductoPDV() {
    document.getElementById('modal-producto-pdv').style.display = 'none';
    productoSeleccionadoPDV = null;
}

function agregarAlCarritoPDV() {
    if (!productoSeleccionadoPDV) return;
    
    const selectedRadio = document.querySelector('input[name="presentacion-pdv"]:checked');
    if (!selectedRadio) {
        mostrarNotificacion('Selecciona una presentación', 'error');
        return;
    }
    
    const tipo = selectedRadio.value;
    const precio = parseFloat(selectedRadio.dataset.precio) || 0;
    const unidadesPorPresentacion = parseInt(selectedRadio.dataset.unidades) || 1;
    const cantidad = parseInt(document.getElementById('modal-cantidad').value) || 1;
    
    const unidadesTotales = unidadesPorPresentacion * cantidad;
    
    if ((productoSeleccionadoPDV.stock || 0) < unidadesTotales) {
        mostrarNotificacion(`Stock insuficiente. Disponible: ${productoSeleccionadoPDV.stock || 0} unidades`, 'error');
        return;
    }
    
    const presentacionTexto = tipo === 'unidad' ? 'Unidad' : `Bolsa (${unidadesPorPresentacion} und)`;
    
    carrito.push({
        productoId: productoSeleccionadoPDV.id,
        productoNombre: productoSeleccionadoPDV.nombre,
        tipo: tipo,
        unidadesPorPresentacion: unidadesPorPresentacion,
        presentacionTexto: presentacionTexto,
        cantidad: cantidad,
        unidades: unidadesTotales,
        precioUnitario: precio,
        total: precio * cantidad
    });
    
    cerrarModalProductoPDV();
    actualizarVistaCarritoPDV();
    mostrarNotificacion('Producto agregado al carrito', 'exito');
}

function eliminarDelCarritoPDV(index) {
    if (carrito && carrito[index]) {
        carrito.splice(index, 1);
        actualizarVistaCarritoPDV();
        mostrarNotificacion('Producto eliminado del carrito', 'info');
    }
}

function limpiarCarritoPDV() {
    if (carrito.length > 0 && confirm('¿Vaciar el carrito?')) {
        carrito = [];
        actualizarVistaCarritoPDV();
        mostrarNotificacion('Carrito vaciado', 'info');
    }
}

function actualizarVistaCarritoPDV() {
    const carritoDiv = document.getElementById('carrito-items-pdv');
    if (carritoDiv) {
        carritoDiv.innerHTML = renderizarCarritoPDV();
    }
    
    // Actualizar el total en el DOM
    const totalSpan = document.getElementById('total-carrito-pdv');
    if (totalSpan) {
        const total = carrito.reduce((sum, item) => sum + (item.total || 0), 0);
        totalSpan.textContent = formatearMoneda(total);
    }
    
    // Actualizar estado de los botones
    const limpiarBtn = document.querySelector('button[onclick="limpiarCarritoPDV()"]');
    const cobrarBtn = document.querySelector('button[onclick="finalizarVentaPDV()"]');
    
    if (limpiarBtn && cobrarBtn) {
        if (carrito.length === 0) {
            limpiarBtn.disabled = true;
            cobrarBtn.disabled = true;
        } else {
            limpiarBtn.disabled = false;
            cobrarBtn.disabled = false;
        }
    }
}

function finalizarVentaPDV() {
    if (!carrito || carrito.length === 0) {
        mostrarNotificacion('El carrito está vacío', 'error');
        return;
    }
    
    const totalVenta = carrito.reduce((sum, item) => sum + (item.total || 0), 0);
    
    if (confirm(`¿Confirmar venta por ${formatearMoneda(totalVenta)}?`)) {
        
        const ventas = JSON.parse(localStorage.getItem('ventas') || '[]');
        const hoy = new Date().toISOString().split('T')[0];
        
        carrito.forEach(item => {
            const nuevoId = ventas.length > 0 ? Math.max(...ventas.map(v => v.id || 0)) + 1 : 1;
            
            const nuevaVenta = {
                id: nuevoId,
                fecha: hoy,
                productoId: item.productoId,
                productoNombre: item.productoNombre,
                tipo: item.tipo,
                unidadesPorPresentacion: item.unidadesPorPresentacion,
                cantidad: item.cantidad,
                unidadesVendidas: item.unidades,
                precioUnitario: item.precioUnitario,
                total: item.total
            };
            
            ventas.push(nuevaVenta);
            
            if (window.registrarVentaProducto) {
                window.registrarVentaProducto(item.productoId, item.tipo, item.cantidad);
            }
        });
        
        localStorage.setItem('ventas', JSON.stringify(ventas));
        
        carrito = [];
        cargarProductosPDV();
        actualizarVistaCarritoPDV();
        
        const grid = document.getElementById('grid-productos-pdv');
        if (grid) {
            grid.innerHTML = renderizarGridProductosPDV();
        }
        
        mostrarNotificacion(`✅ Venta completada: ${formatearMoneda(totalVenta)}`, 'exito');
    }
}

function filtrarProductosPDV() {
    const texto = document.getElementById('buscador-pdv').value.toLowerCase();
    const productosFiltrados = catalogoProductos.filter(p => 
        p && p.nombre && p.nombre.toLowerCase().includes(texto)
    );
    
    const grid = document.getElementById('grid-productos-pdv');
    if (grid) {
        if (productosFiltrados.length === 0) {
            grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #666;">No se encontraron productos</p>';
        } else {
            grid.innerHTML = productosFiltrados.map(prod => {
                const stockTotal = prod.stock || 0;
                const sinStock = stockTotal <= 0;
                const precioBase = prod.presentaciones && prod.presentaciones[0] ? prod.presentaciones[0].precio : 0;
                
                return `
                    <div onclick="${sinStock ? '' : `abrirModalProductoPDV(${prod.id})`}" 
                         style="border: 1px solid #ddd; border-radius: 8px; padding: 1rem; text-align: center; 
                                cursor: ${sinStock ? 'not-allowed' : 'pointer'}; 
                                background: ${sinStock ? '#f5f5f5' : 'white'};
                                transition: all 0.2s;
                                box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">🥐</div>
                        <div style="font-weight: bold; margin-bottom: 0.5rem;">${prod.nombre}</div>
                        <div style="color: #8B4513; font-weight: bold; margin-bottom: 0.5rem;">
                            ${formatearMoneda(precioBase)}
                        </div>
                        <div style="font-size: 0.9rem; color: ${sinStock ? '#C62828' : '#2E7D32'};">
                            ${sinStock ? '❌ Sin stock' : `📦 Stock: ${stockTotal}`}
                        </div>
                    </div>
                `;
            }).join('');
        }
    }
}

// Inicializar
cargarProductosPDV();

// Exponer funciones
window.mostrarPuntoVenta = mostrarPuntoVenta;
window.filtrarProductosPDV = filtrarProductosPDV;
window.abrirModalProductoPDV = abrirModalProductoPDV;
window.cerrarModalProductoPDV = cerrarModalProductoPDV;
window.agregarAlCarritoPDV = agregarAlCarritoPDV;
window.eliminarDelCarritoPDV = eliminarDelCarritoPDV;
window.limpiarCarritoPDV = limpiarCarritoPDV;
window.finalizarVentaPDV = finalizarVentaPDV;

console.log('🛒 Módulo Punto de Venta cargado correctamente');