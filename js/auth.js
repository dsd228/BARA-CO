/* ===========================================
   BARA & CO - SISTEMA DE AUTENTICACIÓN
   Login, Registro, Perfiles, LocalStorage
   =========================================== */

// ---------- 1. BASE DE DATOS DE USUARIOS (LOCALSTORAGE) ----------
let usuarios = JSON.parse(localStorage.getItem('baraUsuarios')) || [];

// Usuario admin por defecto
if (usuarios.length === 0) {
    usuarios.push({
        id: 1,
        nombre: 'Admin',
        email: 'admin@barayco.com',
        password: 'admin123',
        tipo: 'admin',
        fechaRegistro: new Date().toISOString()
    });
    localStorage.setItem('baraUsuarios', JSON.stringify(usuarios));
}

// Sesión actual
let sesionActual = JSON.parse(localStorage.getItem('baraSesion')) || null;

// ---------- 2. REGISTRO DE NUEVO USUARIO ----------
function registrarUsuario(nombre, email, password, tipo = 'cliente') {
    // Validar email único
    const existe = usuarios.find(u => u.email === email);
    if (existe) {
        mostrarNotificacion('❌ Este email ya está registrado', 'error');
        return false;
    }

    // Validar contraseña (mínimo 6 caracteres)
    if (password.length < 6) {
        mostrarNotificacion('❌ La contraseña debe tener al menos 6 caracteres', 'error');
        return false;
    }

    const nuevoUsuario = {
        id: usuarios.length + 1,
        nombre,
        email,
        password, // En producción, deberías hashear esta contraseña
        tipo,
        fechaRegistro: new Date().toISOString(),
        direcciones: [],
        pedidos: [],
        wishlist: []
    };

    usuarios.push(nuevoUsuario);
    localStorage.setItem('baraUsuarios', JSON.stringify(usuarios));

    // Iniciar sesión automáticamente
    iniciarSesion(email, password);
    
    mostrarNotificacion('✅ ¡Registro exitoso!');
    return true;
}

// ---------- 3. INICIAR SESIÓN ----------
function iniciarSesion(email, password) {
    const usuario = usuarios.find(u => u.email === email && u.password === password);
    
    if (usuario) {
        sesionActual = {
            id: usuario.id,
            nombre: usuario.nombre,
            email: usuario.email,
            tipo: usuario.tipo,
            fechaInicio: new Date().toISOString()
        };
        
        localStorage.setItem('baraSesion', JSON.stringify(sesionActual));
        actualizarUILogin();
        mostrarNotificacion(`👋 ¡Bienvenido, ${usuario.nombre}!`);
        
        // Redirigir según tipo
        if (usuario.tipo === 'admin') {
            setTimeout(() => { window.location.href = 'admin.html'; }, 1500);
        }
        
        return true;
    } else {
        mostrarNotificacion('❌ Email o contraseña incorrectos', 'error');
        return false;
    }
}

// ---------- 4. CERRAR SESIÓN ----------
function cerrarSesion() {
    sesionActual = null;
    localStorage.removeItem('baraSesion');
    actualizarUILogin();
    mostrarNotificacion('👋 Sesión cerrada');
    
    // Redirigir al home
    setTimeout(() => { window.location.href = 'index.html'; }, 1500);
}

// ---------- 5. VERIFICAR SESIÓN ----------
function estaLogueado() {
    return sesionActual !== null;
}

function esAdmin() {
    return sesionActual && sesionActual.tipo === 'admin';
}

function obtenerUsuarioActual() {
    return sesionActual;
}

// ---------- 6. ACTUALIZAR UI SEGÚN ESTADO DE LOGIN ----------
function actualizarUILogin() {
    const userIcon = document.querySelector('.header-icons .fa-user, .user-icon, .login-btn');
    const userMenu = document.querySelector('.user-menu');
    const adminLinks = document.querySelectorAll('.admin-only');
    
    if (estaLogueado()) {
        // Cambiar ícono de usuario
        if (userIcon) {
            userIcon.classList.remove('fa-user');
            userIcon.classList.add('fa-user-check');
            userIcon.style.color = 'var(--color-accent)';
        }
        
        // Mostrar nombre de usuario
        const userNameElement = document.querySelector('.user-name');
        if (userNameElement) {
            userNameElement.textContent = sesionActual.nombre;
        }
        
        // Mostrar menú de usuario
        if (userMenu) {
            userMenu.innerHTML = `
                <span class="user-greeting">Hola, ${sesionActual.nombre}</span>
                <a href="perfil.html">Mi Perfil</a>
                <a href="pedidos.html">Mis Pedidos</a>
                <a href="#" onclick="cerrarSesion(); return false;">Cerrar Sesión</a>
            `;
            userMenu.style.display = 'block';
        }
        
        // Mostrar links solo para admin
        adminLinks.forEach(link => {
            link.style.display = esAdmin() ? 'block' : 'none';
        });
        
    } else {
        // Usuario no logueado
        if (userIcon) {
            userIcon.classList.remove('fa-user-check');
            userIcon.classList.add('fa-user');
            userIcon.style.color = '';
        }
        
        if (userMenu) {
            userMenu.innerHTML = `
                <a href="login.html">Iniciar Sesión</a>
                <a href="login.html?tab=registro">Registrarse</a>
            `;
        }
        
        adminLinks.forEach(link => {
            link.style.display = 'none';
        });
    }
}

