import { $authHost, $host } from "./index";

export const createCity = async (city) => {
    const {data} = await $authHost.post('api/city', city)
    return data
}

export const fetchCities = async () => {
    const {data} = await $host.get('api/city')
    return data
}

export const deleteCity = async (id) => {
    const {data} = await $authHost.delete('api/city/' + id)
    return data
}