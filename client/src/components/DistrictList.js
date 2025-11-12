import React, { useState, useEffect } from "react";
import { ListGroup, Button, Spinner, Alert } from "react-bootstrap";
import { fetchDistricts, deleteDistrict } from "../http/districtApi";
import { observer } from "mobx-react-lite";

const DistrictList = observer(({ cityId, cityName, onDistrictChange, newDistrict }) => {
    const [districts, setDistricts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (cityId) {
            loadDistricts();
        }
    }, [cityId]);

    // Эффект для добавления нового района
    useEffect(() => {
        if (newDistrict) {
            setDistricts(prev => [...prev, newDistrict]);
        }
    }, [newDistrict]);

    const loadDistricts = async () => {
        setLoading(true);
        setError('');
        try {
            const data = await fetchDistricts(cityId);
            setDistricts(data);
        } catch (err) {
            setError('Ошибка загрузки районов');
            console.error('Ошибка загрузки районов:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteDistrict = async (districtId) => {
        if (!window.confirm('Вы уверены, что хотите удалить район?')) {
            return;
        }

        try {
            await deleteDistrict(districtId);
            setDistricts(prev => prev.filter(d => d.id !== districtId));
            if (onDistrictChange) onDistrictChange();
        } catch (err) {
            alert('Ошибка при удалении района');
            console.error('Ошибка удаления района:', err);
        }
    };

    if (!cityId) {
        return null;
    }

    return (
        <div className="mt-3">
            <h6 className="text-muted mb-2">Районы города "{cityName}":</h6>
            
            {error && (
                <Alert variant="danger" className="mb-2">
                    {error}
                </Alert>
            )}

            {loading ? (
                <div className="text-center">
                    <Spinner animation="border" size="sm" />
                </div>
            ) : (
                <>
                    {districts.length > 0 ? (
                        <ListGroup variant="flush">
                            {districts.map(district => (
                                <ListGroup.Item 
                                    key={district.id}
                                    className="d-flex justify-content-between align-items-center px-0"
                                >
                                    <span>{district.name}</span>
                                    <Button 
                                        variant="outline-danger" 
                                        size="sm"
                                        onClick={() => handleDeleteDistrict(district.id)}
                                    >
                                        Удалить
                                    </Button>
                                </ListGroup.Item>
                            ))}
                        </ListGroup>
                    ) : (
                        <p className="text-muted">Нет районов</p>
                    )}
                </>
            )}
        </div>
    );
});

export default DistrictList;