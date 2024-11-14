// server/utils/hashHelper.js
const hashHelper = {
    hashPassword(password) {
        // Para desarrollo, usaremos una función simple
        return password; // En este caso, guardamos la contraseña tal cual
    },

    verifyPassword(inputPassword, storedPassword) {
        return this.hashPassword(inputPassword) === storedPassword;
    }
};

module.exports = hashHelper;