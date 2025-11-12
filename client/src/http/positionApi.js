import { $authHost, $host } from "./index";

export const createPosition = async (position) => {
    const {data} = await $authHost.post('api/position', position)
    return data
}

export const fetchPositions = async (productId, cityId, limit, page) => {
    const {data} = await $host.get('api/position', {
        params: { 
            productId: productId || undefined,
            cityId: cityId || undefined, 
            limit, 
            page 
        }
    })
    return data
}

export const fetchOnePosition = async (id) => {
    const {data} = await $host.get('api/position/' + id)
    return data
}

export const deletePosition = async (id) => {
    const {data} = await $authHost.delete('api/position/' + id)
    return data
}