// modules/graficas.js - Visualización de datos con gráficas usando Supabase

let ventasGraficas = [];
let productosGraficas = [];
let instrumentosGraficas = [];
let materiaPrimaGraficas = [];
let empleadosGraficas = [];

// Cargar todos los datos necesarios desde Supabase
async function cargarDatosGraficas() {
    const client = window.supabaseClient?.getClient();
    
    if (!client) {
        console.error('❌ Cliente Supabase no disponible');
        return false;
    }
    
    try {
        // Cargar ventas
        const { data: ventasData } = await client
            .from('ventas')
            .select('*')
            .order('fecha', { ascending: false });
        
        ventasGraficas = (ventasData || []).map(v => ({
            ...v,
            total: Number(v.total) || 0,
            unidadesVendidas: Number(v.unidades_vendidas) || 0,
            cantidad: Number(v.cantidad) || 0,
            productoId: v.producto_id,
            productoNombre: v.producto_nombre
        }));
        
        // Cargar productos
        const { data: productosData } = await client
            .from('productos')
            .select('*');
        
        productosGraficas = productosData || [];
        
        // Cargar instrumentos
        const { data: instrumentosData } = await client
            .from('instrumentos')
            .select('*');
        
        instrumentosGraficas = (instrumentosData || []).map(i => ({
            ...i,
            precio: Number(i.precio) || 0
        }));
        
        // Cargar materia prima
        const { data: materiaData } = await client
            .from('materia_prima')
            .select('*');
        
        materiaPrimaGraficas = (materiaData || []).map(m => ({
            ...m,
            cantidad: Number(m.cantidad) || 0,
            precioUnitario: Number(m.precio_unitario) || 0
        }));
        
        // Cargar empleados
        const { data: empleadosData } = await client
            .from('empleados')
            .select('*');
        
        empleadosGraficas = empleadosData || [];
        
        console.log('✅ Datos para gráficas cargados desde Supabase');
        return true;
    } catch (e) {
        console.error('Error cargando datos para gráficas:', e);
        return false;
    }
}

