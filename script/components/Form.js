
class Form {
    constructor(config) {
        this.config = config;
        this.formElement = null;
        this.validators = {
            required: (value) => value.trim() !== '',
            email: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
            minLength: (value, length) => value.length >= length,
            numeric: (value) => !isNaN(value) && value >= 0
        };
    }

    createField(field) {
        const fieldContainer = document.createElement('div');
        fieldContainer.className = 'form-group';

        const label = document.createElement('label');
        label.textContent = field.label;
        label.htmlFor = field.id;

        let input;
        
        switch (field.type) {
            case 'select':
                input = document.createElement('select');
                field.options.forEach(option => {
                    const optionElement = document.createElement('option');
                    optionElement.value = option.value;
                    optionElement.textContent = option.label;
                    input.appendChild(optionElement);
                });
                break;
            
            case 'textarea':
                input = document.createElement('textarea');
                break;
            
            default:
                input = document.createElement('input');
                input.type = field.type;
        }

        input.id = field.id;
        input.name = field.name;
        input.className = 'form-control';
        
        if (field.placeholder) {
            input.placeholder = field.placeholder;
        }

        // Agregar validación en tiempo real
        input.addEventListener('input', () => this.validateField(input, field.validations));

        fieldContainer.appendChild(label);
        fieldContainer.appendChild(input);

        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.id = `${field.id}-error`;
        fieldContainer.appendChild(errorDiv);

        return fieldContainer;
    }

    validateField(input, validations = []) {
        const errorDiv = document.getElementById(`${input.id}-error`);
        errorDiv.textContent = '';
        input.classList.remove('invalid');

        for (const validation of validations) {
            const isValid = this.validators[validation.type](input.value, validation.param);
            if (!isValid) {
                errorDiv.textContent = validation.message;
                input.classList.add('invalid');
                return false;
            }
        }
        return true;
    }

    validateForm() {
        let isValid = true;
        this.config.fields.forEach(field => {
            const input = document.getElementById(field.id);
            if (!this.validateField(input, field.validations)) {
                isValid = false;
            }
        });
        return isValid;
    }

    getFormData() {
        const formData = {};
        this.config.fields.forEach(field => {
            const input = document.getElementById(field.id);
            formData[field.name] = input.value;
        });
        return formData;
    }

    render(container) {
        this.formElement = document.createElement('form');
        this.formElement.className = 'form';

        this.config.fields.forEach(field => {
            const fieldElement = this.createField(field);
            this.formElement.appendChild(fieldElement);
        });

        const submitButton = document.createElement('button');
        submitButton.type = 'submit';
        submitButton.className = 'btn btn-primary';
        submitButton.textContent = this.config.submitText || 'Guardar';

        this.formElement.appendChild(submitButton);

        this.formElement.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (this.validateForm()) {
                const formData = this.getFormData();
                await this.config.onSubmit(formData);
            }
        });

        container.appendChild(this.formElement);
    }
}

export default Form;