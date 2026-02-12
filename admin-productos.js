/* ===========================================
   BARA & CO - PANEL DE ADMINISTRACIÓN
   CRUD de productos, categorías, stock
   =========================================== */

// ---------- 1. BASE DE DATOS DE PRODUCTOS ----------
let productos = JSON.parse(localStorage.getItem('baraProductos')) || [];

// Productos iniciales de ejemplo
if (productos.length === 0) {
    productos = [
        {
            id: 1,
            nombre: 'Remera Oversize',
            categoria: 'mujer',
            precio: 7999,
            descripcion: 'Corte holgado, tela de algodón peinado de 220g.',
            talles: ['S', 'M', 'L'],
            colores: ['Negro', 'Blanco'],
            imagenes: [
                'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
                'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
            ],
            stock: 15,
            destacado: true,
            fechaCreacion: new Date().toISOString()
        },
        {
            id: 2,
            nombre: 'Jean Holgado',
            categoria: 'mujer',
            precio: 15999,
            descripcion: 'Jean 100% algodón, corte holgado, tiro medio.',
            talles: ['24', '25', '26'],
            colores: ['Azul', 'Negro'],
            imagenes: [
                'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
            ],
            stock: 8,
            destacado: true,
            fechaCreacion: new Date().toISOString()
        },
        {
            id: 3,
            nombre: 'Campera Jean',
            categoria: 'hombre',
            precio: 22999,
            descripcion: 'Campera de jean clásica, corte regular.',
            talles: ['S', 'M', 'L', 'XL'],
            colores: ['Negro', 'Azul'],
            imagenes: [
                'https://images.unsplash.com/photo-1524592001865-b32997a13083?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
            ],
            stock: 5,
            destacado: true,
            fechaCreacion: new Date().toISOString()
        },
        {
            id: 4,
            nombre: 'Abanico Artesanal',
            categoria: 'accesorios',
            precio: 4999,
            descripcion: 'Abanico de madera tallada a mano.',
            talles: ['Unico'],
            colores: ['Madera'],
            imagenes: [
                'https://images.unsplash.com/photo-1564584217132-2271feaeb3c5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
            ],
            stock: 20,
            destacado: false,
            fechaCreacion: new Date().toISOString()
        },
        {
            id: 5,
            nombre: 'Buzo Canguro',
            categoria: 'hombre',
            precio: 18999,
            descripcion: 'Buzo canguro de algodón frisado.',
            talles: ['S', 'M', 'L'],
            colores: ['Gris', 'Negro'],
            imagenes: [
                'https://images.unsplash.com/photo-1556306535-0f09a537f0a3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
            ],
            stock: 12,
            destacado: false,
            fechaCreacion: new Date().toISOString()
        }
    ];
    localStorage.setItem('baraProductos', JSON.stringify(productos));
}

// ---------- 2. CRUD DE PRODUCTOS ----------

/**
 * Obtener todos los productos
 */
function obtenerProductos() {
    return JSON.parse(localStorage.getItem('baraProductos')) || [];
}

/**
 * Obtener producto por ID
 */
function obtenerProductoPorId(id) {
    const productos = obtenerProductos();
    return productos.find(p => p.id === parseInt(id));
}

/**
 * Crear nuevo producto
 */
function crearProducto(productoData) {
    const productos = obtenerProductos();
    
    const nuevoProducto = {
        id: productos.length > 0 ? Math.max(...productos.map(p => p.id)) + 1 : 1,
        ...productoData,
        fechaCreacion: new Date().toISOString(),
        destacado: productoData.destacado || false,
        stock: productoData.stock || 10
    };
    
    productos.push(nuevoProducto);
    localStorage.setItem('baraProductos', JSON.stringify(productos));
    
    mostrarNotificacion('✅ Producto creado exitosamente');
    return nuevoProducto;
}

/**
 * Actualizar producto existente
 */
function actualizarProducto(id, productoData) {
    const productos = obtenerProductos();
    const index = productos.findIndex(p => p.id === parseInt(id));
    
    if (index !== -1) {
        productos[index] = {
            ...productos[index],
            ...productoData,
            id: productos[index].id
        };
        
        localStorage.setItem('baraProductos', JSON.stringify(productos));
        mostrarNotificacion('✅ Producto actualizado');
        return productos[index];
    }
    
    mostrarNotificacion('❌ Producto no encontrado', 'error');
    return null;
}

/**
 * Eliminar producto
 */
function eliminarProducto(id) {
    if (confirm('¿Estás seguro de eliminar este producto?')) {
        const productos = obtenerProductos();
        const nuevosProductos = productos.filter(p => p.id !== parseInt(id));
        
        localStorage.setItem('baraProductos', JSON.stringify(nuevosProductos));
        mostrarNotificacion('🗑️ Producto eliminado');
        
        // Recargar la vista de productos si estamos en admin
        if (window.location.pathname.includes('admin.html')) {
            location.reload();
        }
        
        return true;
    }
    return false;
}

