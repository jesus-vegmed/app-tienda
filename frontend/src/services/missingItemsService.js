/**
 * Servicio de faltantes
 * Solo opera en la nube, requiere conexion
 */
import api from './api';

const missingItemsService = {
    /**
     * Listar faltantes (requiere conexion)
     */
    async list(showPurchased = false) {
        const response = await api.get('/missing-items', {
            params: { show_purchased: showPurchased },
        });
        return response.data.data;
    },

    /**
     * Crear faltante
     */
    async create({ productName, size, urgency }) {
        const response = await api.post('/missing-items', {
            product_name: productName,
            size,
            urgency,
        });
        return response.data.data;
    },

    /**
     * Actualizar faltante
     */
    async update(id, data) {
        const response = await api.put('/missing-items/' + id, {
            product_name: data.productName,
            size: data.size,
            urgency: data.urgency,
        });
        return response.data.data;
    },

    /**
     * Marcar como comprado
     */
    async markAsPurchased(id) {
        const response = await api.post('/missing-items/' + id + '/purchase');
        return response.data.data;
    },

    /**
     * Eliminar faltante
     */
    async delete(id) {
        const response = await api.delete('/missing-items/' + id);
        return response.data.data;
    },
};

export default missingItemsService;
