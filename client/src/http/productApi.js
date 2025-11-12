import { $authHost, $host } from "./index";

export const createProduct = async (product) => {
    const {data} = await $authHost.post('api/product', product, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    })
    return data
}

export const fetchProducts = async (categoryId, limit, page) => {
    const {data} = await $host.get('api/product', {
        params: { 
            categoryId: categoryId || undefined,
            limit, 
            page 
        }
    })
    return data
}

export const fetchOneProduct = async (id) => {
    const {data} = await $host.get('api/product/' + id)
    return data
}

export const deleteProduct = async (id) => {
    const {data} = await $authHost.delete('api/product/' + id)
    return data
}