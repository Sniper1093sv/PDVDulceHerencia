// modules/instrumentos.js - Módulo de gestión de instrumentos con Supabase

let instrumentos = [];

// Cargar instrumentos desde Supabase
async function cargarInstrumentos() {
    const client = window.supabaseClient?.getClient();
    
    if (!client) {
        console.error('❌ Cliente Supabase no disponible');
        instrumentos = [];
        return;
    }
    
    try {
        const { data, error } = await client
            .from('instrumentos')
            .select('*')
            .order('id', { ascending: false });
        
        if (error) {
            console.error('Error cargando instrumentos:', error);
            instrumentos = [];
            return;
        }
        
        instrumentos = (data || []).map(inst => ({
            ...inst,
            precio: Number(inst.precio) || 0
        }));
        
        console.log(`✅ ${instrumentos.length} instrumentos cargados desde Supabase`);
    } catch (e) {
        console.error('Error cargando instrumentos:', e);
        instrumentos = [];
    }
}

// Función para calcular el total invertido
function calcularTotalInvertido() {
    return instrumentos.reduce((total, inst) => total + (Number(inst.precio) || 0), 0);
}

// Función para obtener el instrumento más caro
function obtenerInstrumentoMasCaro() {
    if (instrumentos.length === 0) return null;
    return instrumentos.reduce((max, inst) => 
        (Number(inst.precio) || 0) > (Number(max.precio) || 0) ? inst : max, 
        instrumentos[0]
    );
}

// Función para obtener el instrumento más reciente
function obtenerInstrumentoMasReciente() {
    if (instrumentos.length === 0) return null;
    return instrumentos.reduce((reciente, inst) => 
        new Date(inst.fecha) > new Date(reciente.fecha) ? inst : reciente, 
        instrumentos[0]
    );
}

