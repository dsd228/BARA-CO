/* ===========================================
   BARA & CO - CARRITO GLOBAL
   Este archivo va en TODAS las páginas
   Gestiona el carrito, localStorage y notificaciones
   =========================================== */

// ---------- 1. INICIALIZACIÓN DEL CARRITO ----------
let carrito = JSON.parse(localStorage.getItem('baraCarrito')) || [];

// ---------- 2. ELEMENTOS DEL DOM ----------
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar carrito en todas las páginas
    actualizarContadorCarrito();
    renderizarCarrito();
    initCarritoEventos();
    
    // Inicializar cursor personalizado (solo desktop)
    if (window.innerWidth > 1024) {
        initCursor();
    }
    
    // Inicializar header scroll
    initHeaderScroll();
    
    // Inicializar menú mobile
    initMobileMenu();
});

// ---------- 3. FUNCIONES PRINCIPALES DEL CARRITO ----------

/**
 * Agregar producto al carrito
 * @param {string} nombre - Nombre del producto
 * @param {number} precio - Precio del producto
 * @param {string} talle - Talle seleccionado
 * @param {string} color - Color seleccionado
 * @param {string} imagen - URL de la imagen
 */
function agregarAlCarrito(nombre, precio, talle = 'Único', color = '', imagen = 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80') {
    
    const producto = {
        id: Date.now(),
        nombre: nombre,
        precio: precio,
        talle: talle,
        color: color,
        imagen: imagen,
        cantidad: 1
    };
    
    // Verificar si ya existe el mismo producto (mismo nombre, talle, color)
    const existe = carrito.find(item => 
        item.nombre === producto.nombre && 
        item.talle === producto.talle && 
        item.color === producto.color
    );
    
    if (existe) {
        existe.cantidad += 1;
        mostrarNotificacion(`✓ ${nombre} - Cantidad actualizada`);
    } else {
        carrito.push(producto);
        mostrarNotificacion(`✓ ${nombre} agregado al carrito`);
    }
    
    // Guardar en localStorage
    localStorage.setItem('baraCarrito', JSON.stringify(carrito));
    
    // Actualizar UI
    actualizarContadorCarrito();
    renderizarCarrito();
    
    // Animación del ícono del carrito
    animarCarritoIcono();
}

/**
 * Eliminar producto del carrito
 * @param {number} id - ID del producto
 */
function eliminarDelCarrito(id) {
    const producto = carrito.find(item => item.id === id);
    carrito = carrito.filter(item => item.id !== id);
    localStorage.setItem('baraCarrito', JSON.stringify(carrito));
    
    actualizarContadorCarrito();
    renderizarCarrito();
    mostrarNotificacion(`✕ ${producto.nombre} eliminado`);
}

/**
 * Actualizar cantidad de un producto
 * @param {number} id - ID del producto
 * @param {string} accion - 'incrementar' o 'decrementar'
 */
function actualizarCantidad(id, accion) {
    const producto = carrito.find(item => item.id === id);
    
    if (producto) {
        if (accion === 'incrementar') {
            producto.cantidad += 1;
        } else if (accion === 'decrementar' && producto.cantidad > 1) {
            producto.cantidad -= 1;
        } else if (accion === 'decrementar' && producto.cantidad === 1) {
            eliminarDelCarrito(id);
            return;
        }
        
        localStorage.setItem('baraCarrito', JSON.stringify(carrito));
        renderizarCarrito();
        actualizarContadorCarrito();
    }
}

/**
 * Vaciar carrito completo
 */
function vaciarCarrito() {
    if (carrito.length > 0) {
        carrito = [];
        localStorage.setItem('baraCarrito', JSON.stringify(carrito));
        actualizarContadorCarrito();
        renderizarCarrito();
        mostrarNotificacion('🗑️ Carrito vaciado');
    }
}

/**
 * Calcular subtotal del carrito
 * @returns {number} Subtotal total
 */
function calcularSubtotal() {
    return carrito.reduce((total, item) => total + (item.precio * item.cantidad), 0);
}

/**
 * Renderizar los items del carrito en el panel
 */
