/**
 * Utilidades de compresion de imagen
 * Comprime imagenes antes de subirlas al servidor
 */
import * as ImageManipulator from 'expo-image-manipulator';

/**
 * Comprimir imagen a JPEG con calidad reducida
 * @param {string} uri - URI de la imagen original
 * @param {number} maxWidth - Ancho maximo (default 800)
 * @param {number} quality - Calidad JPEG 0-1 (default 0.6)
 * @returns {Promise<string>} URI de la imagen comprimida
 */
export const compressImage = async (uri, maxWidth = 800, quality = 0.6) => {
    try {
        const result = await ImageManipulator.manipulateAsync(
            uri,
            [{ resize: { width: maxWidth } }],
            {
                compress: quality,
                format: ImageManipulator.SaveFormat.JPEG,
            }
        );
        return result.uri;
    } catch (error) {
        console.log('[IMAGEN] Error comprimiendo: ' + error.message);
        return uri; // Retornar original si falla
    }
};
