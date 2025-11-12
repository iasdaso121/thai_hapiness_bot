import React, { useState } from 'react';
import Modal from "react-bootstrap/Modal";
import { Button, Form } from "react-bootstrap";
import { observer } from "mobx-react-lite";
import { createCity } from "../../http/cityApi";

const CreateCity = observer(({ show, onHide, onSuccess }) => {
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);

    const addCity = async () => {
        if (!name.trim()) {
            alert('Введите название города');
            return;
        }

        setLoading(true);
        try {
            await createCity({ name: name.trim() });
            setName('');
            onSuccess();
        } catch (error) {
            console.error('Ошибка создания города:', error);
            alert(error.response?.data?.message || 'Ошибка при создании города');
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
                <Modal.Title>Добавить город</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form>
                    <Form.Group className="mb-3">
                        <Form.Label>Название города</Form.Label>
                        <Form.Control
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="Введите название города"
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
                    onClick={addCity}
                    disabled={loading || !name.trim()}
                >
                    {loading ? 'Добавление...' : 'Добавить'}
                </Button>
            </Modal.Footer>
        </Modal>
    );
});

export default CreateCity;