// script.js - Control principal de la aplicación con Supabase

document.addEventListener('DOMContentLoaded', () => {
    console.log('🍞 Dulce Herencia - Sistema cargado con Supabase');
    
    // Elementos del DOM
    const menuButtons = document.querySelectorAll('.menu-btn');
    const contenido = document.getElementById('contenido-principal');
    const btnSalir = document.getElementById('btn-salir');
    
    // Función para cambiar de módulo
    async function cambiarModulo(moduleId) {
        // Ocultar todos los módulos
        document.querySelectorAll('.module').forEach(mod => {
            mod.classList.remove('active');
        });
        
        // Mostrar el módulo seleccionado
        const moduloActivo = document.getElementById(moduleId);
        if (moduloActivo) {
            moduloActivo.classList.add('active');
            
            // Si es el inicio, actualizar el resumen
            if (moduleId === 'inicio') {
                await actualizarResumenInicio();
            }
        } else {
            // Si no existe, lo creamos dinámicamente
            await cargarModulo(moduleId);
        }
        
        // Actualizar botón activo
        menuButtons.forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.module === moduleId) {
                btn.classList.add('active');
            }
        });
    }
    
    // Función para actualizar el resumen del inicio
    async function actualizarResumenInicio() {
        const resumenDiv = document.getElementById('inicio-resumen');
        if (!resumenDiv) return;
        
        // Mostrar loading
        resumenDiv.innerHTML = `
            <div class="card" style="grid-column: 1/-1; text-align: center;">
                <h3>🔄 Cargando datos desde Supabase...</h3>
            </div>
        `;
        
        const client = window.supabaseClient?.getClient();
        
        if (!client) {
            resumenDiv.innerHTML = `
                <div class="card" style="grid-column: 1/-1; text-align: center;">
                    <h3>❌ Error de conexión</h3>
                    <p>No se pudo conectar con Supabase. Recarga la página.</p>
                </div>
            `;
            return;
        }
        
        try {
            // Obtener datos de Supabase
            const [ventasData, empleadosData, instrumentosData, productosData, materiaPrimaData, metasData, inversionesData] = await Promise.all([
                client.from('ventas').select('*'),
                client.from('empleados').select('*'),
                client.from('instrumentos').select('*'),
                client.from('productos').select('*'),
                client.from('materia_prima').select('*'),
                client.from('metas').select('*').eq('id', 1).single(),
                client.from('inversiones').select('*')
            ]);
            
            const ventas = ventasData.data || [];
            const empleados = empleadosData.data || [];
            const instrumentos = instrumentosData.data || [];
            const productos = productosData.data || [];
            const materiaPrima = materiaPrimaData.data || [];
            const metas = metasData.data || { diaria: 100, quincenal: 1500, mensual: 2500 };
            const inversiones = inversionesData.data || [];
            
            const empleadosActivos = empleados.filter(e => e.activo).length;
            
            const totalVentas = ventas.reduce((sum, v) => sum + (Number(v.total) || 0), 0);
            const totalInstrumentos = instrumentos.reduce((sum, i) => sum + (Number(i.precio) || 0), 0);
            const totalMateriaPrima = materiaPrima.reduce((sum, m) => sum + ((Number(m.cantidad) || 0) * (Number(m.precio_unitario) || 0)), 0);
            const totalInversiones = inversiones.reduce((sum, inv) => sum + (Number(inv.monto) || 0), 0);
            
            // Calcular progreso de metas
            const hoy = new Date().toISOString().split('T')[0];
            const ventasHoy = ventas.filter(v => v.fecha === hoy);
            const totalHoy = ventasHoy.reduce((sum, v) => sum + (Number(v.total) || 0), 0);
            const porcentajeDiario = metas.diaria > 0 ? Math.min(100, (totalHoy / metas.diaria) * 100) : 0;
            
            // Calcular unidades vendidas hoy
            const unidadesHoy = ventasHoy.reduce((sum, v) => sum + (Number(v.unidades_vendidas) || 0), 0);
            
            // Calcular ganancia neta
            const costoPlanillaMensual = empleadosActivos * 15 * 30;
            const gananciaNeta = totalVentas - totalInversiones - costoPlanillaMensual;
            
            // Calcular ventas de la semana
            const fechaSemana = new Date();
            fechaSemana.setDate(fechaSemana.getDate() - 7);
            const ventasSemana = ventas.filter(v => new Date(v.fecha) >= fechaSemana);
            const totalSemana = ventasSemana.reduce((sum, v) => sum + (Number(v.total) || 0), 0);
            
            resumenDiv.innerHTML = `
                <div class="card">
                    <h3>📊 Ventas Hoy</h3>
                    <p style="font-size: 2rem; color: #2E7D32;">${formatearMoneda(totalHoy)}</p>
                    <p>${unidadesHoy} unidades | ${ventasHoy.length} ventas</p>
                </div>
                <div class="card">
                    <h3>💰 Ventas Totales</h3>
                    <p style="font-size: 2rem; color: #1976D2;">${formatearMoneda(totalVentas)}</p>
                    <p>${ventas.length} transacciones</p>
                </div>
                <div class="card">
                    <h3>👥 Empleados</h3>
                    <p style="font-size: 2rem; color: #8B4513;">${empleadosActivos}</p>
                    <p>Activos de ${empleados.length} totales</p>
                </div>
                <div class="card">
                    <h3>🛠️ Inversión en Instrumentos</h3>
                    <p style="font-size: 2rem; color: #D2691E;">${formatearMoneda(totalInstrumentos)}</p>
                    <p>${instrumentos.length} instrumentos</p>
                </div>
                <div class="card">
                    <h3>🥐 Productos</h3>
                    <p style="font-size: 2rem; color: #9C27B0;">${productos.length}</p>
                    <p>En catálogo</p>
                </div>
                <div class="card">
                    <h3>📦 Materia Prima</h3>
                    <p style="font-size: 2rem; color: #C62828;">${formatearMoneda(totalMateriaPrima)}</p>
                    <p>${materiaPrima.length} items</p>
                </div>
                <div class="card">
                    <h3>💸 Total Inversiones</h3>
                    <p style="font-size: 2rem; color: #E65100;">${formatearMoneda(totalInversiones)}</p>
                    <p>${inversiones.length} registros</p>
                </div>
                <div class="card">
                    <h3>📈 Ganancia Neta</h3>
                    <p style="font-size: 2rem; color: ${gananciaNeta >= 0 ? '#2E7D32' : '#C62828'};">${formatearMoneda(gananciaNeta)}</p>
                    <p>Ingresos - Inversiones - Planilla</p>
                </div>
                <div class="card" style="grid-column: span 2;">
                    <h3>🎯 Meta Diaria</h3>
                    <div style="display: flex; align-items: center; gap: 1rem;">
                        <div style="flex: 1;">
                            <div style="font-size: 1.2rem;">${formatearMoneda(totalHoy)} de ${formatearMoneda(metas.diaria)}</div>
                            <div style="width: 100%; height: 20px; background: #f0f0f0; border-radius: 10px; overflow: hidden; margin-top: 0.5rem;">
                                <div style="width: ${porcentajeDiario}%; height: 100%; background: ${porcentajeDiario >= 100 ? '#2E7D32' : '#8B4513'}; transition: width 0.3s;"></div>
                            </div>
                        </div>
                        <div style="font-size: 2rem; font-weight: bold; color: ${porcentajeDiario >= 100 ? '#2E7D32' : '#8B4513'};">
                            ${porcentajeDiario.toFixed(0)}%
                        </div>
                    </div>
                </div>
                <div class="card" style="grid-column: span 2;">
                    <h3>📅 Resumen Semanal</h3>
                    <p style="font-size: 1.5rem; color: #1976D2;">${formatearMoneda(totalSemana)}</p>
                    <p>${ventasSemana.length} ventas en los últimos 7 días</p>
                </div>
            `;
        } catch (error) {
            console.error('Error cargando resumen:', error);
            resumenDiv.innerHTML = `
                <div class="card" style="grid-column: 1/-1; text-align: center;">
                    <h3>❌ Error al cargar datos</h3>
                    <p>${error.message}</p>
                    <button class="btn btn-info" onclick="location.reload()">🔄 Recargar</button>
                </div>
            `;
        }
    }
    
    // Función para cargar módulos dinámicamente
    async function cargarModulo(moduleId) {
        const moduleContainer = document.createElement('div');
        moduleContainer.id = moduleId;
        moduleContainer.className = 'module';
        
        // Mostrar loading mientras carga
        moduleContainer.innerHTML = `
            <div style="text-align: center; padding: 3rem;">
                <h2>Cargando módulo...</h2>
                <p>🔄 Conectando con Supabase...</p>
            </div>
        `;
        contenido.appendChild(moduleContainer);
        
        switch(moduleId) {
            case 'punto-venta':
                if (typeof window.mostrarPuntoVenta === 'function') {
                    moduleContainer.innerHTML = await window.mostrarPuntoVenta();
                } else {
                    moduleContainer.innerHTML = '<h2>Punto de Venta</h2><p>Error cargando módulo</p>';
                }
                break;
                
            case 'historial-ventas':
                if (typeof window.mostrarVentas === 'function') {
                    moduleContainer.innerHTML = await window.mostrarVentas();
                } else {
                    moduleContainer.innerHTML = '<h2>Historial de Ventas</h2><p>Error cargando módulo</p>';
                }
                break;
                
            case 'instrumentos':
                if (typeof window.mostrarInstrumentos === 'function') {
                    moduleContainer.innerHTML = await window.mostrarInstrumentos();
                } else {
                    moduleContainer.innerHTML = '<h2>Módulo de Instrumentos</h2><p>Error cargando módulo</p>';
                }
                break;
                
            case 'empleados':
                if (typeof window.mostrarEmpleados === 'function') {
                    moduleContainer.innerHTML = await window.mostrarEmpleados();
                } else {
                    moduleContainer.innerHTML = '<h2>Módulo de Empleados</h2><p>Error cargando módulo</p>';
                }
                break;
                
            case 'productos':
                if (typeof window.mostrarProductos === 'function') {
                    moduleContainer.innerHTML = window.mostrarProductos();
                } else {
                    moduleContainer.innerHTML = '<h2>Módulo de Productos</h2><p>Error cargando módulo</p>';
                }
                break;
                
            case 'ganancias':
                if (typeof window.mostrarGanancias === 'function') {
                    moduleContainer.innerHTML = await window.mostrarGanancias();
                } else {
                    moduleContainer.innerHTML = '<h2>Módulo de Ganancias</h2><p>Error cargando módulo</p>';
                }
                break;
                
            case 'materia-prima':
                if (typeof window.mostrarMateriaPrima === 'function') {
                    moduleContainer.innerHTML = await window.mostrarMateriaPrima();
                } else {
                    moduleContainer.innerHTML = '<h2>Módulo de Materia Prima</h2><p>Error cargando módulo</p>';
                }
                break;
                
            case 'graficas':
                if (typeof window.mostrarGraficas === 'function') {
                    moduleContainer.innerHTML = window.mostrarGraficas();
                } else {
                    moduleContainer.innerHTML = '<h2>Módulo de Gráficas</h2><p>Error cargando módulo</p>';
                }
                break;
                
            default:
                moduleContainer.innerHTML = '<h2>Módulo no encontrado</h2>';
        }
        
        moduleContainer.classList.add('active');
    }
    
    // Agregar evento a cada botón del menú
    menuButtons.forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const moduleId = btn.dataset.module;
            
            if (moduleId === 'salir') {
                if (confirm('¿Estás seguro de que quieres salir de la aplicación?')) {
                    // Limpiar cualquier dato sensible si es necesario
                    window.close();
                }
                return;
            }
            
            await cambiarModulo(moduleId);
        });
    });
    
    // Inicializar con el módulo inicio
    cambiarModulo('inicio');
});

