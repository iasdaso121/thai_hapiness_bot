import React, { useState } from 'react';
import Modal from "react-bootstrap/Modal";
import { Button, Form, Alert } from "react-bootstrap";
import { createBulkReviews } from "../../http/reviewAPI";

const CreateBulkReviews = ({ show, onHide, onReviewsCreated }) => {
    const [jsonText, setJsonText] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSave = async () => {
        if (!jsonText.trim()) {
            setError('Введите JSON');
            return;
        }

        setLoading(true);
        setError('');

        try {
            let reviews;
            try {
                reviews = JSON.parse(jsonText);
            } catch (e) {
                throw new Error('Неверный формат JSON');
            }

            if (!Array.isArray(reviews)) {
                throw new Error('JSON должен быть массивом');
            }

            await createBulkReviews(reviews);
            setJsonText('');
            onReviewsCreated();
            onHide();
        } catch (err) {
            setError(err.message || err.response?.data?.message || 'Ошибка при создании отзывов');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal show={show} onHide={onHide} centered size="lg">
            <Modal.Header closeButton>
                <Modal.Title>Массовое добавление отзывов</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Alert variant="info">
                    Введите массив отзывов в формате JSON:<br />
                    <code>[&#123;"author": "Иван", "text": "Отлично!", "rating": 5&#125;, ...]</code>
                </Alert>
                {error && <Alert variant="danger">{error}</Alert>}
                <Form>
                    <Form.Group className="mb-3">
                        <Form.Control
                            as="textarea"
                            rows={10}
                            value={jsonText}
                            onChange={e => setJsonText(e.target.value)}
                            placeholder='[{"author": "Name", "text": "Review", "rating": 5}]'
                        />
                    </Form.Group>
                </Form>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onHide}>Отмена</Button>
                <Button variant="primary" onClick={handleSave} disabled={loading}>
                    {loading ? 'Сохранение...' : 'Добавить'}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default CreateBulkReviews;
