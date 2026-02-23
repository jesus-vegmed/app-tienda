/**
 * Manejador centralizado de errores
 * Captura todos los errores y devuelve respuesta estructurada
 */
const errorHandler = (err, req, res, _next) => {
    console.error('[ERROR]', err.message);

    // Error de validacion
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            message: err.message,
            code: 'VALIDATION_ERROR',
        });
    }

    // Error de base de datos (llaves duplicadas)
    if (err.code === '23505') {
        return res.status(409).json({
            success: false,
            message: 'El registro ya existe',
            code: 'DUPLICATE_ENTRY',
        });
    }

    // Error de foreign key
    if (err.code === '23503') {
        return res.status(400).json({
            success: false,
            message: 'Referencia invalida',
            code: 'FOREIGN_KEY_ERROR',
        });
    }

    // Error generico
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        success: false,
        message: err.message || 'Error interno del servidor',
        code: err.code || 'INTERNAL_ERROR',
    });
};

module.exports = errorHandler;
