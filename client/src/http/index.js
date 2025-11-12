import axios from "axios";
// console.log('API URL from env:', process.env.REACT_APP_API_URL);

const $host = axios.create({
    // baseURL: process.env.REACT_APP_API_URL
    baseURL: '/'
})

const $authHost = axios.create({
    // baseURL: process.env.REACT_APP_API_URL
    baseURL: '/'
})

// console.log('$host baseURL:', $host.defaults.baseURL);
// console.log('$authHost baseURL:', $authHost.defaults.baseURL);

const authInterceptor = config => {
    config.headers.authorization = `Bearer ${localStorage.getItem('token')}`
    return config
}

$authHost.interceptors.request.use(authInterceptor)

export {
    $host,
    $authHost
}