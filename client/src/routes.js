import {
    ADMIN_ROUTE, LOGIN_ROUTE, SHOP_ROUTE,
    ADMIN_CITIES_ROUTE, ADMIN_PRODUCTS_ROUTE, ADMIN_CONTENT_ROUTE,
    ADMIN_POSITIONS_ROUTE, ADMIN_REVIEWS_ROUTE
} from "./utils/consts"

import Admin from "./pages/Admin"
import Shop from "./pages/Shop"
import Auth from "./pages/Auth"
import CitiesAdmin from "./pages/CitiesAdmin"
import ProductsAdmin from "./pages/ProductsAdmin"
import ContentAdmin from "./pages/ContentAdmin"
import PositionsAdmin from "./pages/PositionsAdmin"
import ReviewsAdmin from "./pages/ReviewsAdmin"

export const authRoutes = [
    {
        path: ADMIN_ROUTE,
        Component: Admin
    },
    {
        path: ADMIN_CITIES_ROUTE,
        Component: CitiesAdmin
    },
    {
        path: ADMIN_PRODUCTS_ROUTE,
        Component: ProductsAdmin
    },
    {
        path: ADMIN_POSITIONS_ROUTE,
        Component: PositionsAdmin
    },
    {
        path: ADMIN_CONTENT_ROUTE,
        Component: ContentAdmin
    },
    {
        path: ADMIN_REVIEWS_ROUTE,
        Component: ReviewsAdmin
    },
    {
        path: SHOP_ROUTE,
        Component: Shop
    },
]


export const publicRoutes = [
    {
        path: LOGIN_ROUTE,
        Component: Auth
    },
]