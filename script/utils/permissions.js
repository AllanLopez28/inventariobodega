// scripts/utils/permissions.js
import { PERMISSIONS } from './constants.js';
import Auth from '../auth.js';

class PermissionsManager {
    static hasPermission(permission) {
        return Auth.hasPermission(permission);
    }

    static updateUIBasedOnPermissions() {
        // Ocultar/mostrar elementos basados en permisos
        document.querySelectorAll('[data-permission]').forEach(element => {
            const permission = element.dataset.permission;
            if (!this.hasPermission(permission)) {
                element.style.display = 'none';
            } else {
                element.style.display = '';
            }
        });

        // Actualizar menú de navegación
        this.updateNavigationMenu();

        // Actualizar botones de acción en tablas
        this.updateActionButtons();
    }

    static updateNavigationMenu() {
        const menuItems = document.querySelectorAll('.nav-link');
        menuItems.forEach(item => {
            const permission = item.dataset.permission;
            if (permission && !this.hasPermission(permission)) {
                const parentElement = item.parentElement;
                if (parentElement && parentElement.tagName === 'LI') {
                    parentElement.style.display = 'none';
                } else {
                    item.style.display = 'none';
                }
            }
        });
    }

    static updateActionButtons() {
        const actionCells = document.querySelectorAll('.actions-cell');
        actionCells.forEach(cell => {
            const buttons = cell.querySelectorAll('button');
            buttons.forEach(button => {
                const permission = button.dataset.permission;
                if (permission && !this.hasPermission(permission)) {
                    button.style.display = 'none';
                }
            });
        });
    }

    static setupActionButtons(item, permissions = {}) {
        const actions = document.createElement('td');
        actions.className = 'actions-cell';
        
        // Estructura básica de permisos para acciones
        const defaultPermissions = {
            view: 'VIEW_INVENTORY',
            edit: 'EDIT_PRODUCT',
            delete: 'DELETE_PRODUCT'
        };

        // Combinar permisos predeterminados con los proporcionados
        const finalPermissions = { ...defaultPermissions, ...permissions };

        // Botón de Ver (si tiene permiso)
        if (this.hasPermission(finalPermissions.view)) {
            const viewButton = this.createActionButton('view', '👁️', 'Ver detalles', item.id);
            actions.appendChild(viewButton);
        }

        // Botón de Editar (si tiene permiso)
        if (this.hasPermission(finalPermissions.edit)) {
            const editButton = this.createActionButton('edit', '✏️', 'Editar', item.id);
            actions.appendChild(editButton);
        }

        // Botón de Eliminar (si tiene permiso)
        if (this.hasPermission(finalPermissions.delete)) {
            const deleteButton = this.createActionButton('delete', '🗑️', 'Eliminar', item.id);
            actions.appendChild(deleteButton);
        }

        return actions;
    }

    static createActionButton(action, icon, title, itemId) {
        const button = document.createElement('button');
        button.className = `btn btn-icon btn-${action}`;
        button.title = title;
        button.innerHTML = icon;
        button.onclick = () => this.handleActionClick(action, itemId);
        return button;
    }

    static handleActionClick(action, itemId) {
        switch (action) {
            case 'view':
                if (typeof window.viewItem === 'function') {
                    window.viewItem(itemId);
                }
                break;
            case 'edit':
                if (typeof window.editItem === 'function') {
                    window.editItem(itemId);
                }
                break;
            case 'delete':
                if (typeof window.deleteItem === 'function') {
                    if (confirm('¿Está seguro de eliminar este elemento?')) {
                        window.deleteItem(itemId);
                    }
                }
                break;
        }
    }

    static initializePagePermissions() {
        const currentPath = window.location.pathname;
        let requiredPermission;

        // Determinar el permiso requerido según la página actual
        switch (true) {
            case currentPath.includes('inventory.html'):
                requiredPermission = 'VIEW_INVENTORY';
                break;
            case currentPath.includes('reports.html'):
                requiredPermission = 'VIEW_REPORTS';
                break;
            case currentPath.includes('users.html'):
                requiredPermission = 'MANAGE_USERS';
                break;
            default:
                // Para páginas sin restricciones específicas
                return true;
        }

        // Verificar el permiso requerido
        if (!this.hasPermission(requiredPermission)) {
            // Redirigir al usuario a una página autorizada
            this.redirectToAuthorizedPage();
            return false;
        }

        return true;
    }

    static redirectToAuthorizedPage() {
        const user = Auth.getCurrentUser();
        if (!user) {
            window.location.href = '/pages/login.html';
            return;
        }

        // Redirigir según el rol del usuario
        switch (user.role) {
            case 'super_admin':
                window.location.href = '/pages/inventory.html';
                break;
            case 'admin':
            case 'user':
                window.location.href = '/pages/inventory.html';
                break;
            default:
                window.location.href = '/pages/login.html';
        }
    }

    static updateFormFields() {
        // Deshabilitar campos de formulario según permisos
        document.querySelectorAll('[data-permission-required]').forEach(field => {
            const requiredPermission = field.dataset.permissionRequired;
            if (!this.hasPermission(requiredPermission)) {
                field.disabled = true;
                field.readOnly = true;
                // Agregar clase visual para campos deshabilitados
                field.classList.add('disabled-field');
            }
        });
    }

    static showPermissionDeniedMessage() {
        // Mostrar mensaje de permiso denegado
        const messageDiv = document.createElement('div');
        messageDiv.className = 'alert alert-danger';
        messageDiv.textContent = 'No tiene permisos para realizar esta acción';
        
        // Insertar mensaje al inicio del contenido principal
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            mainContent.insertBefore(messageDiv, mainContent.firstChild);
            
            // Remover mensaje después de 3 segundos
            setTimeout(() => {
                messageDiv.remove();
            }, 3000);
        }
    }
}

export default PermissionsManager;