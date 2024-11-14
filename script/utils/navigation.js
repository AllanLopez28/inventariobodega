// scripts/utils/navigation.js
const Navigation = {
    routes: {
        login: '/pages/login.html',
        inventory: '/pages/inventory.html',
        users: '/pages/users.html',
        reports: '/pages/reports.html'
    },

    getCurrentPage() {
        return window.location.pathname;
    },

    isAuthenticated() {
        return sessionStorage.getItem('token') !== null;
    },

    requireAuth(allowedRoles = []) {
        if (!this.isAuthenticated()) {
            this.redirectToLogin();
            return false;
        }

        if (allowedRoles.length > 0) {
            const user = JSON.parse(sessionStorage.getItem('user'));
            if (!allowedRoles.includes(user.role)) {
                this.redirectToUnauthorized();
                return false;
            }
        }

        return true;
    },

    redirectToLogin() {
        window.location.href = this.routes.login;
    },

    redirectToHome() {
        window.location.href = this.routes.inventory;
    },

    redirectToUnauthorized() {
        this.redirectToHome();
    },

    setupNavigation() {
        const currentPage = this.getCurrentPage();
        
        // Si no está autenticado y no está en login, redirigir a login
        if (!this.isAuthenticated() && currentPage !== this.routes.login) {
            this.redirectToLogin();
            return;
        }

        // Solo redirigir si está en login
        if (this.isAuthenticated() && currentPage === this.routes.login) {
            this.redirectToHome();
            return;
        }
    }
};

export default Navigation;