// Función para formatear moneda
function formatearMoneda(valor) {
    if (isNaN(valor) || valor === null || valor === undefined) return '$0.00';
    return new Intl.NumberFormat('es-ES', { 
        style: 'currency', 
        currency: 'USD' 
    }).format(valor);
}

// Función para formatear fecha
function formatearFecha(fechaStr) {
    if (!fechaStr) return '';
    const opciones = { year: 'numeric', month: '2-digit', day: '2-digit' };
    return new Date(fechaStr).toLocaleDateString('es-ES', opciones);
}

// Función para mostrar notificaciones
function mostrarNotificacion(mensaje, tipo = 'info') {
    // Crear elemento de notificación
    const notificacion = document.createElement('div');
    notificacion.className = `notificacion notificacion-${tipo}`;
    notificacion.textContent = mensaje;
    
    // Estilos para la notificación
    notificacion.style.position = 'fixed';
    notificacion.style.top = '20px';
    notificacion.style.right = '20px';
    notificacion.style.padding = '1rem 2rem';
    notificacion.style.borderRadius = '5px';
    notificacion.style.backgroundColor = tipo === 'error' ? '#C62828' : 
                                         tipo === 'exito' ? '#2E7D32' : '#1976D2';
    notificacion.style.color = 'white';
    notificacion.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
    notificacion.style.zIndex = '1000';
    notificacion.style.minWidth = '250px';
    notificacion.style.textAlign = 'center';
    notificacion.style.fontWeight = 'bold';
    notificacion.style.animation = 'slideIn 0.3s ease-out';
    
    document.body.appendChild(notificacion);
    
    // Eliminar después de 3 segundos
    setTimeout(() => {
        notificacion.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => {
            notificacion.remove();
        }, 300);
    }, 2700);
}

