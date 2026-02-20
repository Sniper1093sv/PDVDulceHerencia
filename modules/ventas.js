// modules/ventas.js - Historial de ventas (CORREGIDO)

let ventas = [];
let productosCatalogo = [];  // CAMBIADO: antes era catalogoProductos

// Cargar datos
function cargarVentas() {
    const datos = localStorage.getItem('ventas');
    if (datos) {
        try {
            ventas = JSON.parse(datos);
            ventas = ventas.map(v => ({
                ...v,
                cantidad: Number(v.cantidad) || 0,
                precioUnitario: Number(v.precioUnitario) || 0,
                total: Number(v.total) || 0,
                unidadesVendidas: Number(v.unidadesVendidas) || 0
            }));
        } catch (e) {
            console.error('Error cargando ventas:', e);
            ventas = [];
        }
    } else {
        ventas = [];
    }
    
    // Cargar productos
    const prodData = localStorage.getItem('productos');
    if (prodData) {
        try {
            productosCatalogo = JSON.parse(prodData);  // CAMBIADO
        } catch (e) {
            console.error('Error cargando productos:', e);
            productosCatalogo = [];  // CAMBIADO
        }
    } else {
        productosCatalogo = [];  // CAMBIADO
    }
}

function guardarVentas() {
    localStorage.setItem('ventas', JSON.stringify(ventas));
}

// Función para calcular total general
function calcularTotalGeneral() {
    return ventas.reduce((sum, v) => sum + (Number(v.total) || 0), 0);
}

// Función para mostrar el historial de ventas
function mostrarVentas() {
    console.log('Cargando historial de ventas...');
    
    // Actualizar productos desde localStorage
    const prodData = localStorage.getItem('productos');
    productosCatalogo = prodData ? JSON.parse(prodData) : [];  // CAMBIADO
    
    cargarVentas();
    
    const ventasOrdenadas = [...ventas].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    const totalGeneral = calcularTotalGeneral();
    
    return `
        <h2>📋 Historial de Ventas</h2>
        
        <div style="background: white; padding: 1.5rem; border-radius: 10px; margin-bottom: 2rem;">
            <h3>Resumen General</h3>
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem;">
                <div>
                    <strong>Total Ventas:</strong>
                    <p style="font-size: 1.5rem; color: #2E7D32;">${formatearMoneda(totalGeneral)}</p>
                </div>
                <div>
                    <strong>Número de Ventas:</strong>
                    <p style="font-size: 1.5rem;">${ventas.length}</p>
                </div>
                <div>
                    <strong>Unidades Vendidas:</strong>
                    <p style="font-size: 1.5rem;">${ventas.reduce((sum, v) => sum + (v.unidadesVendidas || 0), 0)}</p>
                </div>
            </div>
        </div>
        
        <div class="table-container">
            <h3>Todas las Ventas</h3>
            <table>
                <thead>
                    <tr>
                        <th>Fecha</th>
                        <th>Producto</th>
                        <th>Presentación</th>
                        <th>Cantidad</th>
                        <th>Unidades</th>
                        <th>Precio Unit.</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${renderizarHistorialVentas(ventasOrdenadas)}
                </tbody>
                <tfoot>
                    <tr style="background: #f0f0f0; font-weight: bold;">
                        <td colspan="6" style="text-align: right;">TOTAL GENERAL:</td>
                        <td>${formatearMoneda(totalGeneral)}</td>
                    </tr>
                </tfoot>
            </table>
        </div>
        
        <button class="btn" style="margin-top: 1rem;" onclick="volverAlInicio()">← Volver al Inicio</button>
    `;
}

function renderizarHistorialVentas(ventasOrdenadas) {
    if (ventasOrdenadas.length === 0) {
        return `<tr><td colspan="7" style="text-align: center; padding: 2rem;">No hay ventas registradas</td></tr>`;
    }
    
    return ventasOrdenadas.map(venta => {
        const presentacionTexto = venta.tipo === 'unidad' ? 
            'Unidad' : `Bolsa (${venta.unidadesPorPresentacion} und)`;
        
        return `
            <tr>
                <td>${new Date(venta.fecha).toLocaleDateString('es-ES')}</td>
                <td><strong>${venta.productoNombre}</strong></td>
                <td>${presentacionTexto}</td>
                <td>${venta.cantidad}</td>
                <td>${venta.unidadesVendidas}</td>
                <td>${formatearMoneda(venta.precioUnitario)}</td>
                <td>${formatearMoneda(venta.total)}</td>
            </tr>
        `;
    }).join('');
}

// Inicializar
cargarVentas();

// Exponer funciones
window.mostrarVentas = mostrarVentas;

console.log('📋 Módulo de Historial de Ventas cargado correctamente');