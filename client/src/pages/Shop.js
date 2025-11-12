/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, Badge, Alert, Spinner } from "react-bootstrap";
import { observer } from "mobx-react-lite";
import { $host } from "../http";
import { fetchCategories } from "../http/categoryApi";
import { fetchCities } from "../http/cityApi";
import PositionCard from '../components/PositionCard';

const Shop = observer(() => {
    const [positions, setPositions] = useState([]);
    const [categories, setCategories] = useState([]);
    const [cities, setCities] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [filters, setFilters] = useState({
        categoryId: '',
        cityId: '',
        districtId: '',
        // minPrice: '',
        // maxPrice: '',
        // type: ''
    });

    useEffect(() => {
        loadInitialData();
        loadPositions();
    }, []);

    useEffect(() => {
        if (filters.cityId) {
            loadDistricts(filters.cityId);
        } else {
            setDistricts([]);
            setFilters(prev => ({ ...prev, districtId: '' }));
        }
    }, [filters.cityId]);

    useEffect(() => {
        loadPositions();
    }, [filters]);

    const loadInitialData = async () => {
        try {
            const [categoriesData, citiesData] = await Promise.all([
                fetchCategories(),
                fetchCities()
            ]);
            setCategories(categoriesData);
            setCities(citiesData);
        } catch (err) {
            console.error('Ошибка загрузки初始数据:', err);
        }
    };

    const loadDistricts = async (cityId) => {
        try {
            const { data } = await $host.get(`api/catalog/cities/${cityId}/districts`);
            setDistricts(data);
        } catch (err) {
            console.error('Ошибка загрузки районов:', err);
        }
    };

    const loadPositions = async () => {
        setLoading(true);
        setError('');
        try {
            // Подготавливаем параметры для поиска
            const searchParams = {};
            if (filters.categoryId) searchParams.categoryId = filters.categoryId;
            if (filters.cityId) searchParams.cityId = filters.cityId;
            if (filters.districtId) searchParams.districtId = filters.districtId;
            // if (filters.minPrice) searchParams.minPrice = filters.minPrice;
            // if (filters.maxPrice) searchParams.maxPrice = filters.maxPrice;
            // if (filters.type) searchParams.type = filters.type;

            const { data } = await $host.get('api/catalog/positions/search', {
                params: searchParams
            });

            setPositions(data.rows || data);
        } catch (err) {
            setError('Ошибка загрузки позиций');
            console.error('Ошибка загрузки позиций:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const clearFilters = () => {
        setFilters({
            categoryId: '',
            cityId: '',
            districtId: '',
            minPrice: '',
            maxPrice: '',
            type: ''
        });
    };

    const hasActiveFilters = Object.values(filters).some(value => value !== '');

    return (
        <Container className="mt-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>Обзор</h2>
                <Badge bg="warning" className="fs-6">
                    Найдено позиций: {positions.length}
                </Badge>
            </div>

            {/* Сложный фильтр */}
            <Card className="mb-4">
                <Card.Header>
                    <h6 className="mb-0">Расширенный поиск позиций</h6>
                </Card.Header>
                <Card.Body>
                    <Row className="g-3">
                        {/* Категория */}
                        <Col md={6} lg={2}>
                            <Form.Group>
                                <Form.Label>Категория</Form.Label>
                                <Form.Select
                                    value={filters.categoryId}
                                    onChange={(e) => handleFilterChange('categoryId', e.target.value)}
                                >
                                    <option value="">Все категории</option>
                                    {categories.map(category => (
                                        <option key={category.id} value={category.id}>
                                            {category.name}
                                        </option>
                                    ))}
                                </Form.Select>
                            </Form.Group>
                        </Col>

                        {/* Город */}
                        <Col md={6} lg={2}>
                            <Form.Group>
                                <Form.Label>Город</Form.Label>
                                <Form.Select
                                    value={filters.cityId}
                                    onChange={(e) => handleFilterChange('cityId', e.target.value)}
                                >
                                    <option value="">Все города</option>
                                    {cities.map(city => (
                                        <option key={city.id} value={city.id}>
                                            {city.name}
                                        </option>
                                    ))}
                                </Form.Select>
                            </Form.Group>
                        </Col>

                        {/* Район */}
                        <Col md={6} lg={2}>
                            <Form.Group>
                                <Form.Label>Район</Form.Label>
                                <Form.Select
                                    value={filters.districtId}
                                    onChange={(e) => handleFilterChange('districtId', e.target.value)}
                                    disabled={!filters.cityId}
                                >
                                    <option value="">Все районы</option>
                                    {districts.map(district => (
                                        <option key={district.id} value={district.id}>
                                            {district.name}
                                        </option>
                                    ))}
                                </Form.Select>
                            </Form.Group>
                        </Col>

                        {/* Тип */}
                        {/* <Col md={6} lg={2}>
                            <Form.Group>
                                <Form.Label>Тип</Form.Label>
                                <Form.Select
                                    value={filters.type}
                                    onChange={(e) => handleFilterChange('type', e.target.value)}
                                >
                                    <option value="">Любой тип</option>
                                    <option value="новый">Новый</option>
                                    <option value="б/у">Б/у</option>
                                    <option value="восстановленный">Восстановленный</option>
                                </Form.Select>
                            </Form.Group>
                        </Col> */}

                        {/* Цена от */}
                        {/* <Col md={6} lg={2}>
                            <Form.Group>
                                <Form.Label>Цена от</Form.Label>
                                <Form.Control
                                    type="number"
                                    placeholder="0"
                                    value={filters.minPrice}
                                    onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                                />
                            </Form.Group>
                        </Col> */}

                        {/* Цена до */}
                        {/* <Col md={6} lg={2}>
                            <Form.Group>
                                <Form.Label>Цена до</Form.Label>
                                <Form.Control
                                    type="number"
                                    placeholder="999999"
                                    value={filters.maxPrice}
                                    onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                                />
                            </Form.Group>
                        </Col>*/}
                    </Row> 

                    {/* Кнопки управления фильтрами */}
                    <Row className="mt-3">
                        <Col>
                            {hasActiveFilters && (
                                <Button 
                                    variant="outline-secondary" 
                                    size="sm"
                                    onClick={clearFilters}
                                >
                                    Очистить фильтры
                                </Button>
                            )}
                        </Col>
                        <Col md="auto">
                            <small className="text-muted">
                                Фильтры применяются автоматически
                            </small>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {/* Сообщения об ошибках */}
            {error && (
                <Alert variant="danger" className="mb-3">
                    {error}
                </Alert>
            )}

            {/* Список позиций */}
            {loading ? (
                <div className="text-center py-5">
                    <Spinner animation="border" />
                    <div className="mt-2 text-muted">Загрузка позиций...</div>
                </div>
            ) : (
                <Row>
                    {positions.map(position => (
                        <Col key={position.id} lg={4} md={6} className="mb-4">
                            <PositionCard position={position} />
                        </Col>
                    ))}
                </Row>
            )}

            {!loading && positions.length === 0 && (
                <Card className="text-center py-5">
                    <Card.Body>
                        <h5 className="text-muted">
                            {hasActiveFilters ? 'Нет позиций по выбранным фильтрам' : 'Нет доступных позиций'}
                        </h5>
                        <p className="text-muted mb-3">
                            {hasActiveFilters 
                                ? 'Попробуйте изменить параметры поиска' 
                                : 'Создайте позиции в разделе управления продуктами'
                            }
                        </p>
                        {hasActiveFilters && (
                            <Button 
                                variant="outline-primary"
                                onClick={clearFilters}
                            >
                                Показать все позиции
                            </Button>
                        )}
                    </Card.Body>
                </Card>
            )}
        </Container>
    );
});

export default Shop;