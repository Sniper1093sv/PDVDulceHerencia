// modules/graficas.js - Visualización de datos con gráficas

// Función para generar gráfica de ventas por período
function generarGraficaVentas(periodo = 'semana') {
    const ventas = JSON.parse(localStorage.getItem('ventas') || '[]');
    
    if (ventas.length === 0) {
        return '<p style="text-align: center; padding: 2rem;">No hay datos de ventas para mostrar</p>';
    }
    
    let fechas = [];
    let datos = [];
    
    switch(periodo) {
        case 'dia':
            // Últimas 24 horas (por horas)
            const hoy = new Date().toISOString().split('T')[0];
            const ventasHoy = ventas.filter(v => v.fecha === hoy);
            const ventasPorHora = {};
            
            for (let i = 0; i < 24; i++) {
                ventasPorHora[`${i}:00`] = 0;
            }
            
            ventasHoy.forEach(v => {
                const hora = new Date(v.fecha + 'T12:00:00').getHours();
                ventasPorHora[`${hora}:00`] += v.total;
            });
            
            fechas = Object.keys(ventasPorHora);
            datos = Object.values(ventasPorHora);
            break;
            
        case 'semana':
            // Últimos 7 días
            for (let i = 6; i >= 0; i--) {
                const fecha = new Date();
                fecha.setDate(fecha.getDate() - i);
                const fechaStr = fecha.toISOString().split('T')[0];
                const dia = fecha.toLocaleDateString('es-ES', { weekday: 'short' });
                
                const total = ventas
                    .filter(v => v.fecha === fechaStr)
                    .reduce((sum, v) => sum + v.total, 0);
                
                fechas.push(dia);
                datos.push(total);
            }
            break;
            
        case 'mes':
            // Últimos 30 días
            for (let i = 29; i >= 0; i--) {
                const fecha = new Date();
                fecha.setDate(fecha.getDate() - i);
                const fechaStr = fecha.toISOString().split('T')[0];
                
                const total = ventas
                    .filter(v => v.fecha === fechaStr)
                    .reduce((sum, v) => sum + v.total, 0);
                
                if (i % 5 === 0) { // Mostrar cada 5 días para no saturar
                    fechas.push(fecha.getDate() + '/' + (fecha.getMonth() + 1));
                } else {
                    fechas.push('');
                }
                datos.push(total);
            }
            break;
            
        case 'trimestre':
        case 'semestre':
        case 'año':
            // Por meses
            const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
            const ventasPorMes = {};
            
            meses.forEach(m => ventasPorMes[m] = 0);
            
            ventas.forEach(v => {
                const fecha = new Date(v.fecha);
                const mes = meses[fecha.getMonth()];
                ventasPorMes[mes] += v.total;
            });
            
            fechas = meses;
            datos = meses.map(m => ventasPorMes[m]);
            break;
    }
    
    // Encontrar el valor máximo para escalar
    const maxValor = Math.max(...datos, 1);
    
    // Generar gráfica de barras horizontales
    let grafica = '';
    for (let i = 0; i < fechas.length; i++) {
        if (fechas[i] === '') {
            grafica += `<div style="height: 20px;"></div>`;
            continue;
        }
        
        const altura = Math.max(1, Math.round((datos[i] / maxValor) * 30));
        const barra = '█'.repeat(altura);
        const color = datos[i] > 0 ? '#8B4513' : '#ccc';
        
        grafica += `
            <div style="display: flex; align-items: center; margin-bottom: 8px;">
                <span style="width: 50px; font-size: 12px;">${fechas[i]}</span>
                <span style="color: ${color}; font-size: 16px;">${barra}</span>
                <span style="margin-left: 10px; font-size: 12px;">${formatearMoneda(datos[i])}</span>
            </div>
        `;
    }
    
    return grafica;
}

