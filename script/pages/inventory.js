// scripts/pages/inventory.js
import Auth from '../auth.js';
import PermissionsManager from '../utils/permissions.js';
import { API_URL, PERMISSIONS } from '../utils/constants.js';
import Navbar from '../components/Navbar.js';

class InventoryPage {
    constructor() {
        this.products = [];
        this.filteredProducts = [];
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.currentProductId = null;
        this.init();
    }

    async init() {
        try {
            // Verificar autenticación y permisos
            if (!Auth.isAuthenticated()) {
                window.location.href = '/pages/login.html';
                return;
            }

            // Verificar permiso específico para inventario
            if (!Auth.hasPermission('VIEW_INVENTORY')) {
                PermissionsManager.redirectToAuthorizedPage();
                return;
            }

            // Inicializar Navbar
            this.initializeNavbar();

            // Actualizar UI basada en permisos
            this.setupUIBasedOnPermissions();

            // Configurar event listeners
            this.setupEventListeners();

            // Cargar datos iniciales
            await Promise.all([
                this.loadStats(),
                this.loadProducts(),
                this.loadCategories()
            ]);

            // Actualizar UI basada en permisos después de cargar datos
            PermissionsManager.updateUIBasedOnPermissions();

        } catch (error) {
            console.error('Error initializing inventory page:', error);
            this.showError('Error al inicializar la página');
        }
    }

    initializeNavbar() {
        const navbar = new Navbar();
        const navbarContainer = document.getElementById('navbar-container');
        if (navbarContainer) {
            navbarContainer.replaceChildren(navbar.render());
        }
    }
    setupUIBasedOnPermissions() {
        // Configurar visibilidad del botón de agregar producto
        const addProductBtn = document.getElementById('addProductBtn');
        if (addProductBtn) {
            addProductBtn.style.display = Auth.hasPermission('ADD_PRODUCT') ? '' : 'none';
        }

        // Configurar visibilidad de acciones en la tabla
        const actionHeaders = document.querySelectorAll('.action-header');
        actionHeaders.forEach(header => {
            header.style.display = Auth.hasPermission('EDIT_PRODUCT') || 
                                 Auth.hasPermission('DELETE_PRODUCT') ? '' : 'none';
        });
    }

    setupEventListeners() {
        // Búsqueda
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', () => this.handleSearch());
        }

        // Filtros
        const categoryFilter = document.getElementById('categoryFilter');
        if (categoryFilter) {
            categoryFilter.addEventListener('change', () => this.handleSearch());
        }

        const statusFilter = document.getElementById('statusFilter');
        if (statusFilter) {
            statusFilter.addEventListener('change', () => this.handleSearch());
        }

        // Botón de agregar producto
        const addProductBtn = document.getElementById('addProductBtn');
        if (addProductBtn && Auth.hasPermission('ADD_PRODUCT')) {
            addProductBtn.addEventListener('click', () => this.openAddModal());
        }

        // Modal de producto
        document.querySelector('.modal-close')?.addEventListener('click', () => this.closeModal());
        document.getElementById('saveProductBtn')?.addEventListener('click', () => this.handleSaveProduct());
        document.getElementById('cancelProductBtn')?.addEventListener('click', () => this.closeModal());

        // Modal de eliminación
        document.getElementById('confirmDeleteBtn')?.addEventListener('click', () => this.confirmDelete());

