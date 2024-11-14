// scripts/main.js
import Navigation from './utils/navigation.js';

class App {
    constructor() {
        this.initializeApp();
    }

    initializeApp() {
        // Verificar autenticación y navegación
        Navigation.setupNavigation();

        // Si el usuario está autenticado, configurar la interfaz
        if (Navigation.isAuthenticated()) {
            this.setupUI();
        }
    }

    setupUI() {
        // Configurar menú según el rol del usuario
        const user = JSON.parse(sessionStorage.getItem('user'));
        this.setupMenu(user.role);

        // Configurar eventos de la interfaz
        this.setupEventListeners();
    }

    setupMenu(role) {
        const menuItems = document.getElementById('menuItems');
        if (!menuItems) return;

        const menu = this.getMenuByRole(role);
        menuItems.innerHTML = menu.map(item => `
            <li>
                <a href="${item.url}" class="menu-item">
                    <span class="menu-icon">${item.icon}</span>
                    ${item.label}
                </a>
            </li>
        `).join('');
    }

    getMenuByRole(role) {
        const baseMenu = [
            { url: '/pages/inventory.html', label: 'Inventario', icon: '📦' }
        ];

        if (role === 'super_admin') {
            return [
                { url: '/pages/dashboard.html', label: 'Dashboard', icon: '📊' },
                ...baseMenu,
                { url: '/pages/users.html', label: 'Usuarios', icon: '👥' },
                { url: '/pages/reports.html', label: 'Reportes', icon: '📈' }
            ];
        }

        if (role === 'admin') {
            return [
                ...baseMenu,
                { url: '/pages/reports.html', label: 'Reportes', icon: '📈' }
            ];
        }

        return baseMenu;
    }

    setupEventListeners() {
        // Manejar cierre de sesión
        const logoutBtn = document.querySelector('.btn-danger');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                sessionStorage.clear();
                Navigation.redirectToLogin();
            });
        }

        // Otros eventos globales aquí
    }
}

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    new App();
});