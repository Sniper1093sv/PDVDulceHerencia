// script.js - Control principal de la aplicación

document.addEventListener('DOMContentLoaded', () => {
    console.log('🍞 Dulce Herencia - Sistema cargado');
    
    // Elementos del DOM
    const menuButtons = document.querySelectorAll('.menu-btn');
    const contenido = document.getElementById('contenido-principal');
    const btnSalir = document.getElementById('btn-salir');
    
    // Función para cambiar de módulo
    function cambiarModulo(moduleId) {
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
                actualizarResumenInicio();
            }
        } else {
            // Si no existe, lo creamos dinámicamente
            cargarModulo(moduleId);
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
    function actualizarResumenInicio() {
        const resumenDiv = document.getElementById('inicio-resumen');
        if (!resumenDiv) return;
        
        // Obtener datos de los diferentes módulos
        const ventas = JSON.parse(localStorage.getItem('ventas') || '[]');
        const empleados = JSON.parse(localStorage.getItem('empleados') || '[]');
        const instrumentos = JSON.parse(localStorage.getItem('instrumentos') || '[]');
        const productos = JSON.parse(localStorage.getItem('productos') || '[]');
        const materiaPrima = JSON.parse(localStorage.getItem('materiaPrima') || '[]');
        const metas = JSON.parse(localStorage.getItem('metas') || '{"diaria":100,"quincenal":1500,"mensual":2500}');
        
        const empleadosActivos = empleados.filter(e => e.activo).length;
        const totalVentas = ventas.reduce((sum, v) => sum + (Number(v.total) || 0), 0);
        const totalInstrumentos = instrumentos.reduce((sum, i) => sum + (Number(i.precio) || 0), 0);
        const totalMateriaPrima = materiaPrima.reduce((sum, m) => sum + (m.cantidad * m.precioUnitario), 0);
        
        // Calcular progreso de metas
        const hoy = new Date().toISOString().split('T')[0];
        const totalHoy = ventas.filter(v => v.fecha === hoy).reduce((sum, v) => sum + (Number(v.total) || 0), 0);
        const porcentajeDiario = Math.min(100, (totalHoy / metas.diaria) * 100);
        
        // Calcular unidades vendidas hoy
        const unidadesHoy = ventas.filter(v => v.fecha === hoy).reduce((sum, v) => sum + (Number(v.unidadesVendidas) || 0), 0);
        
        resumenDiv.innerHTML = `
            <div class="card">
                <h3>📊 Ventas Hoy</h3>
                <p style="font-size: 2rem; color: #2E7D32;">${formatearMoneda(totalHoy)}</p>
                <p>${unidadesHoy} unidades | ${ventas.filter(v => v.fecha === hoy).length} ventas</p>
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
            <div class="card" style="grid-column: span 2;">
                <h3>🎯 Meta Diaria</h3>
                <div style="display: flex; align-items: center; gap: 1rem;">
                    <div style="flex: 1;">
                        <div style="font-size: 1.2rem;">${formatearMoneda(totalHoy)} de ${formatearMoneda(metas.diaria)}</div>
                        <div style="width: 100%; height: 20px; background: #f0f0f0; border-radius: 10px; overflow: hidden; margin-top: 0.5rem;">
                            <div style="width: ${porcentajeDiario}%; height: 100%; background: ${porcentajeDiario >= 100 ? '#2E7D32' : '#8B4513'}; transition: width 0.3s;"></div>
                        </div>
                    </div>
                    <div style="font-size: 2rem; font-weight: bold; color: ${porcentajeDiario >= 100 ? '#2E7D32' : '#8B4513'};">${porcentajeDiario.toFixed(0)}%</div>
                </div>
            </div>
        `;
    }
    
    // Función para cargar módulos dinámicamente
    function cargarModulo(moduleId) {
        const moduleContainer = document.createElement('div');
        moduleContainer.id = moduleId;
        moduleContainer.className = 'module';
        
        switch(moduleId) {
            case 'punto-venta':
                if (typeof window.mostrarPuntoVenta === 'function') {
                    moduleContainer.innerHTML = window.mostrarPuntoVenta();
                } else {
                    moduleContainer.innerHTML = '<h2>Punto de Venta</h2><p>Cargando...</p>';
                }
                break;
                
            case 'historial-ventas':
                if (typeof window.mostrarVentas === 'function') {
                    moduleContainer.innerHTML = window.mostrarVentas();
                } else {
                    moduleContainer.innerHTML = '<h2>Historial de Ventas</h2><p>Cargando...</p>';
                }
                break;
                
            case 'instrumentos':
                if (typeof window.mostrarInstrumentos === 'function') {
                    moduleContainer.innerHTML = window.mostrarInstrumentos();
                } else {
                    moduleContainer.innerHTML = '<h2>Módulo de Instrumentos</h2><p>Cargando...</p>';
                }
                break;
                
            case 'empleados':
                if (typeof window.mostrarEmpleados === 'function') {
                    moduleContainer.innerHTML = window.mostrarEmpleados();
                } else {
                    moduleContainer.innerHTML = '<h2>Módulo de Empleados</h2><p>Cargando módulo...</p>';
                }
                break;
                
            case 'productos':
                if (typeof window.mostrarProductos === 'function') {
                    moduleContainer.innerHTML = window.mostrarProductos();
                } else {
                    moduleContainer.innerHTML = '<h2>Módulo de Productos</h2><p>Cargando...</p>';
                }
                break;
                
            case 'ganancias':
                if (typeof window.mostrarGanancias === 'function') {
                    moduleContainer.innerHTML = window.mostrarGanancias();
                } else {
                    moduleContainer.innerHTML = '<h2>Módulo de Ganancias</h2><p>Cargando...</p>';
                }
                break;
                
            case 'materia-prima':
                if (typeof window.mostrarMateriaPrima === 'function') {
                    moduleContainer.innerHTML = window.mostrarMateriaPrima();
                } else {
                    moduleContainer.innerHTML = '<h2>Módulo de Materia Prima</h2><p>Cargando...</p>';
                }
                break;
                
            case 'graficas':
                if (typeof window.mostrarGraficas === 'function') {
                    moduleContainer.innerHTML = window.mostrarGraficas();
                } else {
                    moduleContainer.innerHTML = '<h2>Módulo de Gráficas</h2><p>Cargando...</p>';
                }
                break;
                
            default:
                moduleContainer.innerHTML = '<h2>Módulo no encontrado</h2>';
        }
        
        contenido.appendChild(moduleContainer);
        moduleContainer.classList.add('active');
    }
    
    // Agregar evento a cada botón del menú
    menuButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const moduleId = btn.dataset.module;
            
            if (moduleId === 'salir') {
                // Diálogo de confirmación para salir
                if (confirm('¿Estás seguro de que quieres salir de la aplicación?')) {
                    window.close();
                }
                return;
            }
            
            cambiarModulo(moduleId);
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
    document.querySelector('[data-module="inicio"]').click();
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

// Función para formatear número con decimales
function formatearNumero(valor, decimales = 2) {
    return Number(valor).toFixed(decimales);
}

// Función para calcular porcentaje
function calcularPorcentaje(valor, total) {
    if (total === 0) return 0;
    return (valor / total) * 100;
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
window.formatearNumero = formatearNumero;
window.calcularPorcentaje = calcularPorcentaje;

console.log('✅ Script principal cargado con todas las funciones globales');