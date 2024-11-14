// scripts/pages/login.js
import Validator from '../utils/validators.js';
import Auth from '../auth.js';

class LoginPage {
    constructor() {
        this.form = document.getElementById('loginForm');
        this.setupEventListeners();
        this.clearErrors(); // Limpiar errores al inicio
    }

    setupEventListeners() {
        // Evento de envío del formulario
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        
        // Validación en tiempo real
        const username = document.getElementById('username');
        const password = document.getElementById('password');

        // Validación mientras el usuario escribe
        username.addEventListener('input', () => {
            this.validateField(username, 'username');
        });

        password.addEventListener('input', () => {
            this.validateField(password, 'password');
        });

        // Limpiar errores cuando el usuario comienza a escribir
        username.addEventListener('focus', () => {
            this.clearFieldError('username');
        });

        password.addEventListener('focus', () => {
            this.clearFieldError('password');
        });
    }

    validateField(field, fieldName) {
        const error = document.getElementById(`${fieldName}-error`);
        error.textContent = '';
        field.classList.remove('invalid');

        // Validación de campo vacío
        if (!field.value.trim()) {
            error.textContent = 'Este campo es requerido';
            field.classList.add('invalid');
            return false;
        }

        // Validaciones específicas por tipo de campo
        if (fieldName === 'username') {
            if (!Validator.username(field.value)) {
                error.textContent = 'Usuario inválido';
                field.classList.add('invalid');
                return false;
            }
        }

        if (fieldName === 'password') {
            if (!Validator.password(field.value)) {
                error.textContent = 'La contraseña debe tener al menos 6 caracteres';
                field.classList.add('invalid');
                return false;
            }
        }

        return true;
    }

    validateForm() {
        const username = document.getElementById('username');
        const password = document.getElementById('password');

        const isUsernameValid = this.validateField(username, 'username');
        const isPasswordValid = this.validateField(password, 'password');

        return isUsernameValid && isPasswordValid;
    }

    clearFieldError(fieldName) {
        const error = document.getElementById(`${fieldName}-error`);
        if (error) {
            error.textContent = '';
        }
        const field = document.getElementById(fieldName);
        if (field) {
            field.classList.remove('invalid');
        }
    }

    clearErrors() {
        // Limpiar el error general
        const generalError = document.querySelector('.login-error');
        if (generalError) {
            generalError.remove();
        }

        // Limpiar errores de campos específicos
        const errorMessages = document.querySelectorAll('.error-message');
        errorMessages.forEach(error => {
            error.textContent = '';
        });

        // Remover clase de inválido de los campos
        const fields = this.form.querySelectorAll('input');
        fields.forEach(field => {
            field.classList.remove('invalid');
        });
    }

    showError(message) {
        // Eliminar error anterior si existe
        const existingError = document.querySelector('.login-error');
        if (existingError) {
            existingError.remove();
        }

        // Crear nuevo mensaje de error
        const errorDiv = document.createElement('div');
        errorDiv.className = 'login-error error-message';
        errorDiv.textContent = message;

        // Insertar al inicio del formulario
        this.form.insertBefore(errorDiv, this.form.firstChild);

        // Hacer scroll al error si está fuera de la vista
        errorDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    async handleSubmit(e) {
        e.preventDefault();

        // Validar el formulario antes de enviar
        if (!this.validateForm()) {
            return;
        }

        // Limpiar errores anteriores
        this.clearErrors();

        try {
            // Obtener los valores del formulario
            const formData = {
                username: this.form.username.value,
                password: this.form.password.value
            };

            // Realizar la petición al servidor
            const response = await fetch('http://localhost:3000/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (data.success) {
                // Guardar información de sesión
                Auth.login(data.data);
                
                // Redirigir según el rol
                if (data.data.user.role === 'super_admin') {
                    window.location.href = '../pages/inventory.html';
                } else {
                    window.location.href = '../pages/inventory.html';
                }
            } else {
                // Mostrar error de autenticación
                this.showError(data.error || 'Error al iniciar sesión');
            }
        } catch (error) {
            console.error('Error:', error);
            this.showError('Error de conexión al servidor');
        }
    }

    // Método para desactivar el formulario durante el envío
    setLoading(isLoading) {
        const submitButton = this.form.querySelector('button[type="submit"]');
        const inputs = this.form.querySelectorAll('input');
        
        if (isLoading) {
            submitButton.disabled = true;
            submitButton.textContent = 'Iniciando sesión...';
            inputs.forEach(input => input.disabled = true);
        } else {
            submitButton.disabled = false;
            submitButton.textContent = 'Iniciar Sesión';
            inputs.forEach(input => input.disabled = false);
        }
    }
}

// Inicializar la página cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    new LoginPage();
});

export default LoginPage;