
class Modal {
    constructor(config = {}) {
        this.config = config;
        this.isOpen = false;
        this.modal = null;
        this.setupModal();
    }

    setupModal() {
        // Crear elementos del modal
        this.modal = document.createElement('div');
        this.modal.className = 'modal-overlay';
        this.modal.style.display = 'none';

        const modalContent = document.createElement('div');
        modalContent.className = 'modal-content';

        // Header del modal
        const modalHeader = document.createElement('div');
        modalHeader.className = 'modal-header';

        const title = document.createElement('h2');
        title.textContent = this.config.title || 'Modal';

        const closeButton = document.createElement('button');
        closeButton.className = 'modal-close';
        closeButton.innerHTML = '&times;';
        closeButton.onclick = () => this.close();

        modalHeader.appendChild(title);
        modalHeader.appendChild(closeButton);

        // Body del modal
        const modalBody = document.createElement('div');
        modalBody.className = 'modal-body';

        modalContent.appendChild(modalHeader);
        modalContent.appendChild(modalBody);
        this.modal.appendChild(modalContent);

        // Cerrar al hacer clic fuera del modal
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.close();
            }
        });

        // Agregar al DOM
        document.body.appendChild(this.modal);
        this.modalBody = modalBody;
    }

    setContent(content) {
        this.modalBody.innerHTML = '';
        if (typeof content === 'string') {
            this.modalBody.innerHTML = content;
        } else {
            this.modalBody.appendChild(content);
        }
    }

    open() {
        this.isOpen = true;
        this.modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    close() {
        this.isOpen = false;
        this.modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        if (this.config.onClose) {
            this.config.onClose();
        }
    }

    setTitle(title) {
        const titleElement = this.modal.querySelector('.modal-header h2');
        titleElement.textContent = title;
    }
}

export default Modal;