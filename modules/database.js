// modules/database.js - Sistema de base de datos mejorado con IndexedDB

const DB_NAME = 'DulceHerenciaDB';
const DB_VERSION = 1;

let db = null;

// Inicializar base de datos
function initDatabase() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        
        request.onerror = (event) => {
            console.error('Error abriendo base de datos:', event.target.error);
            reject(event.target.error);
        };
        
        request.onsuccess = (event) => {
            db = event.target.result;
            console.log('✅ Base de datos IndexedDB inicializada');
            resolve(db);
        };
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            
            // Crear almacenes de objetos (tablas)
            if (!db.objectStoreNames.contains('ventas')) {
                const ventasStore = db.createObjectStore('ventas', { keyPath: 'id', autoIncrement: true });
                ventasStore.createIndex('fecha', 'fecha', { unique: false });
                ventasStore.createIndex('productoId', 'productoId', { unique: false });
            }
            
            if (!db.objectStoreNames.contains('productos')) {
                const productosStore = db.createObjectStore('productos', { keyPath: 'id', autoIncrement: true });
                productosStore.createIndex('nombre', 'nombre', { unique: false });
            }
            
            if (!db.objectStoreNames.contains('instrumentos')) {
                db.createObjectStore('instrumentos', { keyPath: 'id', autoIncrement: true });
            }
            
            if (!db.objectStoreNames.contains('empleados')) {
                db.createObjectStore('empleados', { keyPath: 'id', autoIncrement: true });
            }
            
            if (!db.objectStoreNames.contains('materia_prima')) {
                db.createObjectStore('materia_prima', { keyPath: 'id', autoIncrement: true });
            }
            
            if (!db.objectStoreNames.contains('metas')) {
                db.createObjectStore('metas', { keyPath: 'id' });
            }
            
            if (!db.objectStoreNames.contains('inversiones')) {
                const inversionesStore = db.createObjectStore('inversiones', { keyPath: 'id', autoIncrement: true });
                inversionesStore.createIndex('fecha', 'fecha', { unique: false });
                inversionesStore.createIndex('categoria', 'categoria', { unique: false });
            }
            
            console.log('📦 Estructura de base de datos creada');
        };
    });
}

// Función genérica para guardar datos
async function guardarDatos(storeName, datos) {
    return new Promise((resolve, reject) => {
        if (!db) {
            reject('Base de datos no inicializada');
            return;
        }
        
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        
        // Si es un array, guardar múltiples
        if (Array.isArray(datos)) {
            datos.forEach(item => {
                // Si no tiene ID, lo generamos
                if (!item.id) {
                    item.id = Date.now() + Math.random();
                }
                store.put(item);
            });
        } else {
            // Si es un objeto simple
            if (!datos.id) {
                datos.id = Date.now() + Math.random();
            }
            store.put(datos);
        }
        
        transaction.oncomplete = () => {
            console.log(`✅ Datos guardados en ${storeName}`);
            resolve();
        };
        
        transaction.onerror = (event) => {
            console.error(`❌ Error guardando en ${storeName}:`, event.target.error);
            reject(event.target.error);
        };
    });
}

// Función genérica para obtener datos
async function obtenerDatos(storeName, query = null) {
    return new Promise((resolve, reject) => {
        if (!db) {
            reject('Base de datos no inicializada');
            return;
        }
        
        const transaction = db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        
        let request;
        if (query) {
            // Si hay query, buscar por índice
            if (query.index && query.value) {
                const index = store.index(query.index);
                request = index.getAll(query.value);
            } else if (query.id) {
                request = store.get(query.id);
            } else {
                request = store.getAll();
            }
        } else {
            request = store.getAll();
        }
        
        request.onsuccess = () => {
            resolve(request.result);
        };
        
        request.onerror = (event) => {
            console.error(`❌ Error obteniendo datos de ${storeName}:`, event.target.error);
            reject(event.target.error);
        };
    });
}

// Función para migrar datos de localStorage a IndexedDB
async function migrarLocalStorage() {
    try {
        // Migrar ventas
        const ventasLS = localStorage.getItem('ventas');
        if (ventasLS) {
            const ventas = JSON.parse(ventasLS);
            await guardarDatos('ventas', ventas);
        }
        
        // Migrar productos
        const productosLS = localStorage.getItem('productos');
        if (productosLS) {
            const productos = JSON.parse(productosLS);
            await guardarDatos('productos', productos);
        }
        
        // Migrar instrumentos
        const instrumentosLS = localStorage.getItem('instrumentos');
        if (instrumentosLS) {
            const instrumentos = JSON.parse(instrumentosLS);
            await guardarDatos('instrumentos', instrumentos);
        }
        
        // Migrar empleados
        const empleadosLS = localStorage.getItem('empleados');
        if (empleadosLS) {
            const empleados = JSON.parse(empleadosLS);
            await guardarDatos('empleados', empleados);
        }
        
        // Migrar materia prima
        const materiaLS = localStorage.getItem('materiaPrima');
        if (materiaLS) {
            const materia = JSON.parse(materiaLS);
            await guardarDatos('materia_prima', materia);
        }
        
        // Migrar metas
        const metasLS = localStorage.getItem('metas');
        if (metasLS) {
            const metas = JSON.parse(metasLS);
            metas.id = 1;
            await guardarDatos('metas', metas);
        }
        
        console.log('✅ Datos migrados de localStorage a IndexedDB');
        return true;
    } catch (error) {
        console.error('❌ Error migrando datos:', error);
        return false;
    }
}

// Función para guardar inversión inicial
async function guardarInversion(inversion) {
    if (!inversion.fecha) {
        inversion.fecha = new Date().toISOString().split('T')[0];
    }
    return await guardarDatos('inversiones', inversion);
}

// Función para obtener total de inversiones
async function obtenerTotalInversiones() {
    const inversiones = await obtenerDatos('inversiones');
    return inversiones.reduce((total, inv) => total + (inv.monto || 0), 0);
}

// Función para obtener inversiones por categoría
async function obtenerInversionesPorCategoria() {
    const inversiones = await obtenerDatos('inversiones');
    const porCategoria = {};
    
    inversiones.forEach(inv => {
        const cat = inv.categoria || 'general';
        if (!porCategoria[cat]) {
            porCategoria[cat] = 0;
        }
        porCategoria[cat] += inv.monto || 0;
    });
    
    return porCategoria;
}

// Exportar funciones
window.initDatabase = initDatabase;
window.guardarDatos = guardarDatos;
window.obtenerDatos = obtenerDatos;
window.migrarLocalStorage = migrarLocalStorage;
window.guardarInversion = guardarInversion;
window.obtenerTotalInversiones = obtenerTotalInversiones;
window.obtenerInversionesPorCategoria = obtenerInversionesPorCategoria;

console.log('🗄️ Módulo de Base de Datos cargado');