/**
 * Buscar productos por término
 */
function buscarProductos(termino) {
    const productos = obtenerProductos();
    const terminoLower = termino.toLowerCase();
    
    return productos.filter(p => 
        p.nombre.toLowerCase().includes(terminoLower) ||
        p.categoria.toLowerCase().includes(terminoLower) ||
        p.descripcion?.toLowerCase().includes(terminoLower)
    );
}

/**
 * Filtrar productos por categoría
 */
function filtrarPorCategoria(categoria) {
    const productos = obtenerProductos();
    if (categoria === 'todos') return productos;
    return productos.filter(p => p.categoria === categoria);
}

/**
 * Obtener productos destacados
 */
function obtenerDestacados() {
    const productos = obtenerProductos();
    return productos.filter(p => p.destacado).slice(0, 4);
}

/**
 * Actualizar stock
 */
function actualizarStock(productoId, cantidad) {
    const productos = obtenerProductos();
    const producto = productos.find(p => p.id === productoId);
    
    if (producto) {
        producto.stock = Math.max(0, (producto.stock || 0) - cantidad);
        localStorage.setItem('baraProductos', JSON.stringify(productos));
        return producto.stock;
    }
    
    return null;
}

/**
 * Verificar disponibilidad
 */
function verificarDisponibilidad(productoId, talle, color) {
    const producto = obtenerProductoPorId(productoId);
    if (!producto) return false;
    
    const tieneStock = (producto.stock || 0) > 0;
    const tieneTalle = !talle || producto.talles?.includes(talle);
    const tieneColor = !color || producto.colores?.includes(color);
    
    return tieneStock && tieneTalle && tieneColor;
}

// ---------- 3. CATEGORÍAS ----------
const categorias = [
    { id: 'mujer', nombre: 'Mujer', icono: 'fa-female' },
    { id: 'hombre', nombre: 'Hombre', icono: 'fa-male' },
    { id: 'accesorios', nombre: 'Accesorios', icono: 'fa-gem' },
    { id: 'sale', nombre: 'Sale', icono: 'fa-tag' }
];

function obtenerCategorias() {
    return categorias;
}

// ---------- 4. CUPONES ----------
let cupones = JSON.parse(localStorage.getItem('baraCupones')) || [
    { codigo: 'BIENVENIDA10', tipo: 'porcentaje', valor: 10, usos: 0, maxUsos: 100 },
    { codigo: 'VERANO20', tipo: 'porcentaje', valor: 20, usos: 0, maxUsos: 50 },
    { codigo: 'ENVIOGRATIS', tipo: 'envio_gratis', valor: 0, usos: 0, maxUsos: 30 },
    { codigo: 'BARAYCO', tipo: 'fijo', valor: 1000, usos: 0, maxUsos: 200 }
];

function obtenerCupones() {
    return JSON.parse(localStorage.getItem('baraCupones')) || cupones;
}

function validarCupon(codigo) {
    const cupones = obtenerCupones();
    const cupon = cupones.find(c => c.codigo === codigo.toUpperCase());
    
    if (!cupon) return null;
    if (cupon.usos >= cupon.maxUsos) return null;
    
    return cupon;
}

function usarCupon(codigo) {
    const cupones = obtenerCupones();
    const index = cupones.findIndex(c => c.codigo === codigo.toUpperCase());
    
    if (index !== -1) {
        cupones[index].usos += 1;
        localStorage.setItem('baraCupones', JSON.stringify(cupones));
        return true;
    }
    
    return false;
}

// Exportar funciones globales
window.obtenerProductos = obtenerProductos;
window.obtenerProductoPorId = obtenerProductoPorId;
window.crearProducto = crearProducto;
window.actualizarProducto = actualizarProducto;
window.eliminarProducto = eliminarProducto;
window.buscarProductos = buscarProductos;
window.filtrarPorCategoria = filtrarPorCategoria;
window.obtenerDestacados = obtenerDestacados;
window.actualizarStock = actualizarStock;
window.verificarDisponibilidad = verificarDisponibilidad;
window.obtenerCategorias = obtenerCategorias;
window.obtenerCupones = obtenerCupones;
window.validarCupon = validarCupon;
window.usarCupon = usarCupon;

// Inicializar en tienda.html si existe
document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('tienda.html')) {
        // Los productos ya están cargados en el HTML estático
        // Esta función se usa para futuras implementaciones dinámicas
        console.log('Admin productos cargado');
    }
});