// Función para volver al inicio (usada por los módulos)
function volverAlInicio() {
    const inicioBtn = document.querySelector('[data-module="inicio"]');
    if (inicioBtn) {
        inicioBtn.click();
    }
}

// Función para validar números
function validarNumero(valor, defecto = 0) {
    const num = parseFloat(valor);
    return isNaN(num) ? defecto : num;
}

// Función para exportar datos a CSV
function exportarACSV(datos, nombreArchivo = 'datos.csv') {
    if (!datos || datos.length === 0) {
        mostrarNotificacion('No hay datos para exportar', 'error');
        return;
    }
    
    try {
        // Obtener headers
        const headers = Object.keys(datos[0]).join(',');
        
        // Convertir cada fila a CSV
        const filas = datos.map(obj => {
            return Object.values(obj).map(val => {
                if (typeof val === 'string' && val.includes(',')) {
                    return `"${val}"`;
                }
                return val;
            }).join(',');
        }).join('\n');
        
        const csv = headers + '\n' + filas;
        
        // Crear y descargar archivo
        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = nombreArchivo;
        a.click();
        window.URL.revokeObjectURL(url);
        
        mostrarNotificacion('Archivo exportado correctamente', 'exito');
    } catch (error) {
        console.error('Error exportando CSV:', error);
        mostrarNotificacion('Error al exportar', 'error');
    }
}