// Función para mostrar el módulo
async function mostrarInstrumentos() {
    await cargarInstrumentos();
    
    const total = calcularTotalInvertido();
    const masCaro = obtenerInstrumentoMasCaro();
    const masReciente = obtenerInstrumentoMasReciente();
    
    return `
        <h2>🛠️ Gestión de Instrumentos</h2>
        
        <!-- Tarjeta de resumen con total invertido -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem;">
            <div style="background: linear-gradient(135deg, #8B4513, #D2691E); color: white; padding: 1.5rem; border-radius: 10px; box-shadow: var(--sombra);">
                <h3 style="margin: 0; font-size: 0.9rem; opacity: 0.9;">TOTAL INVERTIDO</h3>
                <p style="font-size: 2rem; font-weight: bold; margin: 0.5rem 0;">${formatearMoneda(total)}</p>
                <p style="margin: 0; font-size: 0.8rem;">${instrumentos.length} instrumentos</p>
            </div>
            
            <div style="background: white; padding: 1.5rem; border-radius: 10px; box-shadow: var(--sombra);">
                <h3 style="margin: 0; color: #666; font-size: 0.9rem;">INSTRUMENTO MÁS CARO</h3>
                ${masCaro ? `
                    <p style="font-size: 1.2rem; font-weight: bold; margin: 0.5rem 0;">${formatearMoneda(masCaro.precio)}</p>
                    <p style="margin: 0; color: #666;">${masCaro.proveedor || ''}</p>
                ` : `
                    <p style="margin: 0.5rem 0;">No hay datos</p>
                `}
            </div>
            
            <div style="background: white; padding: 1.5rem; border-radius: 10px; box-shadow: var(--sombra);">
                <h3 style="margin: 0; color: #666; font-size: 0.9rem;">ÚLTIMO INSTRUMENTO</h3>
                ${masReciente ? `
                    <p style="font-size: 1.2rem; font-weight: bold; margin: 0.5rem 0;">${new Date(masReciente.fecha).toLocaleDateString('es-ES')}</p>
                    <p style="margin: 0; color: #666;">${masReciente.proveedor || ''}</p>
                ` : `
                    <p style="margin: 0.5rem 0;">No hay datos</p>
                `}
            </div>
        </div>
        
        <!-- Formulario para agregar -->
        <div class="form-container" style="background: white; padding: 1.5rem; border-radius: 10px; margin-bottom: 2rem;">
            <h3>Agregar Nuevo Instrumento</h3>
            <form id="form-instrumento" onsubmit="event.preventDefault(); guardarInstrumento();">
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
                    <div class="form-group">
                        <label for="fecha">Fecha:</label>
                        <input type="date" id="fecha" value="${new Date().toISOString().split('T')[0]}" required>
                    </div>
                    <div class="form-group">
                        <label for="precio">Precio ($):</label>
                        <input type="number" id="precio" step="0.01" min="0" required>
                    </div>
                    <div class="form-group">
                        <label for="proveedor">Proveedor:</label>
                        <input type="text" id="proveedor" placeholder="Ej: Hornos Industriales SA" required>
                    </div>
                </div>
                <button type="submit" class="btn btn-success" style="margin-top: 1rem;">➕ Guardar Instrumento</button>
            </form>
        </div>
        
        <!-- Botones de acción -->
        <div style="display: flex; gap: 1rem; margin-bottom: 1rem;">
            <button class="btn btn-info" onclick="sincronizarInstrumentos()">
                🔄 Sincronizar con Supabase
            </button>
            <button class="btn btn-info" onclick="exportarInstrumentosCSV()">
                📊 Exportar a CSV
            </button>
        </div>
        
        <!-- Tabla de instrumentos -->
        <div class="table-container">
            <h3>Lista de Instrumentos</h3>
            <table id="tabla-instrumentos">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Fecha</th>
                        <th>Precio</th>
                        <th>Proveedor</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody id="instrumentos-body">
                    ${renderizarInstrumentos()}
                </tbody>
                ${instrumentos.length > 0 ? `
                    <tfoot>
                        <tr style="background-color: #f0f0f0; font-weight: bold;">
                            <td colspan="2" style="text-align: right;">TOTAL:</td>
                            <td>${formatearMoneda(total)}</td>
                            <td colspan="2"></td>
                        </tr>
                    </tfoot>
                ` : ''}
            </table>
        </div>
        
        <button class="btn" style="margin-top: 1rem;" onclick="volverAlInicio()">← Volver al Inicio</button>
    `;
}

