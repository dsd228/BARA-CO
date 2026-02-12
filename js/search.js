/* ===========================================
   BARA & CO - BUSCADOR EN TIEMPO REAL
   Búsqueda instantánea, filtros dinámicos
   =========================================== */

// ---------- 1. CONFIGURACIÓN ----------
const searchConfig = {
    minChars: 2,
    delay: 300,
    maxResults: 8
};

let searchTimeout = null;

// ---------- 2. INICIALIZAR BUSCADOR ----------
function initSearch() {
    // Crear overlay de búsqueda
    const searchOverlay = document.createElement('div');
    searchOverlay.className = 'search-overlay';
    searchOverlay.id = 'searchOverlay';
    searchOverlay.innerHTML = `
        <div class="search-container">
            <div class="search-header">
                <form class="search-form" onsubmit="handleSearchSubmit(event)">
                    <i class="fas fa-search search-icon"></i>
                    <input type="text" class="search-input" id="searchInput" placeholder="¿Qué estás buscando?" autocomplete="off">
                    <button type="button" class="search-close" onclick="toggleSearch()">
                        <i class="fas fa-times"></i>
                    </button>
                </form>
            </div>
            <div class="search-results" id="searchResults"></div>
            <div class="search-suggestions" id="searchSuggestions">
                <div class="suggestions-title">Búsquedas populares</div>
                <div class="suggestions-tags">
                    <span class="suggestion-tag" onclick="searchTag('remera')">Remeras</span>
                    <span class="suggestion-tag" onclick="searchTag('jean')">Jeans</span>
                    <span class="suggestion-tag" onclick="searchTag('buzo')">Buzos</span>
                    <span class="suggestion-tag" onclick="searchTag('campera')">Camperas</span>
                    <span class="suggestion-tag" onclick="searchTag('accesorios')">Accesorios</span>
                    <span class="suggestion-tag" onclick="searchTag('sale')">Sale</span>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(searchOverlay);
    
    // Event listeners
    const searchInput = document.getElementById('searchInput');
    
    searchInput.addEventListener('input', function(e) {
        clearTimeout(searchTimeout);
        const query = e.target.value.trim();
        
        if (query.length >= searchConfig.minChars) {
            searchTimeout = setTimeout(() => {
                performSearch(query);
            }, searchConfig.delay);
        } else {
            document.getElementById('searchResults').innerHTML = '';
            document.getElementById('searchSuggestions').style.display = 'block';
        }
    });
    
    // Cerrar con ESC
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && document.getElementById('searchOverlay').classList.contains('active')) {
            toggleSearch();
        }
    });
}

// ---------- 3. REALIZAR BÚSQUEDA ----------
function performSearch(query) {
    const productos = obtenerProductos();
    const results = buscarProductos(query);
    
    document.getElementById('searchSuggestions').style.display = 'none';
    
    if (results.length === 0) {
        document.getElementById('searchResults').innerHTML = `
            <div class="no-results">
                <i class="fas fa-search"></i>
                <h3>No encontramos resultados para "${query}"</h3>
                <p>Probá con otras palabras o revisá nuestras categorías</p>
                <div style="margin-top: 20px;">
                    <a href="tienda.html" class="btn">VER TODOS LOS PRODUCTOS</a>
                </div>
            </div>
        `;
        return;
    }
    
    let resultsHTML = '<div class="results-grid">';
    
    results.slice(0, searchConfig.maxResults).forEach(producto => {
        resultsHTML += `
            <div class="result-item" onclick="window.location.href='producto.html?id=${producto.id}'">
                <div class="result-image">
                    <img src="${producto.imagenes?.[0] || 'https://via.placeholder.com/100'}" alt="${producto.nombre}">
                </div>
                <div class="result-info">
                    <h4>${producto.nombre}</h4>
                    <p class="result-category">${producto.categoria}</p>
                    <p class="result-price">$${producto.precio.toLocaleString('es-AR')}</p>
                </div>
            </div>
        `;
    });
    
    resultsHTML += `
        </div>
        <div class="view-all-results">
            <a href="tienda.html?search=${encodeURIComponent(query)}">
                Ver todos los ${results.length} resultados <i class="fas fa-arrow-right"></i>
            </a>
        </div>
    `;
    
    document.getElementById('searchResults').innerHTML = resultsHTML;
}

// ---------- 4. TOGGLE BUSCADOR ----------
function toggleSearch() {
    const overlay = document.getElementById('searchOverlay');
    overlay.classList.toggle('active');
    
    if (overlay.classList.contains('active')) {
        setTimeout(() => {
            document.getElementById('searchInput').focus();
        }, 300);
        document.body.style.overflow = 'hidden';
    } else {
        document.body.style.overflow = '';
        document.getElementById('searchInput').value = '';
        document.getElementById('searchResults').innerHTML = '';
        document.getElementById('searchSuggestions').style.display = 'block';
    }
}

// ---------- 5. HANDLE SUBMIT ----------
function handleSearchSubmit(e) {
    e.preventDefault();
    const query = document.getElementById('searchInput').value.trim();
    if (query) {
        window.location.href = `tienda.html?search=${encodeURIComponent(query)}`;
    }
}

// ---------- 6. BUSCAR POR TAG ----------
function searchTag(tag) {
    toggleSearch();
    window.location.href = `tienda.html?search=${tag}`;
}

// ---------- 7. AGREGAR BOTÓN DE BÚSQUEDA A HEADER ----------
function addSearchButton() {
    const searchIcon = document.querySelector('.header-icons .fa-search');
    if (searchIcon) {
        searchIcon.parentElement.addEventListener('click', toggleSearch);
    }
}

// ---------- 8. ESTILOS DEL BUSCADOR ----------
const searchStyles = document.createElement('style');
searchStyles.textContent = `
    .search-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(255, 255, 255, 0.98);
        z-index: 10000;
        opacity: 0;
        visibility: hidden;
        transition: all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        backdrop-filter: blur(10px);
    }
    
    .search-overlay.active {
        opacity: 1;
        visibility: visible;
    }
    
    .search-container {
        max-width: 800px;
        margin: 80px auto 0;
        padding: 40px 20px;
    }
    
    .search-header {
        margin-bottom: 40px;
    }
    
    .search-form {
        position: relative;
        display: flex;
        align-items: center;
    }
    
    .search-icon {
        position: absolute;
        left: 20px;
        font-size: 1.2rem;
        color: #999;
    }
    
    .search-input {
        width: 100%;
        padding: 20px 60px;
        font-size: 1.5rem;
        border: none;
        border-bottom: 2px solid #eee;
        background: transparent;
        font-family: var(--font-sans);
        transition: all 0.3s;
    }
    
    .search-input:focus {
        outline: none;
        border-bottom-color: var(--color-accent);
    }
    
    .search-close {
        position: absolute;
        right: 20px;
        background: none;
        border: none;
        font-size: 1.2rem;
        cursor: pointer;
        color: #999;
        transition: all 0.3s;
    }
    
    .search-close:hover {
        color: #ff4444;
        transform: rotate(90deg);
    }
    
    .search-suggestions {
        animation: fadeIn 0.6s;
    }
    
    .suggestions-title {
        font-size: 0.9rem;
        color: #999;
        margin-bottom: 15px;
        text-transform: uppercase;
        letter-spacing: 2px;
    }
    
    .suggestions-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
    }
    
    .suggestion-tag {
        padding: 10px 24px;
        background: #f5f5f5;
        border-radius: 30px;
        font-size: 0.95rem;
        cursor: pointer;
        transition: all 0.3s;
    }
    
    .suggestion-tag:hover {
        background: var(--color-text-primary);
        color: white;
    }
    
    .search-results {
        margin-top: 30px;
    }
    
    .results-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 20px;
    }
    
    .result-item {
        display: flex;
        gap: 15px;
        padding: 15px;
        border-radius: 12px;
        cursor: pointer;
        transition: all 0.3s;
        background: #fafafa;
    }
    
    .result-item:hover {
        background: #f0f0f0;
        transform: translateY(-2px);
    }
    
    .result-image {
        width: 80px;
        height: 80px;
        overflow: hidden;
        border-radius: 8px;
    }
    
    .result-image img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }
    
    .result-info {
        flex: 1;
    }
    
    .result-info h4 {
        font-weight: 600;
        margin-bottom: 5px;
    }
    
    .result-category {
        font-size: 0.85rem;
        color: #999;
        margin-bottom: 5px;
    }
    
    .result-price {
        font-weight: 700;
        color: var(--color-text-primary);
    }
    
    .no-results {
        text-align: center;
        padding: 60px 0;
        color: #999;
    }
    
    .no-results i {
        font-size: 4rem;
        margin-bottom: 20px;
    }
    
    .no-results h3 {
        font-family: var(--font-serif);
        margin-bottom: 10px;
        color: var(--color-text-primary);
    }
    
    .view-all-results {
        text-align: center;
        margin-top: 30px;
        padding-top: 20px;
        border-top: 1px solid #eee;
    }
    
    .view-all-results a {
        color: var(--color-text-primary);
        font-weight: 600;
        text-decoration: none;
        transition: all 0.3s;
    }
    
    .view-all-results a:hover {
        color: var(--color-accent);
    }
    
    .view-all-results i {
        margin-left: 8px;
        transition: transform 0.3s;
    }
    
    .view-all-results a:hover i {
        transform: translateX(5px);
    }
    
    @media (max-width: 768px) {
        .search-container {
            margin-top: 40px;
        }
        
        .search-input {
            font-size: 1.2rem;
            padding: 15px 50px;
        }
        
        .results-grid {
            grid-template-columns: 1fr;
        }
    }
`;

document.head.appendChild(searchStyles);

// Inicializar
document.addEventListener('DOMContentLoaded', function() {
    initSearch();
    addSearchButton();
});

// Exportar funciones
window.toggleSearch = toggleSearch;
window.handleSearchSubmit = handleSearchSubmit;
window.searchTag = searchTag;
window.performSearch = performSearch;
