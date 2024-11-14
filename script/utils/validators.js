// scripts/utils/validators.js
const Validator = {
    username: (value) => {
        return /^[a-zA-Z0-9_]{3,20}$/.test(value);
    },

    password: (value) => {
        return value.length >= 6;
    },

    email: (value) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    },

    required: (value) => {
        return value.trim().length > 0;
    },

    numeric: (value) => {
        return !isNaN(value) && Number(value) >= 0;
    },

    minLength: (value, length) => {
        return value.length >= length;
    },

    maxLength: (value, length) => {
        return value.length <= length;
    },

    phone: (value) => {
        return /^\+?[\d\s-]{8,}$/.test(value);
    },

    date: (value) => {
        const date = new Date(value);
        return !isNaN(date.getTime());
    },

    // Validador personalizado para cantidades de inventario
    quantity: (value) => {
        return !isNaN(value) && Number(value) >= 0 && Number.isInteger(Number(value));
    }
};

export default Validator;