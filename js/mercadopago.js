/* ===========================================
   BARA & CO - MERCADOPAGO INTEGRATION
   Checkout real, preferencias, pagos
   =========================================== */

// ---------- 1. CONFIGURACIÓN ----------
const MP_PUBLIC_KEY = 'TEST-00000000-0000-0000-0000-000000000000'; // Reemplazar con tu clave real
const MP_ACCESS_TOKEN = 'TEST-00000000-0000-0000-0000-000000000000'; // Reemplazar con tu token real

// Cargar SDK de MercadoPago
function cargarMercadoPago() {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://sdk.mercadopago.com/js/v2';
        script.onload = () => {
            const mp = new MercadoPago(MP_PUBLIC_KEY);
            resolve(mp);
        };
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

// ---------- 2. CREAR PREFERENCIA DE PAGO ----------
async function crearPreferenciaMercadoPago(items, comprador) {
    try {
        const carrito = JSON.parse(localStorage.getItem('baraCarrito')) || [];
        
        // Validar que haya items
        if (carrito.length === 0) {
            mostrarNotificacion('❌ El carrito está vacío', 'error');
            return null;
        }

        // Calcular total
        const total = carrito.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
        
        // En un entorno real, esto se haría en el backend
        // Acá simulamos la creación de una preferencia
        const preferencia = {
            items: carrito.map(item => ({
                title: `${item.nombre} - ${item.color} / ${item.talle}`,
                quantity: item.cantidad,
                currency_id: 'ARS',
                unit_price: item.precio
            })),
            payer: {
                name: comprador?.nombre || 'Cliente',
                email: comprador?.email || 'cliente@email.com'
            },
            back_urls: {
                success: window.location.origin + '/checkout-success.html',
                failure: window.location.origin + '/checkout-failure.html',
                pending: window.location.origin + '/checkout-pending.html'
            },
            auto_return: 'approved',
            external_reference: 'BARA-' + Date.now(),
            notification_url: window.location.origin + '/webhook/mercadopago'
        };

        // Guardar preferencia en localStorage (simulación)
        localStorage.setItem('baraUltimaPreferencia', JSON.stringify({
            id: 'MP-' + Date.now(),
            ...preferencia
        }));

        return preferencia;
        
    } catch (error) {
        console.error('Error creando preferencia:', error);
        mostrarNotificacion('❌ Error al procesar el pago', 'error');
        return null;
    }
}

// ---------- 3. INICIAR CHECKOUT ----------
async function iniciarCheckoutMercadoPago() {
    if (!estaLogueado()) {
        mostrarNotificacion('🔐 Iniciá sesión para continuar', 'info');
        setTimeout(() => {
            window.location.href = 'login.html?redirect=checkout.html';
        }, 2000);
        return;
    }

    try {
        const mp = await cargarMercadoPago();
        const preferencia = await crearPreferenciaMercadoPago();
        
        if (preferencia) {
            // En producción, acá recibirías el ID de la preferencia del backend
            const checkout = mp.checkout({
                preference: {
                    id: 'PREF-' + Date.now()
                }
            });
            
            checkout.open();
        }
        
    } catch (error) {
        console.error('Error iniciando checkout:', error);
        mostrarNotificacion('❌ No se pudo iniciar el pago', 'error');
    }
}

// ---------- 4. PROCESAR PAGO EXITOSO ----------
function procesarPagoExitoso(paymentId, status) {
    // Obtener carrito
    const carrito = JSON.parse(localStorage.getItem('baraCarrito')) || [];
    const total = carrito.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
    
    // Crear orden
    const orden = {
        id: 'ORD-' + Date.now(),
        fecha: new Date().toISOString(),
        items: [...carrito],
        total: total,
        paymentId: paymentId,
        estado: 'confirmado',
        envio: null
    };
    
    // Guardar en historial del usuario
    if (estaLogueado()) {
        const usuario = obtenerUsuarioActual();
        const usuarios = JSON.parse(localStorage.getItem('baraUsuarios')) || [];
        const index = usuarios.findIndex(u => u.id === usuario.id);
        
        if (index !== -1) {
            if (!usuarios[index].pedidos) usuarios[index].pedidos = [];
            usuarios[index].pedidos.push(orden);
            localStorage.setItem('baraUsuarios', JSON.stringify(usuarios));
        }
    }
    
    // Vaciar carrito
    localStorage.removeItem('baraCarrito');
    
    // Guardar orden actual
    localStorage.setItem('baraUltimaOrden', JSON.stringify(orden));
    
    return orden;
}

// ---------- 5. CALCULAR ENVÍO ----------
function calcularEnvio(codigoPostal) {
    // Simulación de cálculo de envío
    const tarifas = {
        '5000': 1200,  // Córdoba Capital
        '5001': 1500,  // Jesús María
        '5002': 1800,  // Colonia Caroya
        '5003': 2000,  // Sinsacate
        'default': 2500 // Resto del país
    };
    
    const costo = tarifas[codigoPostal] || tarifas['default'];
    
    return {
        costo,
        dias: costo === 1200 ? 1 : costo === 1500 ? 2 : 3,
        metodo: 'OCA'
    };
}

// ---------- 6. APLICAR CUPÓN ----------
function aplicarCupon(codigo) {
    const cupones = {
        'BIENVENIDA10': { tipo: 'porcentaje', valor: 10 },
        'VERANO20': { tipo: 'porcentaje', valor: 20 },
        'ENVIOGRATIS': { tipo: 'envio_gratis', valor: 0 },
        'BARAYCO': { tipo: 'fijo', valor: 1000 }
    };
    
    return cupones[codigo.toUpperCase()] || null;
}

// ---------- 7. FORMATO MONEDA ----------
function formatearPrecioARS(precio) {
    return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        minimumFractionDigits: 0
    }).format(precio);
}

// Exportar funciones
window.iniciarCheckoutMercadoPago = iniciarCheckoutMercadoPago;
window.crearPreferenciaMercadoPago = crearPreferenciaMercadoPago;
window.procesarPagoExitoso = procesarPagoExitoso;
window.calcularEnvio = calcularEnvio;
window.aplicarCupon = aplicarCupon;
window.formatearPrecioARS = formatearPrecioARS;
