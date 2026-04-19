// modules/punto_venta.js - Punto de Venta con Supabase

let carrito = [];
let catalogoProductos = [];

// Cargar productos disponibles desde Supabase
async function cargarProductosPDV() {
    const client = window.supabaseClient?.getClient();
    
    if (!client) {
        console.error('❌ Cliente Supabase no disponible');
        catalogoProductos = [];
        return;
    }
    
    try {
        const { data, error } = await client
            .from('productos')
            .select('*')
            .order('nombre', { ascending: true });
        
        if (error) {
            console.error('Error cargando productos:', error);
            catalogoProductos = [];
            return;
        }
        
        catalogoProductos = (data || []).map(p => {
            // Parsear presentaciones si es string
            let presentaciones = p.presentaciones;
            try {
                if (typeof presentaciones === 'string') {
                    presentaciones = JSON.parse(presentaciones);
                }
            } catch (e) {
                presentaciones = [];
            }
            
            return {
                ...p,
                presentaciones: presentaciones
            };
        });
        
        console.log(`✅ ${catalogoProductos.length} productos cargados para PDV`);
    } catch (e) {
        console.error('Error cargando productos:', e);
        catalogoProductos = [];
    }
}

// Cargar metas desde Supabase
async function cargarMetasPDV() {
    const client = window.supabaseClient?.getClient();
    
    if (!client) {
        return { diaria: 100, quincenal: 1500, mensual: 2500 };
    }
    
    try {
        const { data, error } = await client
            .from('metas')
            .select('*')
            .eq('id', 1)
            .single();
        
        if (error) {
            console.error('Error cargando metas:', error);
            return { diaria: 100, quincenal: 1500, mensual: 2500 };
        }
        
        return data || { diaria: 100, quincenal: 1500, mensual: 2500 };
    } catch (e) {
        console.error('Error cargando metas:', e);
        return { diaria: 100, quincenal: 1500, mensual: 2500 };
    }
}

// Obtener ventas de hoy desde Supabase
async function obtenerVentasHoy() {
    const client = window.supabaseClient?.getClient();
    
    if (!client) {
        return { total: 0, cantidad: 0 };
    }
    
    const hoy = new Date().toISOString().split('T')[0];
    
    try {
        const { data, error } = await client
            .from('ventas')
            .select('total')
            .eq('fecha', hoy);
        
        if (error) {
            console.error('Error obteniendo ventas de hoy:', error);
            return { total: 0, cantidad: 0 };
        }
        
        const total = (data || []).reduce((sum, v) => sum + (Number(v.total) || 0), 0);
        const cantidad = (data || []).length;
        
        return { total, cantidad };
    } catch (e) {
        console.error('Error obteniendo ventas de hoy:', e);
        return { total: 0, cantidad: 0 };
    }
}

