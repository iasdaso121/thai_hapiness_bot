/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from 'react';
import { Container, Button, Card, ListGroup, Spinner, Alert, Row, Col, Badge } from "react-bootstrap";
import { useNavigate, useSearchParams } from "react-router-dom";
import { observer } from "mobx-react-lite";
import { $host } from "../http"; // напрямую для catalog
import { fetchOneProduct } from "../http/productApi";
import CreatePositionModal from "../components/modals/CreatePosition";
import PositionFilters from "../components/PositionFilters";
import PositionItem from '../components/PositionItem';

const PositionsAdmin = observer(() => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const productId = searchParams.get('productId');
    
    const [positions, setPositions] = useState([]);
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [positionModalShow, setPositionModalShow] = useState(false);

    const [filteredPositions, setFilteredPositions] = useState([]);
    const [selectedCity, setSelectedCity] = useState(null);
    const [selectedDistrict, setSelectedDistrict] = useState(null);

    // Загрузка позиций и информации о продукте
    useEffect(() => {
        if (productId) {
            loadProductInfo();
            loadPositions();
        }
    }, [productId]);

    useEffect(() => {
        filterPositions();
    }, [positions, selectedCity, selectedDistrict]);

    const loadProductInfo = async () => {
        try {
            const productData = await fetchOneProduct(productId);
            setProduct(productData);
        } catch (err) {
            console.error('Ошибка загрузки информации о продукте:', err);
        }
    };

    const loadPositions = async () => {
        if (!productId) return;
        
        setLoading(true);
        setError('');
        try {
            const { data } = await $host.get(`api/catalog/products/${productId}/positions`);
            setPositions(data.rows || data);
        } catch (err) {
            setError('Ошибка загрузки позиций');
            console.error('Ошибка загрузки позиций:', err);
        } finally {
            setLoading(false);
        }
    };

    const filterPositions = () => {
        let filtered = positions;

        if (selectedCity) {
            filtered = filtered.filter(position => 
                position.city && position.city.id === selectedCity
            );
        }

        if (selectedDistrict) {
            filtered = filtered.filter(position => 
                position.district && position.district.id === selectedDistrict
            );
        }

        setFilteredPositions(filtered);
    };

    const handlePositionCreated = () => {
        loadPositions();
    };

    const handlePositionDeleted = () => {
        loadPositions();
    };

    const handleCityChange = (cityId) => {
        setSelectedCity(cityId);
        if (!cityId) {
            setSelectedDistrict(null);
        }
    };

    const handleDistrictChange = (districtId) => {
        setSelectedDistrict(districtId);
    };

    if (!productId) {
        return (
            <Container className="mt-4">
                <Alert variant="warning">
                    Продукт не выбран. Вернитесь к списку продуктов.
                </Alert>
                <Button variant="outline-secondary" onClick={() => navigate(-1)}>
                    ← Назад к продуктам
                </Button>
            </Container>
        );
    }

    return (
        <Container className="mt-4">
            {/* Шапка с навигацией */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <Button 
                        variant="outline-secondary" 
                        onClick={() => navigate(-1)}
                        className="me-3"
                    >
                        ← Назад к продуктам
                    </Button>
                    <h2 className="d-inline-block mb-0">
                        Управление позициями
                    </h2>
                </div>
                <Button 
                    variant="success"
                    onClick={() => setPositionModalShow(true)}
                >
                    + Добавить позицию
                </Button>
            </div>

            {/* Информация о продукте */}
            {product && (
                <Card className="mb-4">
                    <Card.Body>
                        <Row className="align-items-center">
                            <Col md="auto">
                                {product.img && (
                                    <img 
                                        src={`http://localhost:5050/${product.img}`}
                                        alt={product.name}
                                        style={{
                                            width: '60px',
                                            height: '60px',
                                            objectFit: 'cover',
                                            borderRadius: '8px'
                                        }}
                                    />
                                )}
                            </Col>
                            <Col>
                                <h5 className="mb-1">{product.name}</h5>
                                <p className="text-muted mb-1">{product.description}</p>
                                <small className="text-muted">
                                    Категория: <strong>{product.category?.name}</strong>
                                </small>
                            </Col>
                            <Col md="auto">
                                <Badge bg="secondary" className="fs-6">
                                    Позиций: {positions.length}
                                </Badge>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>
            )}

            {/* Сообщения об ошибках */}
            {error && (
                <Alert variant="danger" className="mb-3">
                    {error}
                </Alert>
            )}

            {/* Список позиций */}
            <Card>
                <Card.Header>
                    <PositionFilters 
                        selectedCity={selectedCity}
                        selectedDistrict={selectedDistrict}
                        onCityChange={handleCityChange}
                        onDistrictChange={handleDistrictChange}
                        positionsCount={filteredPositions.length}
                    />
                </Card.Header>
                
                {loading ? (
                    <Card.Body className="text-center">
                        <Spinner animation="border" />
                        <div className="mt-2 text-muted">Загрузка позиций...</div>
                    </Card.Body>
                ) : (
                    <ListGroup variant="flush">
                        {filteredPositions.map(position => (
                            <PositionItem 
                                key={position.id}
                                position={position}
                                onPositionDeleted={handlePositionDeleted}
                            />
                        ))}
                    </ListGroup>
                )}

                {!loading && filteredPositions.length === 0 && (
                    <Card.Body className="text-center">
                        <Alert variant="info" className="mb-0">
                            <strong>
                                {positions.length === 0 
                                    ? 'Нет активных позиций' 
                                    : 'Нет позиций по выбранным фильтрам'
                                }
                            </strong><br />
                            <small>
                                {positions.length === 0 
                                    ? 'Создайте первую позицию для этого продукта' 
                                    : 'Попробуйте изменить параметры фильтрации'
                                }
                            </small>
                        </Alert>
                    </Card.Body>
                )}
            </Card>

            {/* Модальное окно создания позиции */}
            <CreatePositionModal 
                show={positionModalShow}
                onHide={() => setPositionModalShow(false)}
                onPositionCreated={handlePositionCreated}
                productId={productId}
                productName={product?.name}
            />
        </Container>
    );
});

export default PositionsAdmin;