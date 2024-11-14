// scripts/pages/dashboard.js
import Auth from '../auth.js';

class DashboardPage {
    constructor() {
        this.products = [];
        this.filteredProducts = [];
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.currentProductId = null;
        this.init();
    }

    async init() {
        // Verificar autenticación
        const user = Auth.getCurrentUser();
        if (!user || user.role !== 'super_admin') {
            window.location.href = '../pages/login.html';
            return;
        }

        // Actualizar nombre de usuario
        document.getElementById('userName').textContent = user.name;

        // Setup event listeners
        this.setupEventListeners();

        // Cargar datos iniciales
        await Promise.all([
            this.loadStats(),
            this.loadProducts(),
            this.loadCategories()
        ]);
    }

    setupEventListeners() {
        // Búsqueda y filtros
        document.getElementById('searchInput')?.addEventListener('input', () => this.handleSearch());
        document.getElementById('categoryFilter')?.addEventListener('change', () => this.handleSearch());
        document.getElementById('statusFilter')?.addEventListener('change', () => this.handleSearch());

        // Botón agregar producto
        document.getElementById('addProductBtn')?.addEventListener('click', () => this.openAddModal());

        // Modal
        document.getElementById('saveProductBtn')?.addEventListener('click', () => this.handleSaveProduct());
        document.querySelector('.modal-close')?.addEventListener('click', () => this.closeModal());

        // Botón logout
        document.querySelector('.btn-danger')?.addEventListener('click', () => Auth.logout());
    }

    async loadStats() {
        try {
            const response = await fetch('http://localhost:3000/api/inventory/stats');
            const data = await response.json();
            
            if (data.success) {
                document.getElementById('totalProducts').textContent = data.data.totalProducts.toLocaleString();
                document.getElementById('lowStock').textContent = data.data.lowStock.toLocaleString();
                document.getElementById('categories').textContent = data.data.categories.toLocaleString();
            }
        } catch (error) {
            console.error('Error loading stats:', error);
            this.showError('Error al cargar estadísticas');
        }
    }

    async loadProducts() {
        try {
            const response = await fetch('http://localhost:3000/api/products');
            const data = await response.json();
            
            if (data.success) {
                this.products = data.data;
                this.filteredProducts = [...this.products];
                this.renderProducts();
                this.renderPagination();
            }
        } catch (error) {
            console.error('Error loading products:', error);
            this.showError('Error al cargar productos');
        }
    }

    async loadCategories() {
        try {
            const response = await fetch('http://localhost:3000/api/categories');
            const data = await response.json();
            
            if (data.success) {
                const categorySelects = ['categoryFilter', 'productCategory'];
                categorySelects.forEach(selectId => {
                    const select = document.getElementById(selectId);
                    if (select) {
                        select.innerHTML = `
                            <option value="">Todas las categorías</option>
                            ${data.data.map(category => `
                                <option value="${category.id}">${category.name}</option>
                            `).join('')}
                        `;
                    }
                });
            }
        } catch (error) {
            console.error('Error loading categories:', error);
            this.showError('Error al cargar categorías');
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

    async handleSaveProduct() {
        const form = document.getElementById('productForm');
        const formData = new FormData(form);
        const productData = Object.fromEntries(formData.entries());

        try {
            const url = this.currentProductId 
                ? `http://localhost:3000/api/products/${this.currentProductId}`
                : 'http://localhost:3000/api/products';
            
            const method = this.currentProductId ? 'PUT' : 'POST';
            
            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(productData)
            });

            const data = await response.json();

            if (data.success) {
                this.closeModal();
                await this.loadProducts();
                await this.loadStats();
                this.showSuccess(this.currentProductId ? 'Producto actualizado' : 'Producto creado');
            } else {
                throw new Error(data.error);
            }
        } catch (error) {
            console.error('Error saving product:', error);
            this.showError('Error al guardar el producto');
        }
    }

    async deleteProduct(id) {
        if (confirm('¿Está seguro de eliminar este producto?')) {
            try {
                const response = await fetch(`http://localhost:3000/api/products/${id}`, {
                    method: 'DELETE'
                });

                const data = await response.json();

                if (data.success) {
                    await this.loadProducts();
                    await this.loadStats();
                    this.showSuccess('Producto eliminado');
                } else {
                    throw new Error(data.error);
                }
            } catch (error) {
                console.error('Error deleting product:', error);
                this.showError('Error al eliminar el producto');
            }
        }
    }