// Función para mostrar el Punto de Venta
async function mostrarPuntoVenta() {
    // Mostrar loading
    const tempHtml = `
        <div style="padding: 1rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
                <h2 style="margin:0;">🛒 Punto de Venta</h2>
                <div style="background: linear-gradient(135deg, #8B4513, #D2691E); color: white; padding: 0.8rem 1.5rem; border-radius: 10px;">
                    <span style="font-size: 1.2rem;">Cargando...</span>
                </div>
            </div>
            <div style="text-align: center; padding: 3rem;">
                <p>🔄 Conectando con Supabase...</p>
            </div>
        </div>
    `;
    
    await cargarProductosPDV();
    const metas = await cargarMetasPDV();
    const ventasHoy = await obtenerVentasHoy();
    
    const metaDiaria = metas.diaria || 100;
    const totalVentasHoy = ventasHoy.total;
    const progresoMeta = metaDiaria > 0 ? Math.min(100, (totalVentasHoy / metaDiaria) * 100) : 0;
    const totalCarrito = carrito.reduce((sum, item) => sum + (item.total || 0), 0);
    
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
                <div style="margin-top: 0.5rem; font-size: 0.9rem; color: #666;">
                    Faltan ${formatearMoneda(Math.max(0, metaDiaria - totalVentasHoy))} para alcanzar la meta
                </div>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 400px; gap: 2rem;">
                
                <!-- Columna izquierda: Catálogo de productos -->
                <div style="background: white; border-radius: 10px; padding: 1.5rem;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                        <h3 style="margin:0;">🥐 Productos Disponibles</h3>
                        <button class="btn btn-info" style="padding: 0.3rem 0.8rem;" onclick="sincronizarProductosPDV()">
                            🔄 Sincronizar
                        </button>
                    </div>
                    
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
        return '<p style="grid-column: 1/-1; text-align: center; color: #666; padding: 2rem;">No hay productos disponibles. Ve a "Productos" para agregar.</p>';
    }
    
    return catalogoProductos.map(prod => {
        if (!prod) return '';
        
        const stockTotal = prod.stock || 0;
        const sinStock = stockTotal <= 0;
        
        let precioBase = 0;
        if (prod.presentaciones && prod.presentaciones.length > 0) {
            precioBase = prod.presentaciones[0].precio || 0;
        }
        
        return `
            <div onclick="${sinStock ? '' : `abrirModalProductoPDV(${prod.id})`}" 
                 style="border: 1px solid #ddd; border-radius: 8px; padding: 1rem; text-align: center; 
                        cursor: ${sinStock ? 'not-allowed' : 'pointer'}; 
                        background: ${sinStock ? '#f5f5f5' : 'white'};
                        transition: all 0.2s;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">🥐</div>
                <div style="font-weight: bold; margin-bottom: 0.5rem;">${prod.nombre || 'Producto'}</div>
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
    
    const presentaciones = producto.presentaciones || [];
    
    if (presentaciones.length > 0) {
        presentaciones.forEach((p, idx) => {
            const div = document.createElement('div');
            div.style.margin = '0.5rem 0';
            div.innerHTML = `
                <label style="display: flex; align-items: center; gap: 1rem; padding: 0.8rem; border: 2px solid ${idx === 0 ? '#8B4513' : '#ddd'}; border-radius: 8px; cursor: pointer;">
                    <input type="radio" name="presentacion-pdv" value="${p.tipo || 'unidad'}" data-precio="${p.precio || 0}" data-unidades="${p.unidades || 1}" ${idx === 0 ? 'checked' : ''}>
                    <div>
                        <strong>${p.tipo === 'unidad' ? '🍞 Unidad' : '📦 Bolsa'}</strong>
                        <div>${formatearMoneda(p.precio || 0)} ${p.tipo === 'bolsa' ? `(${formatearMoneda((p.precio || 0) / (p.unidades || 1))}/und)` : ''}</div>
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
    
    const presentacionTexto = tipo === 'unidad' ? '🍞 Unidad' : `📦 Bolsa (${unidadesPorPresentacion} und)`;
    
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
    
    const totalSpan = document.getElementById('total-carrito-pdv');
    if (totalSpan) {
        const total = carrito.reduce((sum, item) => sum + (item.total || 0), 0);
        totalSpan.textContent = formatearMoneda(total);
    }
    
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

async function finalizarVentaPDV() {
    const client = window.supabaseClient?.getClient();
    
    if (!client) {
        mostrarNotificacion('Error: Cliente Supabase no disponible', 'error');
        return;
    }
    
    if (!carrito || carrito.length === 0) {
        mostrarNotificacion('El carrito está vacío', 'error');
        return;
    }
    
    const totalVenta = carrito.reduce((sum, item) => sum + (item.total || 0), 0);
    
    if (confirm(`¿Confirmar venta por ${formatearMoneda(totalVenta)}?`)) {
        
        const hoy = new Date().toISOString().split('T')[0];
        let ventasExitosas = 0;
        let errores = 0;
        
        for (const item of carrito) {
            // Verificar stock nuevamente
            const producto = catalogoProductos.find(p => p.id === item.productoId);
            if (!producto || (producto.stock || 0) < item.unidades) {
                mostrarNotificacion(`Stock insuficiente para ${item.productoNombre}`, 'error');
                errores++;
                continue;
            }
            
            const nuevaVenta = {
                fecha: hoy,
                producto_id: item.productoId,
                producto_nombre: item.productoNombre,
                tipo: item.tipo,
                unidades_por_presentacion: item.unidadesPorPresentacion,
                cantidad: item.cantidad,
                unidades_vendidas: item.unidades,
                precio_unitario: item.precioUnitario,
                total: item.total
            };
            
            try {
                // Insertar venta en Supabase
                const { data: ventaData, error: ventaError } = await client
                    .from('ventas')
                    .insert([nuevaVenta])
                    .select();
                
                if (ventaError) {
                    console.error('Error guardando venta:', ventaError);
                    errores++;
                    continue;
                }
                
                // Actualizar stock del producto
                const nuevoStock = (producto.stock || 0) - item.unidades;
                const nuevosVendidos = (producto.vendidos || 0) + item.unidades;
                
                const { error: stockError } = await client
                    .from('productos')
                    .update({
                        stock: nuevoStock,
                        vendidos: nuevosVendidos
                    })
                    .eq('id', item.productoId);
                
                if (stockError) {
                    console.error('Error actualizando stock:', stockError);
                }
                
                // Actualizar producto en catálogo local
                const idx = catalogoProductos.findIndex(p => p.id === item.productoId);
                if (idx !== -1) {
                    catalogoProductos[idx].stock = nuevoStock;
                    catalogoProductos[idx].vendidos = nuevosVendidos;
                }
                
                ventasExitosas++;
            } catch (e) {
                console.error('Error en venta:', e);
                errores++;
            }
        }
        
        // Limpiar carrito
        carrito = [];
        
        // Actualizar vista
        actualizarVistaCarritoPDV();
        
        const grid = document.getElementById('grid-productos-pdv');
        if (grid) {
            grid.innerHTML = renderizarGridProductosPDV();
        }
        
        // Actualizar total de ventas hoy en el encabezado
        const ventasHoy = await obtenerVentasHoy();
        const headerSpan = document.querySelector('div[style*="Ventas Hoy"] span');
        if (headerSpan) {
            headerSpan.textContent = `Ventas Hoy: ${formatearMoneda(ventasHoy.total)}`;
        }
        
        if (errores > 0) {
            mostrarNotificacion(`⚠️ Venta parcial: ${ventasExitosas} exitosas, ${errores} errores`, 'error');
        } else {
            mostrarNotificacion(`✅ Venta completada: ${formatearMoneda(totalVenta)}`, 'exito');
        }
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
                
                let precioBase = 0;
                if (prod.presentaciones && prod.presentaciones.length > 0) {
                    precioBase = prod.presentaciones[0].precio || 0;
                }
                
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

async function sincronizarProductosPDV() {
    await cargarProductosPDV();
    
    const grid = document.getElementById('grid-productos-pdv');
    if (grid) {
        grid.innerHTML = renderizarGridProductosPDV();
    }
    
    mostrarNotificacion('Productos sincronizados', 'exito');
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
        await cargarProductosPDV();
        console.log('✅ Módulo Punto de Venta inicializado con Supabase');
    } else {
        console.error('❌ No se pudo conectar con Supabase');
    }
})();

// Exponer funciones
window.mostrarPuntoVenta = mostrarPuntoVenta;
window.filtrarProductosPDV = filtrarProductosPDV;
window.abrirModalProductoPDV = abrirModalProductoPDV;
window.cerrarModalProductoPDV = cerrarModalProductoPDV;
window.agregarAlCarritoPDV = agregarAlCarritoPDV;
window.eliminarDelCarritoPDV = eliminarDelCarritoPDV;
window.limpiarCarritoPDV = limpiarCarritoPDV;
window.finalizarVentaPDV = finalizarVentaPDV;
window.sincronizarProductosPDV = sincronizarProductosPDV;

console.log('🛒 Módulo Punto de Venta (Supabase) cargado correctamente');