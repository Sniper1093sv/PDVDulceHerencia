// modules/materia_prima.js - Gestión de inventario de materia prima

let materiaPrima = [];

// Cargar datos
function cargarMateriaPrima() {
    const datos = localStorage.getItem('materiaPrima');
    if (datos) {
        try {
            materiaPrima = JSON.parse(datos);
        } catch (e) {
            console.error('Error cargando materia prima:', e);
            materiaPrima = [];
        }
    } else {
        // Datos de ejemplo
        materiaPrima = [
            { id: 1, nombre: 'Harina', cantidad: 50, unidad: 'kg', precioUnitario: 0.80, fechaCompra: '2026-02-01', proveedor: 'Distribuidora Central' },
            { id: 2, nombre: 'Azúcar', cantidad: 30, unidad: 'kg', precioUnitario: 1.20, fechaCompra: '2026-02-05', proveedor: 'Distribuidora Central' },
            { id: 3, nombre: 'Huevos', cantidad: 120, unidad: 'unidades', precioUnitario: 0.15, fechaCompra: '2026-02-10', proveedor: 'Granja Local' },
            { id: 4, nombre: 'Mantequilla', cantidad: 20, unidad: 'kg', precioUnitario: 4.50, fechaCompra: '2026-02-12', proveedor: 'Lácteos SA' },
            { id: 5, nombre: 'Levadura', cantidad: 5, unidad: 'kg', precioUnitario: 3.20, fechaCompra: '2026-02-15', proveedor: 'Distribuidora Central' },
        ];
        guardarMateriaPrima();
    }
}

function guardarMateriaPrima() {
    localStorage.setItem('materiaPrima', JSON.stringify(materiaPrima));
}

// Función para calcular total invertido en materia prima
function calcularTotalInvertido() {
    return materiaPrima.reduce((total, item) => {
        return total + (item.cantidad * item.precioUnitario);
    }, 0);
}

// Función para mostrar el módulo
function mostrarMateriaPrima() {
    const totalInvertido = calcularTotalInvertido();
    const itemsBajoStock = materiaPrima.filter(item => {
        if (item.unidad === 'kg' || item.unidad === 'litros') return item.cantidad < 10;
        if (item.unidad === 'unidades') return item.cantidad < 50;
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
    
    return materiaPrima.map((item, index) => {
        const total = item.cantidad * item.precioUnitario;
        const bajoStock = (item.unidad === 'kg' && item.cantidad < 10) || 
                         (item.unidad === 'litros' && item.cantidad < 10) || 
                         (item.unidad === 'unidades' && item.cantidad < 50) ||
                         (item.unidad === 'gramos' && item.cantidad < 1000);
        
        return `
            <tr style="${bajoStock ? 'background: #ffebee;' : ''}">
                <td><strong>${item.nombre}</strong></td>
                <td style="font-weight: ${bajoStock ? 'bold' : 'normal'}; color: ${bajoStock ? '#C62828' : 'inherit'};">${item.cantidad}</td>
                <td>${item.unidad}</td>
                <td>${formatearMoneda(item.precioUnitario)}</td>
                <td>${formatearMoneda(total)}</td>
                <td>${item.proveedor}</td>
                <td>${new Date(item.fechaCompra).toLocaleDateString('es-ES')}</td>
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
    
    document.getElementById('ajustar-nombre').value = item.nombre;
    document.getElementById('ajustar-cantidad-actual').value = `${item.cantidad} ${item.unidad}`;
    document.getElementById('ajustar-cantidad').value = '';
    
    document.getElementById('modal-ajustar-stock').style.display = 'flex';
}

function cerrarModalAjustar() {
    document.getElementById('modal-ajustar-stock').style.display = 'none';
    itemEnAjuste = null;
}

function guardarAjusteStock() {
    if (!itemEnAjuste) return;
    
    const operacion = document.getElementById('ajustar-operacion').value;
    const cantidadAjuste = parseFloat(document.getElementById('ajustar-cantidad').value);
    
    if (isNaN(cantidadAjuste) || cantidadAjuste < 0) {
        mostrarNotificacion('Ingresa una cantidad válida', 'error');
        return;
    }
    
    const index = materiaPrima.findIndex(i => i.id === itemEnAjuste.id);
    if (index === -1) return;
    
    let nuevaCantidad;
    switch(operacion) {
        case 'sumar':
            nuevaCantidad = materiaPrima[index].cantidad + cantidadAjuste;
            mostrarNotificacion(`Stock agregado: +${cantidadAjuste}`, 'exito');
            break;
        case 'restar':
            if (materiaPrima[index].cantidad < cantidadAjuste) {
                mostrarNotificacion('No hay suficiente stock', 'error');
                return;
            }
            nuevaCantidad = materiaPrima[index].cantidad - cantidadAjuste;
            mostrarNotificacion(`Stock consumido: -${cantidadAjuste}`, 'info');
            break;
        case 'actualizar':
            nuevaCantidad = cantidadAjuste;
            mostrarNotificacion('Stock actualizado', 'exito');
            break;
        default:
            return;
    }
    
    materiaPrima[index].cantidad = nuevaCantidad;
    guardarMateriaPrima();
    cerrarModalAjustar();
    
    // Actualizar vista
    const tablaBody = document.getElementById('materia-prima-body');
    if (tablaBody) {
        tablaBody.innerHTML = renderizarMateriaPrima();
    }
}

function guardarMateriaPrimaItem() {
    const nombre = document.getElementById('mp-nombre').value;
    const cantidad = parseFloat(document.getElementById('mp-cantidad').value);
    const unidad = document.getElementById('mp-unidad').value;
    const precio = parseFloat(document.getElementById('mp-precio').value);
    const proveedor = document.getElementById('mp-proveedor').value;
    const fecha = document.getElementById('mp-fecha').value;
    
    if (!nombre || !cantidad || !precio || !proveedor || !fecha) {
        mostrarNotificacion('Completa todos los campos', 'error');
        return;
    }
    
    const nuevoId = materiaPrima.length > 0 ? Math.max(...materiaPrima.map(i => i.id)) + 1 : 1;
    
    materiaPrima.push({
        id: nuevoId,
        nombre: nombre,
        cantidad: cantidad,
        unidad: unidad,
        precioUnitario: precio,
        proveedor: proveedor,
        fechaCompra: fecha
    });
    
    guardarMateriaPrima();
    
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
    
    mostrarNotificacion('Materia prima agregada', 'exito');
}

function eliminarMateriaPrima(id) {
    if (confirm('¿Eliminar este item del inventario?')) {
        const index = materiaPrima.findIndex(i => i.id === id);
        if (index !== -1) {
            materiaPrima.splice(index, 1);
            guardarMateriaPrima();
            
            const tablaBody = document.getElementById('materia-prima-body');
            if (tablaBody) {
                tablaBody.innerHTML = renderizarMateriaPrima();
            }
            
            mostrarNotificacion('Item eliminado', 'info');
        }
    }
}

// Inicializar
cargarMateriaPrima();

// Exponer funciones
window.mostrarMateriaPrima = mostrarMateriaPrima;
window.guardarMateriaPrimaItem = guardarMateriaPrimaItem;
window.eliminarMateriaPrima = eliminarMateriaPrima;
window.abrirModalAjustar = abrirModalAjustar;
window.cerrarModalAjustar = cerrarModalAjustar;
window.guardarAjusteStock = guardarAjusteStock;

console.log('📦 Módulo de Materia Prima cargado');