// scripts/pages/index.js
import API from '../utils/api.js';
import Auth from '../auth.js';
import Alert from '../components/Alert.js';

class DashboardPage {
    constructor() {
        this.init();
    }

    async init() {
        // Verificar autenticación
        if (!Auth.isAuthenticated()) {
            window.location.href = '../../pages/login.html';
            return;
        }

        // Cargar datos del usuario
        const user = Auth.getCurrentUser();
        this.updateUserInfo(user);

        // Cargar datos del dashboard
        await this.loadDashboardData();
    }

    updateUserInfo(user) {
        const userNameElement = document.getElementById('userName');
        if (userNameElement) {
            userNameElement.textContent = user.name;
        }
    }

    async loadDashboardData() {
        try {
            // Cargar todo en paralelo
            const [stats, lowStockProducts, recentActivity] = await Promise.all([
                API.dashboard.getStats(),
                API.products.getLowStock(),
                API.dashboard.getRecentActivity()
            ]);

            this.updateStats(stats);
            this.updateLowStockTable(lowStockProducts);
            this.updateActivityFeed(recentActivity);
        } catch (error) {
            Alert.error('Error al cargar los datos del dashboard');
            console.error('Error loading dashboard:', error);
        }
    }

    updateStats(stats) {
        const elements = {
            totalProducts: document.getElementById('totalProducts'),
            lowStock: document.getElementById('lowStock'),
            totalCategories: document.getElementById('totalCategories')
        };

        // Actualizar cada estadística si existe el elemento
        Object.entries(elements).forEach(([key, element]) => {
            if (element && stats[key] !== undefined) {
                element.textContent = stats[key].toLocaleString();
            }
        });
    }

    updateLowStockTable(products) {
        const tableBody = document.getElementById('lowStockTableBody');
        if (!tableBody) return;

        tableBody.innerHTML = products.map(product => `
            <tr>
                <td>${this.escapeHtml(product.name)}</td>
                <td>${product.quantity}</td>
                <td>${product.minimum_stock}</td>
                <td>${this.escapeHtml(product.category_name || 'Sin categoría')}</td>
                <td>
                    <span class="status-badge ${this.getStockStatusClass(product)}">
                        ${this.getStockStatusText(product)}
                    </span>
                </td>
            </tr>
        `).join('');
    }

    updateActivityFeed(activities) {
        const feedContainer = document.getElementById('activityFeed');
        if (!feedContainer) return;

        feedContainer.innerHTML = activities.map(activity => `
            <div class="activity-item">
                <div class="activity-icon ${this.getActivityTypeClass(activity.type)}">
                    ${this.getActivityIcon(activity.type)}
                </div>
                <div class="activity-content">
                    <p class="activity-text">${this.escapeHtml(activity.description)}</p>
                    <small class="activity-time">
                        ${this.formatDate(activity.created_at)}
                        ${activity.user_name ? `por ${this.escapeHtml(activity.user_name)}` : ''}
                    </small>
                </div>
            </div>
        `).join('');
    }

    // Métodos auxiliares
    escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    getStockStatusClass(product) {
        const ratio = product.quantity / product.minimum_stock;
        if (ratio <= 0.5) return 'danger';
        if (ratio <= 0.75) return 'warning';
        return 'success';
    }

    getStockStatusText(product) {
        const ratio = product.quantity / product.minimum_stock;
        if (ratio <= 0.5) return 'Crítico';
        if (ratio <= 0.75) return 'Bajo';
        return 'Normal';
    }

    getActivityTypeClass(type) {
        const classes = {
            create: 'activity-create',
            update: 'activity-update',
            delete: 'activity-delete',
            login: 'activity-login'
        };
        return classes[type] || 'activity-default';
    }

    getActivityIcon(type) {
        const icons = {
            create: '➕',
            update: '🔄',
            delete: '❌',
            login: '👤'
        };
        return icons[type] || '📝';
    }

    formatDate(dateString) {
        return new Date(dateString).toLocaleString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    new DashboardPage();
});

export default DashboardPage;