// Función para renderizar la tabla de instrumentos
function renderizarInstrumentos() {
    if (instrumentos.length === 0) {
        return `<tr><td colspan="5" style="text-align: center; padding: 2rem;">No hay instrumentos registrados</td></tr>`;
    }
    
    return instrumentos.map((inst) => {
        const precio = Number(inst.precio) || 0;
        const esCaro = precio > 1000;
        
        return `
            <tr>
                <td>${inst.id || ''}</td>
                <td>${inst.fecha ? new Date(inst.fecha).toLocaleDateString('es-ES') : ''}</td>
                <td style="font-weight: ${esCaro ? 'bold' : 'normal'}; color: ${esCaro ? '#8B4513' : 'inherit'};">
                    ${formatearMoneda(precio)}
                </td>
                <td>${inst.proveedor || ''}</td>
                <td>
                    <button class="btn" style="background-color: var(--color-peligro); padding: 0.3rem 0.8rem; font-size: 0.9rem;" onclick="eliminarInstrumento(${inst.id})">
                        🗑️ Eliminar
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// Función para actualizar toda la interfaz del módulo
async function actualizarInterfaz() {
    const moduloInstrumentos = document.getElementById('instrumentos');
    if (moduloInstrumentos && moduloInstrumentos.classList.contains('active')) {
        moduloInstrumentos.innerHTML = await mostrarInstrumentos();
    }
}

// Función para guardar un nuevo instrumento
async function guardarInstrumento() {
    const client = window.supabaseClient?.getClient();
    
    if (!client) {
        mostrarNotificacion('Error: Cliente Supabase no disponible', 'error');
        return;
    }
    
    const fecha = document.getElementById('fecha').value;
    const precio = parseFloat(document.getElementById('precio').value);
    const proveedor = document.getElementById('proveedor').value;
    
    if (!fecha || isNaN(precio) || !proveedor) {
        mostrarNotificacion('Por favor completa todos los campos', 'error');
        return;
    }
    
    const nuevoInstrumento = {
        fecha: fecha,
        precio: precio,
        proveedor: proveedor
    };
    
    try {
        const { data, error } = await client
            .from('instrumentos')
            .insert([nuevoInstrumento])
            .select();
        
        if (error) {
            console.error('Error guardando instrumento:', error);
            mostrarNotificacion('Error al guardar instrumento', 'error');
            return;
        }
        
        // Agregar a lista local
        if (data && data[0]) {
            instrumentos.push({
                ...data[0],
                precio: Number(data[0].precio) || 0
            });
        }
        
        // Limpiar formulario
        document.getElementById('fecha').value = new Date().toISOString().split('T')[0];
        document.getElementById('precio').value = '';
        document.getElementById('proveedor').value = '';
        
        // Actualizar interfaz
        await actualizarInterfaz();
        
        mostrarNotificacion('Instrumento guardado correctamente', 'exito');
    } catch (e) {
        console.error('Error guardando instrumento:', e);
        mostrarNotificacion('Error al guardar instrumento', 'error');
    }
}

// Función para eliminar instrumento
async function eliminarInstrumento(id) {
    const client = window.supabaseClient?.getClient();
    
    if (!client) {
        mostrarNotificacion('Error: Cliente Supabase no disponible', 'error');
        return;
    }
    
    if (confirm('¿Estás seguro de eliminar este instrumento?')) {
        try {
            const { error } = await client
                .from('instrumentos')
                .delete()
                .eq('id', id);
            
            if (error) {
                console.error('Error eliminando instrumento:', error);
                mostrarNotificacion('Error al eliminar instrumento', 'error');
                return;
            }
            
            // Actualizar lista local
            const index = instrumentos.findIndex(i => i.id === id);
            if (index !== -1) {
                instrumentos.splice(index, 1);
            }
            
            await actualizarInterfaz();
            mostrarNotificacion('Instrumento eliminado', 'info');
        } catch (e) {
            console.error('Error eliminando instrumento:', e);
            mostrarNotificacion('Error al eliminar instrumento', 'error');
        }
    }
}

// Función para sincronizar manualmente
async function sincronizarInstrumentos() {
    await cargarInstrumentos();
    await actualizarInterfaz();
    mostrarNotificacion('Instrumentos sincronizados con Supabase', 'exito');
}

// Función para exportar a CSV
function exportarInstrumentosCSV() {
    if (instrumentos.length === 0) {
        mostrarNotificacion('No hay datos para exportar', 'error');
        return;
    }
    
    let csv = 'ID,Fecha,Precio,Proveedor\n';
    
    instrumentos.forEach(inst => {
        csv += `${inst.id || ''},${inst.fecha || ''},${inst.precio || 0},${inst.proveedor || ''}\n`;
    });
    
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `instrumentos_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    mostrarNotificacion('Archivo exportado correctamente', 'exito');
}

// Función para obtener el total invertido (usada por otros módulos)
async function obtenerTotalInvertidoInstrumentos() {
    await cargarInstrumentos();
    return calcularTotalInvertido();
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
        await cargarInstrumentos();
        console.log('✅ Módulo de Instrumentos inicializado con Supabase');
    } else {
        console.error('❌ No se pudo conectar con Supabase');
    }
})();

// Exponer funciones globalmente
window.mostrarInstrumentos = mostrarInstrumentos;
window.guardarInstrumento = guardarInstrumento;
window.eliminarInstrumento = eliminarInstrumento;
window.sincronizarInstrumentos = sincronizarInstrumentos;
window.exportarInstrumentosCSV = exportarInstrumentosCSV;
window.obtenerTotalInvertidoInstrumentos = obtenerTotalInvertidoInstrumentos;

console.log('🛠️ Módulo de Instrumentos (Supabase) cargado correctamente');