// scripts/auth.js
import { PERMISSIONS, DEFAULT_ROUTES } from './utils/constants.js';

const Auth = {
    login: function(authData) {
        // Guardar datos de autenticación
        sessionStorage.setItem('token', authData.token);
        sessionStorage.setItem('user', JSON.stringify(authData.user));
    },

    isAuthenticated: function() {
        return sessionStorage.getItem('token') !== null;
    },

    getCurrentUser: function() {
        try {
            const userStr = sessionStorage.getItem('user');
            return userStr ? JSON.parse(userStr) : null;
        } catch (error) {
            console.error('Error parsing user data:', error);
            return null;
        }
    },

    hasPermission: function(permission) {
        const user = this.getCurrentUser();
        if (!user) return false;

        // Verificar si el permiso existe en PERMISSIONS
        const permittedRoles = PERMISSIONS[permission];
        if (!permittedRoles) return false;

        // Verificar si el rol del usuario está en los roles permitidos
        return permittedRoles.includes(user.role);
    },

    hasRole: function(requiredRole) {
        const user = this.getCurrentUser();
        if (!user) return false;

        const roleHierarchy = {
            'super_admin': 3,
            'admin': 2,
            'user': 1
        };

        const userRoleLevel = roleHierarchy[user.role];
        const requiredRoleLevel = roleHierarchy[requiredRole];

        // Retorna true si el nivel del rol del usuario es mayor o igual al requerido
        return userRoleLevel >= requiredRoleLevel;
    },

    getDefaultRoute: function() {
        const user = this.getCurrentUser();
        if (!user) return '/pages/login.html';
        return DEFAULT_ROUTES[user.role] || '/pages/inventory.html';
    },

    redirectToDefaultRoute: function() {
        window.location.href = this.getDefaultRoute();
    },

    verifyAccess: function(requiredPermission) {
        if (!this.isAuthenticated()) {
            window.location.href = '/pages/login.html';
            return false;
        }

        if (requiredPermission && !this.hasPermission(requiredPermission)) {
            this.redirectToDefaultRoute();
            return false;
        }

        return true;
    },

    logout: function() {
        try {
            // Limpiar datos de sesión
            sessionStorage.removeItem('token');
            sessionStorage.removeItem('user');
            
            // Redirigir a login
            window.location.href = '/pages/login.html';
        } catch (error) {
            console.error('Error during logout:', error);
            // Asegurar que el usuario sea redirigido incluso si hay un error
            window.location.href = '/pages/login.html';
        }
    },

    // Método para verificar token
    verifyToken: async function() {
        try {
            const token = sessionStorage.getItem('token');
            if (!token) return false;

            const response = await fetch('http://localhost:3000/auth/verify', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();
            return data.success;
        } catch (error) {
            console.error('Error verifying token:', error);
            return false;
        }
    },

    // Método para refrescar datos del usuario
    refreshUserData: async function() {
        try {
            const token = sessionStorage.getItem('token');
            if (!token) return false;

            const response = await fetch('http://localhost:3000/auth/me', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();
            if (data.success) {
                sessionStorage.setItem('user', JSON.stringify(data.data));
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error refreshing user data:', error);
            return false;
        }
    },

    // Método para verificar si una ruta es accesible
    canAccessRoute: function(route) {
        const routePermissions = {
            '/pages/inventory.html': 'VIEW_INVENTORY',
            '/pages/reports.html': 'VIEW_REPORTS',
            '/pages/users.html': 'MANAGE_USERS',
            '/pages/index.html': 'VIEW_INVENTORY' // Dashboard requiere al menos poder ver inventario
        };

        const requiredPermission = routePermissions[route];
        if (!requiredPermission) return true; // Si la ruta no tiene permiso definido, se permite
        
        return this.hasPermission(requiredPermission);
    },

    // Método para manejar errores de autenticación
    handleAuthError: function(error) {
        console.error('Authentication error:', error);
        this.logout();
        return false;
    }
};

export default Auth;