// Función para imprimir reporte
function imprimirReporte(titulo, contenido) {
    const ventanaImpresion = window.open('', '_blank');
    ventanaImpresion.document.write(`
        <html>
            <head>
                <title>${titulo} - Dulce Herencia</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; }
                    h1 { color: #8B4513; border-bottom: 2px solid #8B4513; padding-bottom: 10px; }
                    h2 { color: #D2691E; }
                    table { border-collapse: collapse; width: 100%; margin-top: 20px; }
                    th { background: #8B4513; color: white; padding: 10px; text-align: left; }
                    td { border: 1px solid #ddd; padding: 8px; }
                    tr:nth-child(even) { background: #f9f9f9; }
                    .footer { margin-top: 30px; font-size: 0.9rem; color: #666; text-align: center; }
                    .total { font-weight: bold; color: #8B4513; }
                </style>
            </head>
            <body>
                <h1>${titulo}</h1>
                <p><strong>Fecha:</strong> ${new Date().toLocaleDateString('es-ES')}</p>
                <p><strong>Hora:</strong> ${new Date().toLocaleTimeString('es-ES')}</p>
                ${contenido}
                <div class="footer">
                    <p>Panadería Dulce Herencia - Sistema de Gestión</p>
                </div>
            </body>
        </html>
    `);
    ventanaImpresion.document.close();
    ventanaImpresion.print();
}

// Función para sincronizar todos los datos
async function sincronizarTodosLosDatos() {
    mostrarNotificacion('Sincronizando datos con Supabase...', 'info');
    
    try {
        // Intentar sincronizar cada módulo si tiene función de sincronización
        if (window.sincronizarProductos) await window.sincronizarProductos();
        if (window.sincronizarVentas) await window.sincronizarVentas();
        if (window.sincronizarInstrumentos) await window.sincronizarInstrumentos();
        if (window.sincronizarEmpleados) await window.sincronizarEmpleados();
        if (window.sincronizarMateriaPrima) await window.sincronizarMateriaPrima();
        if (window.sincronizarGanancias) await window.sincronizarGanancias();
        
        mostrarNotificacion('✅ Todos los datos sincronizados', 'exito');
    } catch (e) {
        console.error('Error sincronizando:', e);
        mostrarNotificacion('Error al sincronizar datos', 'error');
    }
}

// Animaciones CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

// Hacer funciones globales
window.volverAlInicio = volverAlInicio;
window.formatearMoneda = formatearMoneda;
window.formatearFecha = formatearFecha;
window.mostrarNotificacion = mostrarNotificacion;
window.validarNumero = validarNumero;
window.exportarACSV = exportarACSV;
window.imprimirReporte = imprimirReporte;
window.sincronizarTodosLosDatos = sincronizarTodosLosDatos;

console.log('✅ Script principal cargado con todas las funciones globales');