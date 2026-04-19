// modules/supabaseClient.js - Cliente de Supabase para Dulce Herencia

// Credenciales de Supabase
const SUPABASE_URL = 'https://rzqbakmqcpajyhxvukyi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ6cWJha21xY3BhanloeHZ1a3lpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY1MzMxNDEsImV4cCI6MjA5MjEwOTE0MX0.9iAhcpsrWLLC9-HQYkTxk1ifp32svVCTUcB6lxnvMkA';

// Crear cliente de Supabase usando la biblioteca global
// Nota: Necesitamos agregar el script de Supabase en el index.html
let supabase = null;

function inicializarSupabase() {
    if (typeof supabaseCreateClient !== 'undefined') {
        supabase = supabaseCreateClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('✅ Cliente Supabase inicializado');
        return true;
    } else {
        console.error('❌ Biblioteca de Supabase no cargada');
        return false;
    }
}

// Esperar a que la biblioteca esté disponible
document.addEventListener('DOMContentLoaded', function() {
    // Intentar inicializar inmediatamente
    if (typeof supabaseCreateClient !== 'undefined') {
        inicializarSupabase();
    } else {
        // Esperar un poco y reintentar
        setTimeout(() => {
            if (typeof supabaseCreateClient !== 'undefined') {
                inicializarSupabase();
            }
        }, 100);
    }
});

// Exportar para uso global
window.supabaseClient = {
    getClient: () => supabase,
    inicializar: inicializarSupabase,
    isReady: () => supabase !== null
};

console.log('📦 Módulo Supabase Client cargado');