// ---------- 7. GESTIÓN DE PERFIL ----------
function actualizarPerfil(usuarioId, datosActualizados) {
    const index = usuarios.findIndex(u => u.id === usuarioId);
    if (index !== -1) {
        usuarios[index] = { ...usuarios[index], ...datosActualizados };
        localStorage.setItem('baraUsuarios', JSON.stringify(usuarios));
        
        // Actualizar sesión si es el usuario actual
        if (sesionActual && sesionActual.id === usuarioId) {
            sesionActual = { ...sesionActual, ...datosActualizados };
            localStorage.setItem('baraSesion', JSON.stringify(sesionActual));
        }
        
        mostrarNotificacion('✅ Perfil actualizado');
        return true;
    }
    return false;
}

// ---------- 8. AGREGAR A WISHLIST ----------
function agregarAWishlist(productoId) {
    if (!estaLogueado()) {
        mostrarNotificacion('🔐 Iniciá sesión para guardar productos', 'info');
        setTimeout(() => { window.location.href = 'login.html'; }, 2000);
        return false;
    }
    
    const usuario = usuarios.find(u => u.id === sesionActual.id);
    if (!usuario.wishlist.includes(productoId)) {
        usuario.wishlist.push(productoId);
        localStorage.setItem('baraUsuarios', JSON.stringify(usuarios));
        mostrarNotificacion('❤️ Producto guardado en favoritos');
        return true;
    } else {
        // Si ya está, lo saca
        usuario.wishlist = usuario.wishlist.filter(id => id !== productoId);
        localStorage.setItem('baraUsuarios', JSON.stringify(usuarios));
        mostrarNotificacion('💔 Producto eliminado de favoritos');
        return false;
    }
}

// ---------- 9. PROTEGER RUTAS ----------
function protegerRuta(tipoRequerido = null) {
    if (!estaLogueado()) {
        window.location.href = 'login.html?redirect=' + window.location.pathname;
        return false;
    }
    
    if (tipoRequerido === 'admin' && !esAdmin()) {
        window.location.href = 'index.html';
        mostrarNotificacion('⛔ Acceso no autorizado', 'error');
        return false;
    }
    
    return true;
}

// ---------- 10. INICIALIZACIÓN ----------
document.addEventListener('DOMContentLoaded', function() {
    actualizarUILogin();
    
    // Agregar botón de wishlist a productos
    const productCards = document.querySelectorAll('.product-card, .featured-card');
    productCards.forEach(card => {
        const productId = card.dataset.productId || Math.floor(Math.random() * 1000);
        const wishlistBtn = document.createElement('span');
        wishlistBtn.className = 'wishlist-btn';
        wishlistBtn.innerHTML = '<i class="far fa-heart"></i>';
        wishlistBtn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            agregarAWishlist(productId);
        };
        
        const imageContainer = card.querySelector('.product-image, .featured-image');
        if (imageContainer) {
            imageContainer.style.position = 'relative';
            imageContainer.appendChild(wishlistBtn);
        }
    });
});

// Estilos para wishlist (se pueden agregar al CSS global)
const style = document.createElement('style');
style.textContent = `
    .wishlist-btn {
        position: absolute;
        top: 15px;
        right: 15px;
        width: 40px;
        height: 40px;
        background: white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        z-index: 10;
        transition: all 0.3s;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    
    .wishlist-btn i {
        color: #999;
        font-size: 1.2rem;
        transition: all 0.3s;
    }
    
    .wishlist-btn:hover i {
        color: #ff4444;
        transform: scale(1.2);
    }
    
    .wishlist-btn.active i {
        color: #ff4444;
        content: "\\f004";
    }
    
    .user-greeting {
        padding: 8px 16px;
        color: var(--color-text-secondary);
        border-bottom: 1px solid #eee;
    }
    
    .admin-only {
        display: none;
    }
`;
document.head.appendChild(style);

// Exportar funciones globales
window.registrarUsuario = registrarUsuario;
window.iniciarSesion = iniciarSesion;
window.cerrarSesion = cerrarSesion;
window.estaLogueado = estaLogueado;
window.esAdmin = esAdmin;
window.obtenerUsuarioActual = obtenerUsuarioActual;
window.agregarAWishlist = agregarAWishlist;
window.protegerRuta = protegerRuta;