// Función para generar gráfica de productos más vendidos
function generarGraficaProductos() {
    const ventas = JSON.parse(localStorage.getItem('ventas') || '[]');
    
    if (ventas.length === 0) {
        return '<p style="text-align: center; padding: 2rem;">No hay datos de ventas</p>';
    }
    
    // Agrupar por producto
    const productos = {};
    ventas.forEach(v => {
        if (!productos[v.productoNombre]) {
            productos[v.productoNombre] = {
                cantidad: 0,
                total: 0
            };
        }
        productos[v.productoNombre].cantidad += v.cantidad;
        productos[v.productoNombre].total += v.total;
    });
    
    // Ordenar y tomar top 5
    const topProductos = Object.entries(productos)
        .map(([nombre, datos]) => ({ nombre, ...datos }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 5);
    
    if (topProductos.length === 0) {
        return '<p>No hay datos suficientes</p>';
    }
    
    const maxTotal = Math.max(...topProductos.map(p => p.total), 1);
    
    let grafica = '';
    topProductos.forEach(p => {
        const ancho = Math.max(1, Math.round((p.total / maxTotal) * 50));
        const barra = '█'.repeat(ancho);
        
        grafica += `
            <div style="margin-bottom: 15px;">
                <div style="font-weight: bold;">${p.nombre}</div>
                <div style="display: flex; align-items: center;">
                    <span style="color: #2E7D32; font-size: 16px;">${barra}</span>
                    <span style="margin-left: 10px;">${formatearMoneda(p.total)} (${p.cantidad} ventas)</span>
                </div>
            </div>
        `;
    });
    
    return grafica;
}

// Función para generar gráfica de gastos vs ingresos
function generarGraficaGastos() {
    const ventas = JSON.parse(localStorage.getItem('ventas') || '[]');
    const instrumentos = JSON.parse(localStorage.getItem('instrumentos') || '[]');
    const materiaPrima = JSON.parse(localStorage.getItem('materiaPrima') || '[]');
    
    const totalVentas = ventas.reduce((sum, v) => sum + v.total, 0);
    const totalInstrumentos = instrumentos.reduce((sum, i) => sum + i.precio, 0);
    const totalMateriaPrima = materiaPrima.reduce((sum, m) => sum + (m.cantidad * m.precioUnitario), 0);
    
    // Calcular planilla de empleados
    const empleados = JSON.parse(localStorage.getItem('empleados') || '[]');
    const empleadosActivos = empleados.filter(e => e.activo).length;
    const totalPlanilla = empleadosActivos * 15 * 30; // Mensual
    
    const totalGastos = totalInstrumentos + totalMateriaPrima + totalPlanilla;
    const gananciaNeta = totalVentas - totalGastos;
    
    // Normalizar para gráfica
    const maxValor = Math.max(totalVentas, totalGastos, 1);
    
    const barraVentas = Math.max(1, Math.round((totalVentas / maxValor) * 40));
    const barraGastos = Math.max(1, Math.round((totalGastos / maxValor) * 40));
    const barraGanancia = gananciaNeta > 0 ? Math.max(1, Math.round((gananciaNeta / maxValor) * 40)) : 1;
    
    return `
        <div style="margin-bottom: 20px;">
            <div style="font-weight: bold;">💰 Ingresos: ${formatearMoneda(totalVentas)}</div>
            <div style="color: #2E7D32; font-size: 20px;">${'█'.repeat(barraVentas)}</div>
        </div>
        <div style="margin-bottom: 20px;">
            <div style="font-weight: bold;">💸 Gastos: ${formatearMoneda(totalGastos)}</div>
            <div style="color: #C62828; font-size: 20px;">${'█'.repeat(barraGastos)}</div>
        </div>
        <div style="margin-bottom: 20px;">
            <div style="font-weight: bold;">📈 Ganancia Neta: ${formatearMoneda(gananciaNeta)}</div>
            <div style="color: ${gananciaNeta > 0 ? '#2E7D32' : '#C62828'}; font-size: 20px;">${'█'.repeat(barraGanancia)}</div>
        </div>
        <div style="margin-top: 20px; padding: 10px; background: ${gananciaNeta > 0 ? '#e8f5e8' : '#ffebee'}; border-radius: 5px;">
            <strong>Rentabilidad:</strong> ${((gananciaNeta / totalVentas) * 100).toFixed(1)}%
        </div>
    `;
}

// Función principal para mostrar el módulo de gráficas
function mostrarGraficas() {
    return `
        <h2>📊 Análisis Gráfico del Negocio</h2>
        
        <!-- Selector de período -->
        <div style="margin-bottom: 2rem; display: flex; gap: 1rem; flex-wrap: wrap;">
            <button class="btn btn-info" onclick="actualizarGrafica('dia')">Día</button>
            <button class="btn btn-info" onclick="actualizarGrafica('semana')">Semana</button>
            <button class="btn btn-info" onclick="actualizarGrafica('mes')">Mes</button>
            <button class="btn btn-info" onclick="actualizarGrafica('trimestre')">Trimestre</button>
            <button class="btn btn-info" onclick="actualizarGrafica('semestre')">Semestre</button>
            <button class="btn btn-info" onclick="actualizarGrafica('año')">Año</button>
        </div>
        
        <!-- Gráfica de ventas -->
        <div style="background: white; padding: 2rem; border-radius: 10px; margin-bottom: 2rem;">
            <h3>📈 Tendencia de Ventas</h3>
            <div id="grafica-ventas" style="font-family: monospace; font-size: 14px; min-height: 200px;">
                ${generarGraficaVentas('semana')}
            </div>
        </div>
        
        <!-- Gráfica de productos más vendidos -->
        <div style="background: white; padding: 2rem; border-radius: 10px; margin-bottom: 2rem;">
            <h3>🥐 Top 5 Productos Más Vendidos</h3>
            <div id="grafica-productos" style="font-family: monospace; font-size: 14px;">
                ${generarGraficaProductos()}
            </div>
        </div>
        
        <!-- Gráfica de ingresos vs gastos -->
        <div style="background: white; padding: 2rem; border-radius: 10px; margin-bottom: 2rem;">
            <h3>💰 Ingresos vs Gastos</h3>
            <div id="grafica-gastos" style="font-family: monospace; font-size: 14px;">
                ${generarGraficaGastos()}
            </div>
        </div>
        
        <!-- Estadísticas rápidas -->
        <div style="background: white; padding: 2rem; border-radius: 10px; margin-bottom: 2rem;">
            <h3>📊 Estadísticas Rápidas</h3>
            ${generarEstadisticasRapidas()}
        </div>
        
        <button class="btn" style="margin-top: 1rem;" onclick="volverAlInicio()">← Volver al Inicio</button>
    `;
}

function generarEstadisticasRapidas() {
    const ventas = JSON.parse(localStorage.getItem('ventas') || '[]');
    const productos = JSON.parse(localStorage.getItem('productos') || '[]');
    const empleados = JSON.parse(localStorage.getItem('empleados') || '[]');
    
    const totalVentas = ventas.reduce((sum, v) => sum + v.total, 0);
    const promedioVenta = ventas.length > 0 ? totalVentas / ventas.length : 0;
    
    // Calcular día con más ventas
    const ventasPorDia = {};
    ventas.forEach(v => {
        ventasPorDia[v.fecha] = (ventasPorDia[v.fecha] || 0) + v.total;
    });
    
    let mejorDia = { fecha: '', total: 0 };
    Object.entries(ventasPorDia).forEach(([fecha, total]) => {
        if (total > mejorDia.total) {
            mejorDia = { fecha, total };
        }
    });
    
    return `
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem;">
            <div>
                <strong>Total de ventas:</strong> ${formatearMoneda(totalVentas)}
            </div>
            <div>
                <strong>Número de ventas:</strong> ${ventas.length}
            </div>
            <div>
                <strong>Promedio por venta:</strong> ${formatearMoneda(promedioVenta)}
            </div>
            <div>
                <strong>Productos en catálogo:</strong> ${productos.length}
            </div>
            <div>
                <strong>Empleados activos:</strong> ${empleados.filter(e => e.activo).length}
            </div>
            <div>
                <strong>Mejor día de ventas:</strong><br>
                ${mejorDia.fecha ? new Date(mejorDia.fecha).toLocaleDateString('es-ES') + ' - ' + formatearMoneda(mejorDia.total) : 'Sin datos'}
            </div>
        </div>
    `;
}

function actualizarGrafica(periodo) {
    const graficaDiv = document.getElementById('grafica-ventas');
    if (graficaDiv) {
        graficaDiv.innerHTML = generarGraficaVentas(periodo);
    }
}

// Exponer funciones
window.mostrarGraficas = mostrarGraficas;
window.actualizarGrafica = actualizarGrafica;

console.log('📊 Módulo de Gráficas cargado');