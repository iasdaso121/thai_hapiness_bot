import React, { useState, useEffect } from 'react';
import Modal from "react-bootstrap/Modal";
import { Button, Form, Alert, Row, Col } from "react-bootstrap";
import { observer } from "mobx-react-lite";
import { createPosition } from "../../http/positionApi";
import { fetchCities } from "../../http/cityApi";
import { fetchDistricts } from "../../http/districtApi";

const CreatePositionModal = observer(({ show, onHide, onPositionCreated, productId, productName }) => {
    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [location, setLocation] = useState('');
    const [type, setType] = useState('');
    const [cityId, setCityId] = useState('');
    const [districtId, setDistrictId] = useState('');
    const [cities, setCities] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Загрузка городов при открытии модалки
    useEffect(() => {
        if (show) {
            loadCities();
        }
    }, [show]);

    // Загрузка районов при выборе города
    useEffect(() => {
        if (cityId) {
            loadDistricts(cityId);
        } else {
            setDistricts([]);
            setDistrictId('');
        }
    }, [cityId]);

    const loadCities = async () => {
        try {
            const data = await fetchCities();
            setCities(data);
        } catch (err) {
            console.error('Ошибка загрузки городов:', err);
        }
    };

    const loadDistricts = async (cityId) => {
        try {
            const data = await fetchDistricts(cityId);
            setDistricts(data);
        } catch (err) {
            console.error('Ошибка загрузки районов:', err);
        }
    };

    const handleCreatePosition = async () => {
        if (!name.trim()) {
            setError('Введите название позиции');
            return;
        }
        if (!price || price <= 0) {
            setError('Введите корректную цену');
            return;
        }
        if (!location.trim()) {
            setError('Введите местоположение');
            return;
        }
        if (!cityId) {
            setError('Выберите город');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const positionData = {
                name: name.trim(),
                price: parseInt(price),
                location: location.trim(),
                type: type.trim(),
                productId: parseInt(productId),
                cityId: parseInt(cityId),
                districtId: districtId ? parseInt(districtId) : null
            };

            const newPosition = await createPosition(positionData);
            
            setName('');
            setPrice('');
            setLocation('');
            setType('новый');
            setCityId('');
            setDistrictId('');
            
            // Уведомляем родительский компонент
            if (onPositionCreated) {
                onPositionCreated(newPosition);
            }
            
            onHide();
            
        } catch (err) {
            setError(err.response?.data?.message || 'Ошибка при создании позиции');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setName('');
        setPrice('');
        setLocation('');
        setType('новый');
        setCityId('');
        setDistrictId('');
        setError('');
        onHide();
    };

    return (
        <Modal show={show} onHide={handleClose} centered size="lg">
            <Modal.Header closeButton>
                <Modal.Title>Добавить позицию для: {productName}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {error && (
                    <Alert variant="danger" className="mb-3">
                        {error}
                    </Alert>
                )}

                <Form>
                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Название позиции *</Form.Label>
                                <Form.Control
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    placeholder=""
                                    disabled={loading}
                                />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Цена (???) *</Form.Label>
                                <Form.Control
                                    type="number"
                                    value={price}
                                    onChange={e => setPrice(e.target.value)}
                                    placeholder=""
                                    disabled={loading}
                                />
                            </Form.Group>
                        </Col>
                    </Row>

                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Упаковка</Form.Label>
                                <Form.Control
                                    value={type}
                                    onChange={e => setType(e.target.value)}
                                    placeholder=""
                                    disabled={loading}
                                />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Местоположение *</Form.Label>
                                <Form.Control
                                    value={location}
                                    onChange={e => setLocation(e.target.value)}
                                    placeholder=""
                                    disabled={loading}
                                />
                            </Form.Group>
                        </Col>
                    </Row>

                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Город *</Form.Label>
                                <Form.Select
                                    value={cityId}
                                    onChange={e => setCityId(e.target.value)}
                                    disabled={loading || cities.length === 0}
                                >
                                    <option value="">-- Выберите город --</option>
                                    {cities.map(city => (
                                        <option key={city.id} value={city.id}>
                                            {city.name}
                                        </option>
                                    ))}
                                </Form.Select>
                                {cities.length === 0 && (
                                    <Form.Text className="text-muted">
                                        Нет доступных городов. Сначала создайте город.
                                    </Form.Text>
                                )}
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Район *</Form.Label>
                                <Form.Select
                                    value={districtId}
                                    onChange={e => setDistrictId(e.target.value)}
                                    disabled={loading || !cityId || districts.length === 0}
                                >
                                    <option value="">-- Выберите район --</option>
                                    {districts.map(district => (
                                        <option key={district.id} value={district.id}>
                                            {district.name}
                                        </option>
                                    ))}
                                </Form.Select>
                                {cityId && districts.length === 0 && (
                                    <Form.Text className="text-muted">
                                        В этом городе нет районов
                                    </Form.Text>
                                )}
                                {!cityId && (
                                    <Form.Text className="text-muted">
                                        Сначала выберите город
                                    </Form.Text>
                                )}
                            </Form.Group>
                        </Col>
                    </Row>
                </Form>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="outline-secondary" onClick={handleClose} disabled={loading}>
                    Отмена
                </Button>
                <Button 
                    variant="success" 
                    onClick={handleCreatePosition}
                    disabled={loading || !name.trim() || !price || !location.trim() || !cityId}
                >
                    {loading ? 'Создание...' : 'Создать позицию'}
                </Button>
            </Modal.Footer>
        </Modal>
    );
});

export default CreatePositionModal;