    renderProducts() {
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const paginatedProducts = this.filteredProducts.slice(startIndex, endIndex);

        const tbody = document.getElementById('productsTableBody');
        if (!tbody) return;

        tbody.innerHTML = paginatedProducts.map(product => `
            <tr>
                <td>${product.id}</td>
                <td>${this.escapeHtml(product.name)}</td>
                <td>${this.escapeHtml(product.category_name || 'Sin categoría')}</td>
                <td>${product.quantity}</td>
                <td>${product.minimum_stock}</td>
                <td>
                    <span class="status-badge ${this.getStatusClass(product)}">
                        ${this.getStatusText(product)}
                    </span>
                </td>
                <td>${this.escapeHtml(product.location || '-')}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-icon" onclick="dashboardPage.editProduct(${product.id})">✏️</button>
                        <button class="btn btn-icon" onclick="dashboardPage.deleteProduct(${product.id})">🗑️</button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    renderPagination() {
        const totalPages = Math.ceil(this.filteredProducts.length / this.itemsPerPage);
        const pagination = document.getElementById('pagination');
        if (!pagination) return;

        let paginationHTML = '';

        if (totalPages > 1) {
            paginationHTML += `
                <button onclick="dashboardPage.changePage(1)" ${this.currentPage === 1 ? 'disabled' : ''}>
                    Primera
                </button>
                <button onclick="dashboardPage.changePage(${this.currentPage - 1})" 
                        ${this.currentPage === 1 ? 'disabled' : ''}>
                    Anterior
                </button>
            `;

            for (let i = 1; i <= totalPages; i++) {
                if (i === 1 || i === totalPages || (i >= this.currentPage - 2 && i <= this.currentPage + 2)) {
                    paginationHTML += `
                        <button onclick="dashboardPage.changePage(${i})" 
                                class="${i === this.currentPage ? 'active' : ''}">
                            ${i}
                        </button>
                    `;
                } else if (i === this.currentPage - 3 || i === this.currentPage + 3) {
                    paginationHTML += '<span>...</span>';
                }
            }

            paginationHTML += `
                <button onclick="dashboardPage.changePage(${this.currentPage + 1})"
                        ${this.currentPage === totalPages ? 'disabled' : ''}>
                    Siguiente
                </button>
                <button onclick="dashboardPage.changePage(${totalPages})"
                        ${this.currentPage === totalPages ? 'disabled' : ''}>
                    Última
                </button>
            `;
        }

        pagination.innerHTML = paginationHTML;
    }

    openAddModal() {
        this.currentProductId = null;
        document.getElementById('modalTitle').textContent = 'Agregar Producto';
        document.getElementById('productForm').reset();
        this.openModal();
    }

    async editProduct(id) {
        try {
            const response = await fetch(`http://localhost:3000/api/products/${id}`);
            const data = await response.json();

            if (data.success) {
                this.currentProductId = id;
                document.getElementById('modalTitle').textContent = 'Editar Producto';
                
                const form = document.getElementById('productForm');
                Object.keys(data.data).forEach(key => {
                    const input = form.elements[key];
                    if (input) {
                        input.value = data.data[key];
                    }
                });

                this.openModal();
            }
        } catch (error) {
            console.error('Error loading product:', error);
            this.showError('Error al cargar el producto');
        }
    }

    openModal() {
        document.getElementById('productModal').style.display = 'flex';
    }

    closeModal() {
        document.getElementById('productModal').style.display = 'none';
        document.getElementById('productForm').reset();
        this.currentProductId = null;
    }

    getProductStatus(product) {
        if (product.quantity <= 0) return 'out_stock';
        if (product.quantity < product.minimum_stock) return 'low_stock';
        return 'in_stock';
    }

    getStatusClass(product) {
        if (product.quantity <= 0) return 'status-out-stock';
        if (product.quantity < product.minimum_stock) return 'status-low-stock';
        return 'status-in-stock';
    }

    getStatusText(product) {
        if (product.quantity <= 0) return 'Sin Stock';
        if (product.quantity < product.minimum_stock) return 'Stock Bajo';
        return 'En Stock';
    }

    escapeHtml(unsafe) {
        if (!unsafe) return '';
        return unsafe
            .toString()
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    showError(message) {
        alert(message); // Reemplazar con un sistema de notificaciones mejor
    }

    showSuccess(message) {
        alert(message); // Reemplazar con un sistema de notificaciones mejor
    }

    changePage(page) {
        this.currentPage = page;
        this.renderProducts();
        this.renderPagination();
    }
}

// Inicializar la página cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.dashboardPage = new DashboardPage();
});

export default DashboardPage;