// Función para generar gráfica de ventas por período
function generarGraficaVentas(periodo = 'semana') {
    if (ventasGraficas.length === 0) {
        return '<p style="text-align: center; padding: 2rem; color: #666;">No hay datos de ventas para mostrar</p>';
    }
    
    let fechas = [];
    let datos = [];
    
    switch(periodo) {
        case 'dia':
            // Ventas de hoy por hora (simulado ya que no guardamos hora)
            const hoy = new Date().toISOString().split('T')[0];
            const ventasHoy = ventasGraficas.filter(v => v.fecha === hoy);
            
            if (ventasHoy.length === 0) {
                return '<p style="text-align: center; padding: 2rem; color: #666;">No hay ventas registradas hoy</p>';
            }
            
            // Agrupar por producto para mostrar distribución
            const ventasPorProductoHoy = {};
            ventasHoy.forEach(v => {
                if (!ventasPorProductoHoy[v.productoNombre]) {
                    ventasPorProductoHoy[v.productoNombre] = 0;
                }
                ventasPorProductoHoy[v.productoNombre] += v.total;
            });
            
            fechas = Object.keys(ventasPorProductoHoy);
            datos = Object.values(ventasPorProductoHoy);
            break;
            
        case 'semana':
            // Últimos 7 días
            for (let i = 6; i >= 0; i--) {
                const fecha = new Date();
                fecha.setDate(fecha.getDate() - i);
                const fechaStr = fecha.toISOString().split('T')[0];
                const dia = fecha.toLocaleDateString('es-ES', { weekday: 'short' });
                
                const total = ventasGraficas
                    .filter(v => v.fecha === fechaStr)
                    .reduce((sum, v) => sum + (v.total || 0), 0);
                
                fechas.push(dia);
                datos.push(total);
            }
            break;
            
        case 'mes':
            // Últimos 30 días (agrupados por día)
            const ultimos30Dias = [];
            for (let i = 29; i >= 0; i--) {
                const fecha = new Date();
                fecha.setDate(fecha.getDate() - i);
                const fechaStr = fecha.toISOString().split('T')[0];
                
                const total = ventasGraficas
                    .filter(v => v.fecha === fechaStr)
                    .reduce((sum, v) => sum + (v.total || 0), 0);
                
                if (i % 3 === 0) {
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
            
            ventasGraficas.forEach(v => {
                if (v.fecha) {
                    const fecha = new Date(v.fecha);
                    const mes = meses[fecha.getMonth()];
                    ventasPorMes[mes] += v.total || 0;
                }
            });
            
            fechas = meses;
            datos = meses.map(m => ventasPorMes[m]);
            break;
    }
    
    // Encontrar el valor máximo para escalar
    const maxValor = Math.max(...datos, 1);
    
    // Generar gráfica de barras
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
    
    // Agregar total del período
    const totalPeriodo = datos.reduce((sum, val) => sum + val, 0);
    grafica += `
        <div style="margin-top: 15px; padding-top: 10px; border-top: 1px solid #ddd; text-align: right; font-weight: bold;">
            Total del período: ${formatearMoneda(totalPeriodo)}
        </div>
    `;
    
    return grafica;
}

// Función para generar gráfica de productos más vendidos
function generarGraficaProductos() {
    if (ventasGraficas.length === 0) {
        return '<p style="text-align: center; padding: 2rem; color: #666;">No hay datos de ventas</p>';
    }
    
    // Agrupar por producto
    const productosVentas = {};
    ventasGraficas.forEach(v => {
        if (!productosVentas[v.productoNombre]) {
            productosVentas[v.productoNombre] = {
                cantidad: 0,
                unidades: 0,
                total: 0
            };
        }
        productosVentas[v.productoNombre].cantidad += v.cantidad || 1;
        productosVentas[v.productoNombre].unidades += v.unidadesVendidas || 0;
        productosVentas[v.productoNombre].total += v.total || 0;
    });
    
    // Ordenar y tomar top 5
    const topProductos = Object.entries(productosVentas)
        .map(([nombre, datos]) => ({ nombre, ...datos }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 5);
    
    if (topProductos.length === 0) {
        return '<p style="text-align: center; padding: 2rem;">No hay datos suficientes</p>';
    }
    
    const maxTotal = Math.max(...topProductos.map(p => p.total), 1);
    
    let grafica = '';
    topProductos.forEach((p, index) => {
        const ancho = Math.max(1, Math.round((p.total / maxTotal) * 40));
        const barra = '█'.repeat(ancho);
        
        grafica += `
            <div style="margin-bottom: 15px;">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <span style="font-weight: bold; min-width: 25px;">#${index + 1}</span>
                    <span style="font-weight: bold; min-width: 120px;">${p.nombre}</span>
                    <span style="color: #2E7D32; font-size: 16px; flex: 1;">${barra}</span>
                    <span style="min-width: 100px; text-align: right;">${formatearMoneda(p.total)}</span>
                </div>
                <div style="margin-left: 35px; font-size: 0.8rem; color: #666;">
                    ${p.cantidad} ventas | ${p.unidades} unidades
                </div>
            </div>
        `;
    });
    
    return grafica;
}

// Función para generar gráfica de gastos vs ingresos
function generarGraficaGastos() {
    const totalVentas = ventasGraficas.reduce((sum, v) => sum + (v.total || 0), 0);
    const totalInstrumentos = instrumentosGraficas.reduce((sum, i) => sum + (i.precio || 0), 0);
    const totalMateriaPrima = materiaPrimaGraficas.reduce((sum, m) => sum + ((m.cantidad || 0) * (m.precioUnitario || 0)), 0);
    
    const empleadosActivos = empleadosGraficas.filter(e => e.activo).length;
    const totalPlanilla = empleadosActivos * 15 * 30;
    
    const totalGastos = totalInstrumentos + totalMateriaPrima + totalPlanilla;
    const gananciaNeta = totalVentas - totalGastos;
    
    const maxValor = Math.max(totalVentas, totalGastos, 1);
    
    const barraVentas = Math.max(1, Math.round((totalVentas / maxValor) * 35));
    const barraGastos = Math.max(1, Math.round((totalGastos / maxValor) * 35));
    const barraGanancia = gananciaNeta > 0 ? Math.max(1, Math.round((gananciaNeta / maxValor) * 35)) : 1;
    
    return `
        <div style="margin-bottom: 20px;">
            <div style="display: flex; align-items: center; gap: 10px;">
                <span style="font-weight: bold; min-width: 120px;">💰 Ingresos:</span>
                <span style="color: #2E7D32; font-size: 20px;">${'█'.repeat(barraVentas)}</span>
                <span style="font-weight: bold; color: #2E7D32;">${formatearMoneda(totalVentas)}</span>
            </div>
        </div>
        <div style="margin-bottom: 20px;">
            <div style="display: flex; align-items: center; gap: 10px;">
                <span style="font-weight: bold; min-width: 120px;">💸 Gastos:</span>
                <span style="color: #C62828; font-size: 20px;">${'█'.repeat(barraGastos)}</span>
                <span style="font-weight: bold; color: #C62828;">${formatearMoneda(totalGastos)}</span>
            </div>
            <div style="margin-left: 130px; font-size: 0.8rem; color: #666;">
                Instrumentos: ${formatearMoneda(totalInstrumentos)} | 
                Materia Prima: ${formatearMoneda(totalMateriaPrima)} | 
                Planilla: ${formatearMoneda(totalPlanilla)}
            </div>
        </div>
        <div style="margin-bottom: 20px;">
            <div style="display: flex; align-items: center; gap: 10px;">
                <span style="font-weight: bold; min-width: 120px;">📈 Ganancia Neta:</span>
                <span style="color: ${gananciaNeta >= 0 ? '#2E7D32' : '#C62828'}; font-size: 20px;">${'█'.repeat(barraGanancia)}</span>
                <span style="font-weight: bold; color: ${gananciaNeta >= 0 ? '#2E7D32' : '#C62828'};">${formatearMoneda(gananciaNeta)}</span>
            </div>
        </div>
        <div style="margin-top: 20px; padding: 15px; background: ${gananciaNeta >= 0 ? '#e8f5e8' : '#ffebee'}; border-radius: 8px;">
            <strong>Rentabilidad:</strong> ${totalVentas > 0 ? ((gananciaNeta / totalVentas) * 100).toFixed(1) : 0}% 
            <span style="color: #666; margin-left: 15px;">
                Margen de ganancia sobre ventas totales
            </span>
        </div>
    `;
}

// Función para generar estadísticas rápidas
function generarEstadisticasRapidas() {
    const totalVentas = ventasGraficas.reduce((sum, v) => sum + (v.total || 0), 0);
    const promedioVenta = ventasGraficas.length > 0 ? totalVentas / ventasGraficas.length : 0;
    const totalUnidades = ventasGraficas.reduce((sum, v) => sum + (v.unidadesVendidas || 0), 0);
    
    // Calcular día con más ventas
    const ventasPorDia = {};
    ventasGraficas.forEach(v => {
        if (v.fecha) {
            ventasPorDia[v.fecha] = (ventasPorDia[v.fecha] || 0) + (v.total || 0);
        }
    });
    
    let mejorDia = { fecha: '', total: 0 };
    Object.entries(ventasPorDia).forEach(([fecha, total]) => {
        if (total > mejorDia.total) {
            mejorDia = { fecha, total };
        }
    });
    
    // Calcular ventas de hoy
    const hoy = new Date().toISOString().split('T')[0];
    const ventasHoy = ventasGraficas.filter(v => v.fecha === hoy);
    const totalHoy = ventasHoy.reduce((sum, v) => sum + (v.total || 0), 0);
    
    // Calcular ventas de ayer
    const ayer = new Date();
    ayer.setDate(ayer.getDate() - 1);
    const ayerStr = ayer.toISOString().split('T')[0];
    const ventasAyer = ventasGraficas.filter(v => v.fecha === ayerStr);
    const totalAyer = ventasAyer.reduce((sum, v) => sum + (v.total || 0), 0);
    
    // Tendencia vs ayer
    const tendencia = totalAyer > 0 ? ((totalHoy - totalAyer) / totalAyer) * 100 : 0;
    
    return `
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.5rem;">
            <div style="background: #f5f5f5; padding: 1rem; border-radius: 8px;">
                <strong>📊 Total de ventas:</strong>
                <p style="font-size: 1.5rem; margin: 0.5rem 0; color: #2E7D32;">${formatearMoneda(totalVentas)}</p>
            </div>
            <div style="background: #f5f5f5; padding: 1rem; border-radius: 8px;">
                <strong>📦 Número de ventas:</strong>
                <p style="font-size: 1.5rem; margin: 0.5rem 0;">${ventasGraficas.length}</p>
            </div>
            <div style="background: #f5f5f5; padding: 1rem; border-radius: 8px;">
                <strong>💰 Promedio por venta:</strong>
                <p style="font-size: 1.5rem; margin: 0.5rem 0; color: #1976D2;">${formatearMoneda(promedioVenta)}</p>
            </div>
            <div style="background: #f5f5f5; padding: 1rem; border-radius: 8px;">
                <strong>🥐 Unidades vendidas:</strong>
                <p style="font-size: 1.5rem; margin: 0.5rem 0;">${totalUnidades}</p>
            </div>
            <div style="background: #f5f5f5; padding: 1rem; border-radius: 8px;">
                <strong>📦 Productos en catálogo:</strong>
                <p style="font-size: 1.5rem; margin: 0.5rem 0; color: #9C27B0;">${productosGraficas.length}</p>
            </div>
            <div style="background: #f5f5f5; padding: 1rem; border-radius: 8px;">
                <strong>👥 Empleados activos:</strong>
                <p style="font-size: 1.5rem; margin: 0.5rem 0; color: #8B4513;">${empleadosGraficas.filter(e => e.activo).length}</p>
            </div>
            <div style="background: #f5f5f5; padding: 1rem; border-radius: 8px; grid-column: span 2;">
                <strong>🏆 Mejor día de ventas:</strong>
                <p style="font-size: 1.2rem; margin: 0.5rem 0;">
                    ${mejorDia.fecha ? new Date(mejorDia.fecha).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'Sin datos'}
                </p>
                <p style="font-size: 1.5rem; color: #2E7D32;">${formatearMoneda(mejorDia.total)}</p>
            </div>
            <div style="background: #f5f5f5; padding: 1rem; border-radius: 8px; grid-column: span 2;">
                <strong>📈 Tendencia vs ayer:</strong>
                <p style="font-size: 1.5rem; margin: 0.5rem 0; color: ${tendencia >= 0 ? '#2E7D32' : '#C62828'};">
                    ${tendencia >= 0 ? '▲' : '▼'} ${Math.abs(tendencia).toFixed(1)}%
                </p>
                <p>Hoy: ${formatearMoneda(totalHoy)} | Ayer: ${formatearMoneda(totalAyer)}</p>
            </div>
        </div>
    `;
}

// Función para generar distribución de ventas por categoría
function generarDistribucionVentas() {
    if (ventasGraficas.length === 0) {
        return '<p style="text-align: center; padding: 2rem;">No hay datos de ventas</p>';
    }
    
    // Agrupar ventas por tipo de presentación
    const ventasPorTipo = {
        'unidad': { total: 0, cantidad: 0 },
        'bolsa': { total: 0, cantidad: 0 }
    };
    
    ventasGraficas.forEach(v => {
        const tipo = v.tipo || 'unidad';
        if (ventasPorTipo[tipo]) {
            ventasPorTipo[tipo].total += v.total || 0;
            ventasPorTipo[tipo].cantidad += 1;
        }
    });
    
    const totalGeneral = ventasPorTipo.unidad.total + ventasPorTipo.bolsa.total;
    
    if (totalGeneral === 0) {
        return '<p style="text-align: center; padding: 2rem;">No hay datos de ventas</p>';
    }
    
    const porcentajeUnidad = (ventasPorTipo.unidad.total / totalGeneral) * 100;
    const porcentajeBolsa = (ventasPorTipo.bolsa.total / totalGeneral) * 100;
    
    return `
        <div style="margin-bottom: 20px;">
            <div style="margin-bottom: 15px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                    <span>🍞 Ventas por Unidad:</span>
                    <span><strong>${formatearMoneda(ventasPorTipo.unidad.total)}</strong> (${porcentajeUnidad.toFixed(1)}%)</span>
                </div>
                <div style="width: 100%; height: 25px; background: #f0f0f0; border-radius: 5px; overflow: hidden;">
                    <div style="width: ${porcentajeUnidad}%; height: 100%; background: #4CAF50;"></div>
                </div>
                <p style="margin-top: 5px; font-size: 0.9rem; color: #666;">${ventasPorTipo.unidad.cantidad} ventas</p>
            </div>
            
            <div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                    <span>📦 Ventas por Bolsa:</span>
                    <span><strong>${formatearMoneda(ventasPorTipo.bolsa.total)}</strong> (${porcentajeBolsa.toFixed(1)}%)</span>
                </div>
                <div style="width: 100%; height: 25px; background: #f0f0f0; border-radius: 5px; overflow: hidden;">
                    <div style="width: ${porcentajeBolsa}%; height: 100%; background: #2196F3;"></div>
                </div>
                <p style="margin-top: 5px; font-size: 0.9rem; color: #666;">${ventasPorTipo.bolsa.cantidad} ventas</p>
            </div>
        </div>
        
        <div style="margin-top: 20px; padding: 15px; background: #f5f5f5; border-radius: 8px;">
            <strong>📊 Total General:</strong> ${formatearMoneda(totalGeneral)}
            <span style="margin-left: 20px;">
                <strong>Ventas totales:</strong> ${ventasGraficas.length}
            </span>
        </div>
    `;
}

// Función principal para mostrar el módulo de gráficas
async function mostrarGraficas() {
    // Mostrar loading
    const tempHtml = `
        <h2>📊 Análisis Gráfico del Negocio</h2>
        <div style="text-align: center; padding: 3rem;">
            <p style="font-size: 1.2rem;">🔄 Cargando datos desde Supabase...</p>
        </div>
    `;
    
    // Cargar datos
    await cargarDatosGraficas();
    
    return `
        <h2>📊 Análisis Gráfico del Negocio</h2>
        
        <!-- Selector de período -->
        <div style="margin-bottom: 2rem; display: flex; gap: 0.5rem; flex-wrap: wrap;">
            <button class="btn btn-info" onclick="actualizarGrafica('dia')">📅 Día</button>
            <button class="btn btn-info" onclick="actualizarGrafica('semana')">📊 Semana</button>
            <button class="btn btn-info" onclick="actualizarGrafica('mes')">📈 Mes</button>
            <button class="btn btn-info" onclick="actualizarGrafica('trimestre')">📉 Trimestre</button>
            <button class="btn btn-info" onclick="actualizarGrafica('semestre')">📋 Semestre</button>
            <button class="btn btn-info" onclick="actualizarGrafica('año')">🗓️ Año</button>
            <button class="btn btn-info" onclick="sincronizarGraficas()">🔄 Sincronizar</button>
        </div>
        
        <!-- Gráfica de ventas -->
        <div style="background: white; padding: 2rem; border-radius: 10px; margin-bottom: 2rem; box-shadow: var(--sombra);">
            <h3>📈 Tendencia de Ventas</h3>
            <div id="grafica-ventas" style="font-family: monospace; font-size: 14px; min-height: 200px;">
                ${generarGraficaVentas('semana')}
            </div>
        </div>
        
        <!-- Dos columnas -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-bottom: 2rem;">
            
            <!-- Productos más vendidos -->
            <div style="background: white; padding: 2rem; border-radius: 10px; box-shadow: var(--sombra);">
                <h3>🥐 Top 5 Productos Más Vendidos</h3>
                <div id="grafica-productos" style="font-family: monospace; font-size: 14px;">
                    ${generarGraficaProductos()}
                </div>
            </div>
            
            <!-- Distribución de ventas -->
            <div style="background: white; padding: 2rem; border-radius: 10px; box-shadow: var(--sombra);">
                <h3>📊 Distribución de Ventas</h3>
                <div id="grafica-distribucion">
                    ${generarDistribucionVentas()}
                </div>
            </div>
        </div>
        
        <!-- Ingresos vs Gastos -->
        <div style="background: white; padding: 2rem; border-radius: 10px; margin-bottom: 2rem; box-shadow: var(--sombra);">
            <h3>💰 Ingresos vs Gastos</h3>
            <div id="grafica-gastos" style="font-family: monospace; font-size: 14px;">
                ${generarGraficaGastos()}
            </div>
        </div>
        
        <!-- Estadísticas rápidas -->
        <div style="background: white; padding: 2rem; border-radius: 10px; margin-bottom: 2rem; box-shadow: var(--sombra);">
            <h3>📊 Estadísticas Generales</h3>
            ${generarEstadisticasRapidas()}
        </div>
        
        <button class="btn" style="margin-top: 1rem;" onclick="volverAlInicio()">← Volver al Inicio</button>
    `;
}

// Función para actualizar la gráfica según el período seleccionado
async function actualizarGrafica(periodo) {
    const graficaDiv = document.getElementById('grafica-ventas');
    if (graficaDiv) {
        // Mostrar loading
        graficaDiv.innerHTML = '<p style="text-align: center; padding: 2rem;">🔄 Cargando datos...</p>';
        
        // Recargar datos frescos
        await cargarDatosGraficas();
        
        // Actualizar gráfica
        graficaDiv.innerHTML = generarGraficaVentas(periodo);
        
        // Actualizar título según período
        const titulos = {
            'dia': 'Ventas de Hoy',
            'semana': 'Últimos 7 Días',
            'mes': 'Últimos 30 Días',
            'trimestre': 'Último Trimestre',
            'semestre': 'Último Semestre',
            'año': 'Último Año'
        };
        
        const h3 = graficaDiv.closest('div')?.querySelector('h3');
        if (h3) {
            h3.textContent = `📈 ${titulos[periodo] || 'Tendencia de Ventas'}`;
        }
    }
}

// Función para sincronizar datos manualmente
async function sincronizarGraficas() {
    mostrarNotificacion('Sincronizando datos...', 'info');
    
    const success = await cargarDatosGraficas();
    
    if (success) {
        // Actualizar todas las gráficas
        const graficaVentas = document.getElementById('grafica-ventas');
        const graficaProductos = document.getElementById('grafica-productos');
        const graficaGastos = document.getElementById('grafica-gastos');
        const graficaDistribucion = document.getElementById('grafica-distribucion');
        
        if (graficaVentas) graficaVentas.innerHTML = generarGraficaVentas('semana');
        if (graficaProductos) graficaProductos.innerHTML = generarGraficaProductos();
        if (graficaGastos) graficaGastos.innerHTML = generarGraficaGastos();
        if (graficaDistribucion) graficaDistribucion.innerHTML = generarDistribucionVentas();
        
        // Actualizar estadísticas
        const moduloGraficas = document.getElementById('graficas');
        if (moduloGraficas && moduloGraficas.classList.contains('active')) {
            moduloGraficas.innerHTML = await mostrarGraficas();
        }
        
        mostrarNotificacion('✅ Datos sincronizados correctamente', 'exito');
    } else {
        mostrarNotificacion('Error al sincronizar datos', 'error');
    }
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
        await cargarDatosGraficas();
        console.log('✅ Módulo de Gráficas inicializado con Supabase');
    } else {
        console.error('❌ No se pudo conectar con Supabase');
    }
})();

// Exponer funciones
window.mostrarGraficas = mostrarGraficas;
window.actualizarGrafica = actualizarGrafica;
window.sincronizarGraficas = sincronizarGraficas;

console.log('📊 Módulo de Gráficas (Supabase) cargado correctamente');