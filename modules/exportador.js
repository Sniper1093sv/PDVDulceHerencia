// modules/exportador.js - Exportar reportes a PDF y Excel

// Función para generar PDF de ventas
async function generarPDFVentas(periodo = 'todo') {
    try {
        const ventas = await obtenerDatos('ventas');
        const productos = await obtenerDatos('productos');
        
        let ventasFiltradas = ventas;
        let tituloPeriodo = 'Todas las ventas';
        
        // Filtrar por período si se especifica
        if (periodo !== 'todo') {
            const hoy = new Date();
            const fechaLimite = new Date();
            
            switch(periodo) {
                case 'dia':
                    fechaLimite.setDate(hoy.getDate() - 1);
                    tituloPeriodo = 'Últimas 24 horas';
                    break;
                case 'semana':
                    fechaLimite.setDate(hoy.getDate() - 7);
                    tituloPeriodo = 'Última semana';
                    break;
                case 'mes':
                    fechaLimite.setMonth(hoy.getMonth() - 1);
                    tituloPeriodo = 'Último mes';
                    break;
            }
            
            ventasFiltradas = ventas.filter(v => new Date(v.fecha) >= fechaLimite);
        }
        
        // Calcular totales
        const totalVentas = ventasFiltradas.reduce((sum, v) => sum + (v.total || 0), 0);
        const totalUnidades = ventasFiltradas.reduce((sum, v) => sum + (v.unidadesVendidas || 0), 0);
        
        // Crear contenido HTML para el PDF
        const contenidoHTML = `
            <html>
            <head>
                <title>Reporte de Ventas - Dulce Herencia</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    h1 { color: #8B4513; border-bottom: 2px solid #8B4513; }
                    h2 { color: #D2691E; }
                    table { border-collapse: collapse; width: 100%; margin-top: 20px; }
                    th { background: #8B4513; color: white; padding: 10px; text-align: left; }
                    td { border: 1px solid #ddd; padding: 8px; }
                    .total { font-weight: bold; background: #f0f0f0; }
                    .resumen { display: flex; justify-content: space-between; margin: 20px 0; }
                    .resumen-item { background: #f5f5f5; padding: 10px; border-radius: 5px; flex: 1; margin: 0 5px; }
                    .footer { margin-top: 30px; text-align: center; color: #666; }
                </style>
            </head>
            <body>
                <h1>Panadería Dulce Herencia</h1>
                <h2>Reporte de Ventas - ${tituloPeriodo}</h2>
                <p>Fecha de generación: ${new Date().toLocaleDateString('es-ES')}</p>
                
                <div class="resumen">
                    <div class="resumen-item">
                        <strong>Total Ventas:</strong><br>
                        <span style="font-size: 1.5rem; color: #2E7D32;">${formatearMoneda(totalVentas)}</span>
                    </div>
                    <div class="resumen-item">
                        <strong>Número de Ventas:</strong><br>
                        <span style="font-size: 1.5rem;">${ventasFiltradas.length}</span>
                    </div>
                    <div class="resumen-item">
                        <strong>Unidades Vendidas:</strong><br>
                        <span style="font-size: 1.5rem;">${totalUnidades}</span>
                    </div>
                </div>
                
                <h3>Detalle de Ventas</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Fecha</th>
                            <th>Producto</th>
                            <th>Presentación</th>
                            <th>Cantidad</th>
                            <th>Unidades</th>
                            <th>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${ventasFiltradas.map(v => `
                            <tr>
                                <td>${new Date(v.fecha).toLocaleDateString('es-ES')}</td>
                                <td>${v.productoNombre || 'Producto'}</td>
                                <td>${v.tipo === 'unidad' ? 'Unidad' : 'Bolsa'}</td>
                                <td>${v.cantidad || 1}</td>
                                <td>${v.unidadesVendidas || 0}</td>
                                <td>${formatearMoneda(v.total || 0)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                    <tfoot>
                        <tr class="total">
                            <td colspan="5" style="text-align: right;">TOTAL:</td>
                            <td>${formatearMoneda(totalVentas)}</td>
                        </tr>
                    </tfoot>
                </table>
                
                <div class="footer">
                    <p>Panadería Dulce Herencia - Sistema de Gestión</p>
                </div>
            </body>
            </html>
        `;
        
        // Abrir en nueva ventana para imprimir/guardar como PDF
        const ventana = window.open('', '_blank');
        ventana.document.write(contenidoHTML);
        ventana.document.close();
        ventana.print();
        
        return true;
    } catch (error) {
        console.error('Error generando PDF:', error);
        mostrarNotificacion('Error al generar PDF', 'error');
        return false;
    }
}

// Función para generar PDF de ganancias
async function generarPDFGanancias() {
    try {
        const ventas = await obtenerDatos('ventas');
        const inversiones = await obtenerDatos('inversiones');
        const empleados = await obtenerDatos('empleados');
        
        const totalVentas = ventas.reduce((sum, v) => sum + (v.total || 0), 0);
        const totalInversiones = inversiones.reduce((sum, inv) => sum + (inv.monto || 0), 0);
        const empleadosActivos = empleados.filter(e => e.activo).length;
        const costoPlanilla = empleadosActivos * 15 * 30;
        
        const gananciaNeta = totalVentas - totalInversiones - costoPlanilla;
        
        // Agrupar inversiones por categoría
        const invPorCategoria = {};
        inversiones.forEach(inv => {
            const cat = inv.categoria || 'general';
            if (!invPorCategoria[cat]) invPorCategoria[cat] = 0;
            invPorCategoria[cat] += inv.monto || 0;
        });
        
        const contenidoHTML = `
            <html>
            <head>
                <title>Reporte de Ganancias - Dulce Herencia</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    h1 { color: #8B4513; border-bottom: 2px solid #8B4513; }
                    h2 { color: #D2691E; }
                    table { border-collapse: collapse; width: 100%; margin: 20px 0; }
                    th { background: #8B4513; color: white; padding: 10px; }
                    td { border: 1px solid #ddd; padding: 8px; }
                    .positivo { color: #2E7D32; font-weight: bold; }
                    .negativo { color: #C62828; font-weight: bold; }
                    .resumen-card { background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 10px 0; }
                </style>
            </head>
            <body>
                <h1>Panadería Dulce Herencia</h1>
                <h2>Reporte de Ganancias</h2>
                <p>Fecha de generación: ${new Date().toLocaleDateString('es-ES')}</p>
                
                <div class="resumen-card">
                    <h3>Resumen Financiero</h3>
                    <table>
                        <tr>
                            <td><strong>Ingresos Totales:</strong></td>
                            <td class="positivo">${formatearMoneda(totalVentas)}</td>
                        </tr>
                        <tr>
                            <td><strong>Total Inversiones:</strong></td>
                            <td class="negativo">-${formatearMoneda(totalInversiones)}</td>
                        </tr>
                        <tr>
                            <td><strong>Costo Planilla (Mensual):</strong></td>
                            <td class="negativo">-${formatearMoneda(costoPlanilla)}</td>
                        </tr>
                        <tr style="border-top: 2px solid #333;">
                            <td><strong>GANANCIA NETA:</strong></td>
                            <td class="${gananciaNeta >= 0 ? 'positivo' : 'negativo'}">
                                ${formatearMoneda(gananciaNeta)}
                            </td>
                        </tr>
                    </table>
                </div>
                
                <div class="resumen-card">
                    <h3>Detalle de Inversiones</h3>
                    <table>
                        <thead>
                            <tr>
                                <th>Categoría</th>
                                <th>Monto</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${Object.entries(invPorCategoria).map(([cat, monto]) => `
                                <tr>
                                    <td>${cat}</td>
                                    <td class="negativo">-${formatearMoneda(monto)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                
                <div class="footer">
                    <p>Panadería Dulce Herencia - Sistema de Gestión</p>
                </div>
            </body>
            </html>
        `;
        
        const ventana = window.open('', '_blank');
        ventana.document.write(contenidoHTML);
        ventana.document.close();
        ventana.print();
        
        return true;
    } catch (error) {
        console.error('Error generando PDF:', error);
        mostrarNotificacion('Error al generar PDF', 'error');
        return false;
    }
}

// Función para exportar a Excel (CSV)
async function exportarAExcel(tipo = 'ventas') {
    try {
        let datos, nombreArchivo, headers;
        
        if (tipo === 'ventas') {
            datos = await obtenerDatos('ventas');
            nombreArchivo = `ventas_${new Date().toISOString().split('T')[0]}.csv`;
            headers = ['ID', 'Fecha', 'Producto', 'Tipo', 'Cantidad', 'Unidades', 'Precio Unit.', 'Total'];
            
            const filas = datos.map(v => [
                v.id,
                v.fecha,
                v.productoNombre,
                v.tipo,
                v.cantidad,
                v.unidadesVendidas,
                v.precioUnitario,
                v.total
            ]);
            
            exportarACSVConHeaders(headers, filas, nombreArchivo);
            
        } else if (tipo === 'inversiones') {
            datos = await obtenerDatos('inversiones');
            nombreArchivo = `inversiones_${new Date().toISOString().split('T')[0]}.csv`;
            headers = ['ID', 'Fecha', 'Categoría', 'Descripción', 'Monto'];
            
            const filas = datos.map(inv => [
                inv.id,
                inv.fecha,
                inv.categoria,
                inv.descripcion,
                inv.monto
            ]);
            
            exportarACSVConHeaders(headers, filas, nombreArchivo);
        }
        
        mostrarNotificacion(`Archivo exportado: ${nombreArchivo}`, 'exito');
    } catch (error) {
        console.error('Error exportando:', error);
        mostrarNotificacion('Error al exportar', 'error');
    }
}

function exportarACSVConHeaders(headers, filas, nombreArchivo) {
    let csv = headers.join(',') + '\n';
    
    filas.forEach(fila => {
        csv += fila.map(celda => {
            if (typeof celda === 'string' && celda.includes(',')) {
                return `"${celda}"`;
            }
            return celda;
        }).join(',') + '\n';
    });
    
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nombreArchivo;
    a.click();
    window.URL.revokeObjectURL(url);
}

// Exponer funciones
window.generarPDFVentas = generarPDFVentas;
window.generarPDFGanancias = generarPDFGanancias;
window.exportarAExcel = exportarAExcel;

console.log('📄 Módulo de Exportación PDF/Excel cargado');