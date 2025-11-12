/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from "react";
import { Container, Row, Col, Button, Alert } from "react-bootstrap";
import { observer } from "mobx-react-lite";
import { useNavigate } from "react-router-dom";
import { fetchCategories } from "../http/categoryApi";
// import { fetchProducts } from "../http/productApi";
import { $host } from "../http";
import { ADMIN_POSITIONS_ROUTE } from "../utils/consts";
import CategoriesSidebar from "../components/CategoriesSidebar";
import ProductsList from "../components/ProductList";
import CreateProduct from "../components/modals/CreateProduct";

const ProductsAdmin = observer(() => {
    const [categories, setCategories] = useState([]);
    const [products, setProducts] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [productModalShow, setProductModalShow] = useState(false);
    const navigate = useNavigate();

    // Загрузка категорий и продуктов
    useEffect(() => {
        loadCategories();
        loadProducts();
    }, []);

    // Загрузка продуктов при изменении категории
    useEffect(() => {
        loadProducts();
    }, [selectedCategory]);

    const loadCategories = async () => {
        try {
            const data = await fetchCategories();
            setCategories(data);
        } catch (err) {
            console.error('Ошибка загрузки категорий:', err);
        }
    };

    const loadProducts = async () => {
        setLoading(true);
        setError('');
        try {
            let productsData;
            
            if (selectedCategory) {
                // catalogController возвращает массив
                const response = await $host.get(`api/catalog/categories/${selectedCategory.id}/products`);
                productsData = Array.isArray(response.data) ? response.data : [];
            } else {
                // productController теперь ВСЕГДА включает позиции
                const response = await $host.get('api/product', {
                    params: {
                        limit: 50,
                        page: 1
                    }
                });
                productsData = response.data.rows || response.data;
                
                if (productsData && productsData.rows) {
                    productsData = productsData.rows;
                }
                
                productsData = Array.isArray(productsData) ? productsData : [];
            }
            
            // console.log('Загружено продуктов:', productsData.length);
            // console.log('Первый продукт:', productsData[0]);
            setProducts(productsData);
            
        } catch (err) {
            setError('Ошибка загрузки продуктов');
            console.error('Ошибка загрузки продуктов:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleProductClick = (productId) => {
        navigate(`${ADMIN_POSITIONS_ROUTE}?productId=${productId}`);
    };

    const handleCategorySelect = (category) => {
        setSelectedCategory(category);
    };

    const handleCategoriesUpdate = () => {
        loadCategories();
    };

    const handleAddProduct = () => {
        setProductModalShow(true);
    };

    const handleProductCreated = (newProduct) => {
        loadProducts();
        
        // Если создан продукт в текущей категории, переключаемся на него
        if (selectedCategory && newProduct.categoryId === selectedCategory.id) {
            // Продукт уже в списке из loadProducts()
            // TODO: Автоматически выделить новый продукт в списке
            // TODO: Прокрутить к новому продукту
            // TODO: Показать анимацию добавления
        } else if (!selectedCategory) {
            // Продукт появится в общем списке
            // TODO: Показать уведомление о добавлении
            // TODO: Обновить счетчик продуктов
        }
    };

    const handleProductDeleted = (deletedProductId) => {
        loadProducts();
        
        // Если удаленный продукт был выбран, сбрасываем выбор
        // (это полезно когда будем делать выделение продуктов)
    };

    return (
        <Container className="mt-4">
            <Row>
                <Col>
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <h2>Управление продуктами и позициями</h2>
                        <Button 
                            variant="success" 
                            onClick={handleAddProduct}
                        >
                            + Добавить продукт
                        </Button>
                    </div>

                    {error && (
                        <Alert variant="danger" className="mb-3">
                            {error}
                        </Alert>
                    )}

                    <Row>
                        <Col md={3}>
                            <CategoriesSidebar 
                                categories={categories}
                                selectedCategory={selectedCategory}
                                onCategorySelect={handleCategorySelect}
                                onCategoriesUpdate={handleCategoriesUpdate}
                            />
                        </Col>

                        <Col md={9}>
                            <ProductsList 
                                products={products}
                                loading={loading}
                                selectedCategory={selectedCategory}
                                onProductClick={handleProductClick}
                            />
                        </Col>
                    </Row>
                </Col>
            </Row>

            <CreateProduct
                show={productModalShow}
                onHide={() => setProductModalShow(false)}
                onProductCreated={handleProductCreated}
                onProductDeleted={handleProductDeleted}
            />
        </Container>
    );
});

export default ProductsAdmin;