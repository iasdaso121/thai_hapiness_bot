import { $authHost, $host } from "./index";

export const createDistrict = async (district) => {
    const {data} = await $authHost.post('api/district', district)
    return data
}

export const fetchDistricts = async (cityId) => {
    const {data} = await $host.get('api/district/city/' + cityId)
    return data
}

export const deleteDistrict = async (id) => {
    const {data} = await $authHost.delete('api/district/' + id)
    return data
}

export const fetchAllDistricts = async () => {
    const {data} = await $host.get('api/district')
    return data
}