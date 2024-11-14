// scripts/components/Alert.js

class Alert {
    constructor() {
        this.container = null;
        this.queue = [];
        this.isProcessing = false;
        this.setupContainer();
    }

    setupContainer() {
        // Crear el contenedor de alertas si no existe
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.className = 'alert-container';
            document.body.appendChild(this.container);
        }
    }

    createAlertElement(message, type) {
        const alert = document.createElement('div');
        alert.className = `alert alert-${type}`;
        
        // Crear el contenido del alert
        alert.innerHTML = `
            <div class="alert-content">
                <span class="alert-icon">${this.getIcon(type)}</span>
                <span class="alert-message">${message}</span>
                <button class="alert-close">&times;</button>
            </div>
        `;

        // Agregar evento para cerrar alert
        const closeBtn = alert.querySelector('.alert-close');
        closeBtn.addEventListener('click', () => this.close(alert));

        return alert;
    }

    getIcon(type) {
        const icons = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ'
        };
        return icons[type] || icons.info;
    }

    show(message, type = 'info', duration = 3000) {
        // Agregar a la cola
        this.queue.push({ message, type, duration });
        
        // Procesar la cola si no hay alertas mostrándose
        if (!this.isProcessing) {
            this.processQueue();
        }
    }

    async processQueue() {
        if (this.queue.length === 0) {
            this.isProcessing = false;
            return;
        }

        this.isProcessing = true;
        const { message, type, duration } = this.queue.shift();
        
        // Crear y mostrar el alert
        const alert = this.createAlertElement(message, type);
        this.container.appendChild(alert);

        // Animar entrada
        setTimeout(() => alert.classList.add('show'), 10);

        // Esperar y cerrar
        await new Promise(resolve => setTimeout(resolve, duration));
        await this.close(alert);

        // Procesar el siguiente en la cola
        this.processQueue();
    }

    async close(alert) {
        alert.classList.remove('show');
        
        // Esperar a que termine la animación de salida
        await new Promise(resolve => {
            alert.addEventListener('transitionend', () => {
                alert.remove();
                resolve();
            }, { once: true });
        });
    }

    // Métodos de conveniencia para diferentes tipos de alertas
    success(message, duration) {
        this.show(message, 'success', duration);
    }

    error(message, duration) {
        this.show(message, 'error', duration);
    }

    warning(message, duration) {
        this.show(message, 'warning', duration);
    }

    info(message, duration) {
        this.show(message, 'info', duration);
    }

    // Limpiar todas las alertas
    clearAll() {
        this.queue = [];
        const alerts = this.container.querySelectorAll('.alert');
        alerts.forEach(alert => this.close(alert));
    }

    // Método para manejar múltiples errores (útil para validación de formularios)
    showErrors(errors) {
        if (Array.isArray(errors)) {
            errors.forEach(error => this.error(error));
        } else if (typeof errors === 'object') {
            Object.values(errors).forEach(error => this.error(error));
        } else {
            this.error(errors.toString());
        }
    }
}

// Crear una única instancia para toda la aplicación
const alert = new Alert();

export default alert;