function renderizarCarrito() {
    const cartItemsContainer = document.querySelector('.cart-items');
    const subtotalElement = document.getElementById('subtotal');
    
    if (!cartItemsContainer) return;
    
    if (carrito.length === 0) {
        cartItemsContainer.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; text-align: center; color: var(--color-text-secondary);">
                <i class="fas fa-shopping-bag" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.3;"></i>
                <p style="font-size: 1.1rem; margin-bottom: 0.5rem;">Tu carrito está vacío</p>
                <p style="font-size: 0.9rem;">Explorá nuestra colección</p>
            </div>
        `;
    } else {
        let html = '';
        
        carrito.forEach(item => {
            html += `
                <div class="cart-item" data-id="${item.id}">
                    <div class="item-image">
                        <img src="${item.imagen}" alt="${item.nombre}">
                    </div>
                    <div class="item-details">
                        <h4>${item.nombre}</h4>
                        <p>${item.talle} / ${item.color}</p>
                        <span class="item-price">$${item.precio.toLocaleString('es-AR')}</span>
                    </div>
                    <div class="item-actions">
                        <div class="item-quantity">
                            <button class="qty-btn" onclick="actualizarCantidad(${item.id}, 'decrementar')">-</button>
                            <span class="quantity">${item.cantidad}</span>
                            <button class="qty-btn" onclick="actualizarCantidad(${item.id}, 'incrementar')">+</button>
                        </div>
                        <span class="remove-item" onclick="eliminarDelCarrito(${item.id})">
                            <i class="fas fa-trash-alt"></i> Eliminar
                        </span>
                    </div>
                </div>
            `;
        });
        
        cartItemsContainer.innerHTML = html;
    }
    
    // Actualizar subtotal
    if (subtotalElement) {
        subtotalElement.textContent = `$${calcularSubtotal().toLocaleString('es-AR')}`;
    }
}

/**
 * Actualizar el contador del carrito en todas partes
 */
function actualizarContadorCarrito() {
    const contadores = document.querySelectorAll('.cart-count, .header-cart-count');
    const totalItems = carrito.reduce((total, item) => total + item.cantidad, 0);
    
    contadores.forEach(el => {
        el.textContent = totalItems;
    });
}

/**
 * Mostrar notificación flotante
 * @param {string} mensaje - Mensaje a mostrar
 */
function mostrarNotificacion(mensaje) {
    const notification = document.getElementById('cartNotification');
    if (!notification) return;
    
    notification.querySelector('span').textContent = mensaje;
    notification.classList.add('show');
    
    clearTimeout(window.notificationTimeout);
    window.notificationTimeout = setTimeout(() => {
        notification.classList.remove('show');
    }, 2500);
}

/**
 * Animar ícono del carrito
 */
function animarCarritoIcono() {
    const cartIcon = document.querySelector('.cart-icon');
    if (cartIcon) {
        cartIcon.style.transform = 'scale(1.2)';
        setTimeout(() => {
            cartIcon.style.transform = 'scale(1)';
        }, 200);
    }
}

/**
 * Toggle del panel del carrito
 */
function toggleCart() {
    const cartPanel = document.getElementById('cartPanel');
    const overlay = document.getElementById('overlay');
    
    if (cartPanel && overlay) {
        cartPanel.classList.toggle('open');
        overlay.classList.toggle('active');
        
        // Prevenir scroll del body cuando el carrito está abierto
        if (cartPanel.classList.contains('open')) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
    }
}

/**
 * Inicializar eventos del carrito
 */
function initCarritoEventos() {
    // Cerrar carrito con ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const cartPanel = document.getElementById('cartPanel');
            if (cartPanel && cartPanel.classList.contains('open')) {
                toggleCart();
            }
        }
    });
}

// ---------- 4. CURSOR PERSONALIZADO ----------
function initCursor() {
    const cursor = document.querySelector('.custom-cursor');
    const cursorDot = document.querySelector('.cursor-dot');
    
    if (!cursor || !cursorDot) return;
    
    document.addEventListener('mousemove', (e) => {
        cursor.style.left = e.clientX + 'px';
        cursor.style.top = e.clientY + 'px';
        cursor.style.opacity = '1';
        
        cursorDot.style.left = e.clientX + 'px';
        cursorDot.style.top = e.clientY + 'px';
        cursorDot.style.opacity = '1';
    });
    
    const interactiveElements = document.querySelectorAll('a, button, .product-card, .nav-link, .header-icons i, .cart-icon, .btn, .thumbnail, .filter-tab, .lookbook-overlay');
    
    interactiveElements.forEach(el => {
        el.addEventListener('mouseenter', () => {
            cursor.classList.add('active');
            cursorDot.classList.add('active');
        });
        
        el.addEventListener('mouseleave', () => {
            cursor.classList.remove('active');
            cursorDot.classList.remove('active');
        });
    });
    
    document.addEventListener('mouseleave', () => {
        cursor.style.opacity = '0';
        cursorDot.style.opacity = '0';
    });
}

// ---------- 5. HEADER SCROLL ----------
function initHeaderScroll() {
    const header = document.getElementById('header');
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });
}

// ---------- 6. MENÚ MOBILE ----------
function initMobileMenu() {
    const menuToggle = document.querySelector('.menu-toggle');
    const navMenu = document.querySelector('.nav-menu');
    
    if (menuToggle && navMenu) {
        menuToggle.addEventListener('click', () => {
            navMenu.classList.toggle('show');
        });
    }
}

// ---------- 7. EXPORTAR FUNCIONES GLOBALES ----------
window.agregarAlCarrito = agregarAlCarrito;
window.eliminarDelCarrito = eliminarDelCarrito;
window.actualizarCantidad = actualizarCantidad;
window.vaciarCarrito = vaciarCarrito;
window.toggleCart = toggleCart;
window.calcularSubtotal = calcularSubtotal;
