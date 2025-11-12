import React, { useState, useEffect } from "react";
import { Row, Col, Form, Button, Badge } from "react-bootstrap";
import { observer } from "mobx-react-lite";
import { fetchCities } from "../http/cityApi";
import { fetchDistricts } from "../http/districtApi";

const PositionFilters = observer(({ 
    selectedCity, 
    selectedDistrict, 
    onCityChange, 
    onDistrictChange,
    positionsCount 
}) => {
    const [cities, setCities] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadCities();
    }, []);

    useEffect(() => {
        if (selectedCity) {
            loadDistricts(selectedCity);
        } else {
            setDistricts([]);
            if (selectedDistrict) {
                onDistrictChange(null);
            }
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedCity]);

    const loadCities = async () => {
        setLoading(true);
        try {
            const data = await fetchCities();
            setCities(data);
        } catch (err) {
            console.error('Ошибка загрузки городов:', err);
        } finally {
            setLoading(false);
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

    const handleCityChange = (e) => {
        const cityId = e.target.value ? parseInt(e.target.value) : null;
        onCityChange(cityId);
    };

    const handleDistrictChange = (e) => {
        const districtId = e.target.value ? parseInt(e.target.value) : null;
        onDistrictChange(districtId);
    };

    const clearFilters = () => {
        onCityChange(null);
        onDistrictChange(null);
    };

    const hasActiveFilters = selectedCity || selectedDistrict;

    return (
        <div className="position-filters">
            <Row className="align-items-center">
                <Col>
                    <h6 className="mb-0 d-flex align-items-center">
                        Активные позиции
                    </h6>
                </Col>
                
                <Col md="auto">
                    <Row className="g-2 align-items-center">
                        <Col>
                            {hasActiveFilters && (
                                <Badge bg="warning" text="dark" className="ms-2">
                                    Found {positionsCount} in:
                                </Badge>
                            )}
                        </Col>  
                        <Col>  
                            <Form.Select
                                value={selectedCity || ""}
                                onChange={handleCityChange}
                                disabled={loading}
                                size="sm"
                            >
                                <option value="">Все города</option>
                                {cities.map(city => (
                                    <option key={city.id} value={city.id}>
                                        {city.name}
                                    </option>
                                ))}
                            </Form.Select>
                        </Col>
                        
                        <Col>
                            <Form.Select
                                value={selectedDistrict || ""}
                                onChange={handleDistrictChange}
                                disabled={loading || !selectedCity}
                                size="sm"
                            >
                                <option value="">Все районы</option>
                                {districts.map(district => (
                                    <option key={district.id} value={district.id}>
                                        {district.name}
                                    </option>
                                ))}
                            </Form.Select>
                        </Col>
                        
                        {hasActiveFilters && (
                            <Col md="auto">
                                <Button 
                                    variant="outline-secondary" 
                                    size="sm"
                                    onClick={clearFilters}
                                    title="Очистить фильтры"
                                >
                                    ×
                                </Button>
                            </Col>
                        )}
                    </Row>
                </Col>
            </Row>
        </div>
    );
});

export default PositionFilters;