        // Formulario de producto
        const productForm = document.getElementById('productForm');
        if (productForm) {
            productForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleSaveProduct();
            });
        }

        // Logout
        const logoutBtn = document.querySelector('.btn-danger');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => Auth.logout());
        }
    }

    handleSearch() {
        const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
        const categoryId = document.getElementById('categoryFilter')?.value || '';
        const status = document.getElementById('statusFilter')?.value || '';

        this.filteredProducts = this.products.filter(product => {
            const matchesSearch = product.name.toLowerCase().includes(searchTerm) ||
                                product.location?.toLowerCase().includes(searchTerm);
            const matchesCategory = !categoryId || product.category_id === parseInt(categoryId);
            const matchesStatus = !status || this.getProductStatus(product) === status;

            return matchesSearch && matchesCategory && matchesStatus;
        });

        this.currentPage = 1;
        this.renderProducts();
        this.renderPagination();
    }

    getProductStatus(product) {
        if (product.quantity <= 0) return 'out_stock';
        if (product.quantity < product.minimum_stock) return 'low_stock';
        return 'in_stock';
    }

    getStatusClass(product) {
        const status = this.getProductStatus(product);
        const statusClasses = {
            'out_stock': 'danger',
            'low_stock': 'warning',
            'in_stock': 'success'
        };
        return statusClasses[status] || 'default';
    }

    getStatusText(product) {
        const status = this.getProductStatus(product);
        const statusTexts = {
            'out_stock': 'Sin Stock',
            'low_stock': 'Stock Bajo',
            'in_stock': 'En Stock'
        };
        return statusTexts[status] || 'Desconocido';
    }
    async loadStats() {
        try {
            const token = sessionStorage.getItem('token');
            const response = await fetch(`${API_URL}/api/inventory/stats`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            
            if (data.success) {
                document.getElementById('totalProducts').textContent = data.data.totalProducts.toLocaleString();
                document.getElementById('lowStock').textContent = data.data.lowStock.toLocaleString();
                document.getElementById('categories').textContent = data.data.categories.toLocaleString();
            } else {
                throw new Error(data.error || 'Error al cargar estadísticas');
            }
        } catch (error) {
            console.error('Error loading stats:', error);
            this.showError('Error al cargar estadísticas');
        }
    }

    async loadProducts() {
        try {
            const token = sessionStorage.getItem('token');
            const response = await fetch(`${API_URL}/api/products`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            
            if (data.success) {
                this.products = data.data;
                this.filteredProducts = [...this.products];
                this.renderProducts();
                this.renderPagination();
            } else {
                throw new Error(data.error || 'Error al cargar productos');
            }
        } catch (error) {
            console.error('Error loading products:', error);
            this.showError('Error al cargar productos');
        }
    }

    async loadCategories() {
        try {
            const token = sessionStorage.getItem('token');
            const response = await fetch(`${API_URL}/api/categories`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            
            if (data.success) {
                // Actualizar select de filtro de categorías
                const categoryFilter = document.getElementById('categoryFilter');
                const productCategory = document.getElementById('productCategory');
                
                const categoriesHtml = data.data.map(category => 
                    `<option value="${category.id}">${this.escapeHtml(category.name)}</option>`
                ).join('');

                if (categoryFilter) {
                    categoryFilter.innerHTML = `
                        <option value="">Todas las categorías</option>
                        ${categoriesHtml}
                    `;
                }

                if (productCategory) {
                    productCategory.innerHTML = `
                        <option value="">Seleccione una categoría</option>
                        ${categoriesHtml}
                    `;
                }
            } else {
                throw new Error(data.error || 'Error al cargar categorías');
            }
        } catch (error) {
            console.error('Error loading categories:', error);
            this.showError('Error al cargar categorías');
        }
    }

    escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    showError(message) {
        const alertDiv = document.createElement('div');
        alertDiv.className = 'alert alert-danger';
        alertDiv.textContent = message;
        
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            mainContent.insertBefore(alertDiv, mainContent.firstChild);
            setTimeout(() => alertDiv.remove(), 3000);
        }
    }

    showSuccess(message) {
        const alertDiv = document.createElement('div');
        alertDiv.className = 'alert alert-success';
        alertDiv.textContent = message;
        
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            mainContent.insertBefore(alertDiv, mainContent.firstChild);
            setTimeout(() => alertDiv.remove(), 3000);
        }
    }
    openAddModal() {
        if (!Auth.hasPermission('ADD_PRODUCT')) {
            this.showError('No tiene permisos para agregar productos');
            return;
        }

        this.currentProductId = null;
        document.getElementById('modalTitle').textContent = 'Agregar Producto';
        document.getElementById('productForm').reset();
        document.getElementById('productModal').style.display = 'block';
    }

    async openEditModal(productId) {
        if (!Auth.hasPermission('EDIT_PRODUCT')) {
            this.showError('No tiene permisos para editar productos');
            return;
        }

        try {
            const token = sessionStorage.getItem('token');
            const response = await fetch(`${API_URL}/api/products/${productId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (data.success) {
                this.currentProductId = productId;
                document.getElementById('modalTitle').textContent = 'Editar Producto';

                const form = document.getElementById('productForm');
                if (form) {
                    form.name.value = data.data.name;
                    form.category_id.value = data.data.category_id;
                    form.quantity.value = data.data.quantity;
                    form.minimum_stock.value = data.data.minimum_stock;
                    form.location.value = data.data.location || '';
                    form.description.value = data.data.description || '';
                }

                document.getElementById('productModal').style.display = 'block';
            }
        } catch (error) {
            console.error('Error loading product:', error);
            this.showError('Error al cargar el producto');
        }
    }

    async openViewModal(productId) {
        try {
            const token = sessionStorage.getItem('token');
            const response = await fetch(`${API_URL}/api/products/${productId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (data.success) {
                const productDetails = document.getElementById('productDetails');
                if (productDetails) {
                    productDetails.innerHTML = `
                        <div class="product-details">
                            <p><strong>Nombre:</strong> ${this.escapeHtml(data.data.name)}</p>
                            <p><strong>Categoría:</strong> ${this.escapeHtml(data.data.category_name)}</p>
                            <p><strong>Cantidad:</strong> ${data.data.quantity}</p>
                            <p><strong>Stock Mínimo:</strong> ${data.data.minimum_stock}</p>
                            <p><strong>Ubicación:</strong> ${this.escapeHtml(data.data.location || '-')}</p>
                            <p><strong>Descripción:</strong> ${this.escapeHtml(data.data.description || '-')}</p>
                            <p><strong>Estado:</strong> <span class="badge badge-${this.getStatusClass(data.data)}">${this.getStatusText(data.data)}</span></p>
                        </div>
                    `;
                }

                document.getElementById('viewProductModal').style.display = 'block';
            }
        } catch (error) {
            console.error('Error loading product details:', error);
            this.showError('Error al cargar los detalles del producto');
        }
    }

    closeModal() {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => modal.style.display = 'none');
        this.currentProductId = null;
    }

    async handleSaveProduct() {
        if (!Auth.hasPermission('ADD_PRODUCT') && !Auth.hasPermission('EDIT_PRODUCT')) {
            this.showError('No tiene permisos para realizar esta acción');
            return;
        }

        const form = document.getElementById('productForm');
        if (!form) return;

        const formData = new FormData(form);
        const productData = Object.fromEntries(formData.entries());

        if (!this.validateProductData(productData)) return;

        try {
            const token = sessionStorage.getItem('token');
            const url = this.currentProductId 
                ? `${API_URL}/api/products/${this.currentProductId}`
                : `${API_URL}/api/products`;
            
            const method = this.currentProductId ? 'PUT' : 'POST';
            
            const response = await fetch(url, {
                method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(productData)
            });

            const data = await response.json();

            if (data.success) {
                this.closeModal();
                await this.loadProducts();
                this.showSuccess(this.currentProductId ? 'Producto actualizado' : 'Producto agregado');
            } else {
                throw new Error(data.error || 'Error al guardar el producto');
            }
        } catch (error) {
            console.error('Error saving product:', error);
            this.showError(error.message || 'Error al guardar el producto');
        }
    }

    validateProductData(productData) {
        if (!productData.name?.trim()) {
            this.showError('El nombre del producto es requerido');
            return false;
        }

        if (!productData.category_id) {
            this.showError('Debe seleccionar una categoría');
            return false;
        }

        if (productData.quantity < 0) {
            this.showError('La cantidad no puede ser negativa');
            return false;
        }

        if (productData.minimum_stock < 0) {
            this.showError('El stock mínimo no puede ser negativo');
            return false;
        }

        return true;
    }

    openDeleteModal(productId) {
        if (!Auth.hasPermission('DELETE_PRODUCT')) {
            this.showError('No tiene permisos para eliminar productos');
            return;
        }

        this.currentProductId = productId;
        document.getElementById('deleteConfirmModal').style.display = 'block';
    }

    async confirmDelete() {
        if (!this.currentProductId || !Auth.hasPermission('DELETE_PRODUCT')) {
            return;
        }

        try {
            const token = sessionStorage.getItem('token');
            const response = await fetch(`${API_URL}/api/products/${this.currentProductId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (data.success) {
                this.closeModal();
                await this.loadProducts();
                this.showSuccess('Producto eliminado exitosamente');
            } else {
                throw new Error(data.error || 'Error al eliminar el producto');
            }
        } catch (error) {
            console.error('Error deleting product:', error);
            this.showError(error.message || 'Error al eliminar el producto');
        }
    }
    renderProducts() {
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const paginatedProducts = this.filteredProducts.slice(startIndex, endIndex);

        const tbody = document.getElementById('inventoryTableBody');
        if (tbody) {
            tbody.innerHTML = paginatedProducts.map(product => `
                <tr>
                    <td>${product.id}</td>
                    <td>${this.escapeHtml(product.name)}</td>
                    <td>${this.escapeHtml(product.category_name || 'Sin categoría')}</td>
                    <td>${product.quantity}</td>
                    <td>
                        <span class="status-badge ${this.getStatusClass(product)}">
                            ${this.getStatusText(product)}
                        </span>
                    </td>
                    <td>${this.escapeHtml(product.location || '-')}</td>
                    <td class="actions-cell">
                        ${this.renderActionButtons(product)}
                    </td>
                </tr>
            `).join('');
        }
    }

    renderActionButtons(product) {
        let buttons = `
            <button class="btn btn-icon" title="Ver detalles" onclick="window.inventoryPage.openViewModal(${product.id})">
                👁️
            </button>
        `;

        if (Auth.hasPermission('EDIT_PRODUCT')) {
            buttons += `
                <button class="btn btn-icon" title="Editar" onclick="window.inventoryPage.openEditModal(${product.id})">
                    ✏️
                </button>
            `;
        }

        if (Auth.hasPermission('DELETE_PRODUCT')) {
            buttons += `
                <button class="btn btn-icon" title="Eliminar" onclick="window.inventoryPage.openDeleteModal(${product.id})">
                    🗑️
                </button>
            `;
        }

        return buttons;
    }

    renderPagination() {
        const totalPages = Math.ceil(this.filteredProducts.length / this.itemsPerPage);
        const pagination = document.getElementById('pagination');
        
        let paginationHTML = '';
        
        if (totalPages > 1) {
            paginationHTML += `
                <button onclick="window.inventoryPage.changePage(1)" ${this.currentPage === 1 ? 'disabled' : ''}>
                    Primera
                </button>
                <button onclick="window.inventoryPage.changePage(${this.currentPage - 1})" ${this.currentPage === 1 ? 'disabled' : ''}>
                    Anterior
                </button>
            `;

            for (let i = 1; i <= totalPages; i++) {
                if (i === 1 || i === totalPages || (i >= this.currentPage - 2 && i <= this.currentPage + 2)) {
                    paginationHTML += `
                        <button onclick="window.inventoryPage.changePage(${i})" 
                                class="${i === this.currentPage ? 'active' : ''}">
                            ${i}
                        </button>
                    `;
                } else if (i === this.currentPage - 3 || i === this.currentPage + 3) {
                    paginationHTML += '<span>...</span>';
                }
            }

            paginationHTML += `
                <button onclick="window.inventoryPage.changePage(${this.currentPage + 1})" ${this.currentPage === totalPages ? 'disabled' : ''}>
                    Siguiente
                </button>
                <button onclick="window.inventoryPage.changePage(${totalPages})" ${this.currentPage === totalPages ? 'disabled' : ''}>
                    Última
                </button>
            `;
        }

        if (pagination) {
            pagination.innerHTML = paginationHTML;
        }
    }

    changePage(page) {
        this.currentPage = page;
        this.renderProducts();
        this.renderPagination();
    }
}

// Hacer métodos disponibles globalmente para los botones de acción
window.inventoryPage = {
    openViewModal: (id) => window.inventoryPage?.openViewModal(id),
    openEditModal: (id) => window.inventoryPage?.openEditModal(id),
    openDeleteModal: (id) => window.inventoryPage?.openDeleteModal(id),
    changePage: (page) => window.inventoryPage?.changePage(page)
};

// Inicializar la página cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.inventoryPage = new InventoryPage();
});

export default InventoryPage;