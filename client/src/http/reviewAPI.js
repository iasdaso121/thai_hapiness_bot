import { $authHost, $host } from "./index";

export const createReview = async (review) => {
    const { data } = await $authHost.post('api/review', review)
    return data
}

export const createBulkReviews = async (reviews) => {
    const { data } = await $authHost.post('api/review/bulk', { reviews })
    return data
}

export const fetchReviews = async () => {
    const { data } = await $host.get('api/review')
    return data
}

export const fetchReviewStats = async () => {
    const { data } = await $host.get('api/review/stats')
    return data
}

export const deleteReview = async (id) => {
    const { data } = await $authHost.delete('api/review/' + id)
    return data
}
