/**
 * Utilidades de validacion
 * Funciones reutilizables para validar datos de entrada
 */

/**
 * Valida que los campos requeridos esten presentes en el body
 * @param {Object} body - req.body
 * @param {string[]} fields - campos requeridos
 * @returns {{ valid: boolean, missing: string[] }}
 */
const validateRequired = (body, fields) => {
    const missing = fields.filter(
        (f) => body[f] === undefined || body[f] === null || body[f] === ''
    );
    return {
        valid: missing.length === 0,
        missing,
    };
};

/**
 * Valida que un valor sea un numero positivo
 * @param {*} value
 * @returns {boolean}
 */
const isPositiveNumber = (value) => {
    const num = Number(value);
    return !isNaN(num) && num > 0;
};

/**
 * Valida que un valor sea una urgencia valida
 * @param {string} value
 * @returns {boolean}
 */
const isValidUrgency = (value) => {
    return ['alta', 'media', 'baja'].includes(value);
};

/**
 * Valida que un valor sea un tipo de proveedor valido
 * @param {string} value
 * @returns {boolean}
 */
const isValidSupplierType = (value) => {
    return ['unico', 'repetitivo'].includes(value);
};

/**
 * Crea un error con status code personalizado
 * @param {string} message
 * @param {number} statusCode
 * @returns {Error}
 */
const createError = (message, statusCode) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
};

module.exports = {
    validateRequired,
    isPositiveNumber,
    isValidUrgency,
    isValidSupplierType,
    createError,
};
