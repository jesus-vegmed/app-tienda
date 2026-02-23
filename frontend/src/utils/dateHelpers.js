/**
 * Utilidades de formato de fechas
 */

/**
 * Formatear fecha a formato legible
 * @param {string} dateStr - ISO date string
 * @returns {string}
 */
export const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-MX', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
};

/**
 * Formatear fecha con hora
 * @param {string} dateStr - ISO date string
 * @returns {string}
 */
export const formatDateTime = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-MX', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

/**
 * Formatear moneda
 * @param {number} amount
 * @returns {string}
 */
export const formatCurrency = (amount) => {
    return '$' + Number(amount || 0).toFixed(2);
};

/**
 * Diferencia en dias entre una fecha y ahora
 * @param {string} dateStr
 * @returns {number}
 */
export const daysSince = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    return Math.floor(diff / (1000 * 60 * 60 * 24));
};
