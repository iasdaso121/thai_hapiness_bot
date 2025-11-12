import React, { useState, useEffect, useRef } from "react";
import { Container, Button, ListGroup, Card, Row, Col, Spinner, Alert } from "react-bootstrap";
import { observer } from "mobx-react-lite";
import CreateCity from "../components/modals/CreateCity";
import CreateDistrict from "../components/modals/CreateDistrict";
import DistrictList from "../components/DistrictList";
import { fetchCities } from "../http/cityApi";

const CitiesAdmin = observer(() => {
    const [cities, setCities] = useState([]);
    const [selectedCity, setSelectedCity] = useState(null);
    const [cityVisible, setCityVisible] = useState(false);
    const [districtVisible, setDistrictVisible] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [newDistrict, setNewDistrict] = useState(null);

    const districtListRef = useRef();    
    
    // Загрузка городов с районами
    useEffect(() => {
        loadCities();
    }, []);

    const loadCities = async () => {
        setLoading(true);
        setError('');
        try {
            const data = await fetchCities();
            setCities(data);
        } catch (err) {
            setError('Ошибка загрузки городов');
            console.error('Ошибка загрузки городов:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCitySelect = (city) => {
        setSelectedCity(selectedCity?.id === city.id ? null : city);
    };

    const handleCityAdded = () => {
        setCityVisible(false);
        loadCities();
    };

    // const handleDistrictAdded = (newDistrict) => {
    //     setDistrictVisible(false);
    //     // Перезагружаем районы для выбранного города
    //     if (districtListRef.current) {
    //         districtListRef.current.addDistrict(newDistrict);
    //     }
    // };

    const handleDistrictAdded = (newDistrictData) => {
        setDistrictVisible(false);
        setNewDistrict(newDistrictData); // Устанавливаем новый район
    };

    return (
        <Container className="mt-4">
            <Row>
                <Col>
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <h2>Управление городами и районами</h2>
                        <Button 
                            variant="success" 
                            onClick={() => setCityVisible(true)}
                        >
                            + Добавить город
                        </Button>
                    </div>

                    {error && (
                        <Alert variant="danger" className="mb-3">
                            {error}
                        </Alert>
                    )}

                    {/* Список городов */}
                    <Card>
                        <Card.Header>
                            <h5 className="mb-0">Города</h5>
                        </Card.Header>
                        
                        {loading ? (
                            <Card.Body className="text-center">
                                <Spinner animation="border" />
                            </Card.Body>
                        ) : (
                            <ListGroup variant="flush">
                                {cities.map(city => (
                                    <ListGroup.Item key={city.id} className="p-3">
                                        <div 
                                            className="d-flex justify-content-between align-items-center cursor-pointer"
                                            onClick={() => handleCitySelect(city)}
                                            style={{cursor: 'pointer'}}
                                        >
                                            <h6 className="mb-0">{city.name}</h6>
                                            <span>
                                                {selectedCity?.id === city.id ? '▲' : '▼'}
                                            </span>
                                        </div>
                                        
                                        {/* Подсписок районов */}
                                        {selectedCity?.id === city.id && (
                                            <div className="mt-3">
                                                <DistrictList 
                                                    ref={districtListRef}
                                                    cityId={city.id}
                                                    cityName={city.name}
                                                    // onDistrictAdded={handleDistrictAdded}
                                                    newDistrict={newDistrict}
                                                    onDistrictChange={() => loadCities()}
                                                />
                                                
                                                <Button 
                                                    variant="outline-primary" 
                                                    size="sm"
                                                    className="mt-2"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setDistrictVisible(true);
                                                        setNewDistrict(null);
                                                    }}
                                                >
                                                    + Добавить район
                                                </Button>
                                            </div>
                                        )}
                                    </ListGroup.Item>
                                ))}
                            </ListGroup>
                        )}
                    </Card>

                    {!loading && cities.length === 0 && (
                        <Card className="text-center p-4">
                            <Card.Text className="text-muted">
                                Нет добавленных городов
                            </Card.Text>
                        </Card>
                    )}
                </Col>
            </Row>

            {/* Модальные окна */}
            <CreateCity 
                show={cityVisible} 
                onHide={() => setCityVisible(false)}
                onSuccess={handleCityAdded}
            />
            
            <CreateDistrict 
                show={districtVisible} 
                onHide={() => setDistrictVisible(false)}
                onSuccess={handleDistrictAdded}
                cityId={selectedCity?.id}
                cityName={selectedCity?.name}
            />
        </Container>
    );
});

export default CitiesAdmin;