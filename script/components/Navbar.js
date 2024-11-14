// scripts/components/Navbar.js
class Navbar {
    constructor() {
        this.user = JSON.parse(sessionStorage.getItem('user'));
    }

    render() {
        const navbar = document.createElement('nav');
        navbar.className = 'navbar';
        
        navbar.innerHTML = `
            <div class="navbar-content">
                <div class="navbar-brand">
                    <h1>Sistema de Inventario</h1>
                </div>
                <div class="navbar-menu">
                    ${this.getMenuItems()}
                </div>
                <div class="navbar-user">
                    <span class="user-name">${this.user?.name || 'Usuario'}</span>
                    <button class="btn btn-sm btn-danger" id="logoutBtn">
                        Cerrar Sesión
                    </button>
                </div>
            </div>
        `;

        // Agregar evento de cierre de sesión
        const logoutBtn = navbar.querySelector('#logoutBtn');
        logoutBtn.addEventListener('click', () => this.handleLogout());

        return navbar;
    }

    getMenuItems() {
        const role = this.user?.role;
        const menuItems = [];

        // Menú base para todos los usuarios
        menuItems.push('<a href="/pages/inventory.html" class="nav-link">Inventario</a>');

        // Menú específico por rol
        if (role === 'super_admin' || role === 'admin') {
            menuItems.push('<a href="/pages/reports.html" class="nav-link">Reportes</a>');
        }

        if (role === 'super_admin') {
            menuItems.push('<a href="/pages/users.html" class="nav-link">Usuarios</a>');
            menuItems.push('<a href="/pages/users.html" class="nav-link">Configuración</a>');
        }

        return `<div class="nav-links">${menuItems.join('')}</div>`;
    }

    handleLogout() {
        sessionStorage.clear();
        window.location.href = '/pages/login.html';
    }
}

export default Navbar;