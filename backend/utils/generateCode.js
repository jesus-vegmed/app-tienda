/**
 * Generador de codigos unicos de 6 caracteres
 * Usado para identificar importes (envases retornables)
 */
const CHARACTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Sin I,O,0,1 para evitar confusion

/**
 * Genera un codigo alfanumerico de 6 caracteres
 * @returns {string}
 */
const generateCode = () => {
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += CHARACTERS.charAt(Math.floor(Math.random() * CHARACTERS.length));
    }
    return code;
};

module.exports = generateCode;
