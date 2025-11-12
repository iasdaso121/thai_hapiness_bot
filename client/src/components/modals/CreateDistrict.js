import React, { useState } from 'react';
import Modal from "react-bootstrap/Modal";
import { Button, Form, Alert } from "react-bootstrap";
import { observer } from "mobx-react-lite";
import { createDistrict } from "../../http/districtApi";

const CreateDistrict = observer(({ show, onHide, onSuccess, cityId, cityName }) => {
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);

    const addDistrict = async () => {
        if (!name.trim()) {
            alert('Введите название района');
            return;
        }

        if (!cityId) {
            alert('Город не выбран');
            return;
        }

        setLoading(true);
        try {
            await createDistrict({ 
                name: name.trim(),
                cityId: cityId
            });
            setName('');
            onSuccess();
        } catch (error) {
            console.error('Ошибка создания района:', error);
            alert(error.response?.data?.message || 'Ошибка при создании района');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setName('');
        onHide();
    };

    return (
        <Modal show={show} onHide={handleClose} centered>
            <Modal.Header closeButton>
                <Modal.Title>Добавить район</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {cityName && (
                    <Alert variant="info">
                        Город: <strong>{cityName}</strong>
                    </Alert>
                )}
                <Form>
                    <Form.Group className="mb-3">
                        <Form.Label>Название района</Form.Label>
                        <Form.Control
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="Введите название района"
                        />
                    </Form.Group>
                </Form>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="outline-danger" onClick={handleClose}>
                    Отмена
                </Button>
                <Button 
                    variant="success" 
                    onClick={addDistrict}
                    disabled={loading || !name.trim() || !cityId}
                >
                    {loading ? 'Добавление...' : 'Добавить'}
                </Button>
            </Modal.Footer>
        </Modal>
    );
});

export default CreateDistrict;