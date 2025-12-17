import React, { useState } from 'react';
import Modal from "react-bootstrap/Modal";
import { Button, Form, Alert } from "react-bootstrap";
import { createReview } from "../../http/reviewAPI";

const CreateReview = ({ show, onHide, onReviewCreated }) => {
    const [author, setAuthor] = useState('');
    const [text, setText] = useState('');
    const [rating, setRating] = useState(5);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSave = async () => {
        if (!author.trim() || !text.trim()) {
            setError('Заполните все поля');
            return;
        }

        setLoading(true);
        setError('');

        try {
            await createReview({ author, text, rating });
            setAuthor('');
            setText('');
            setRating(5);
            onReviewCreated();
            onHide();
        } catch (err) {
            setError(err.response?.data?.message || 'Ошибка при создании отзыва');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal show={show} onHide={onHide} centered>
            <Modal.Header closeButton>
                <Modal.Title>Добавить отзыв</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {error && <Alert variant="danger">{error}</Alert>}
                <Form>
                    <Form.Group className="mb-3">
                        <Form.Label>Автор</Form.Label>
                        <Form.Control
                            value={author}
                            onChange={e => setAuthor(e.target.value)}
                            placeholder="Имя автора"
                        />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Оценка (0-5)</Form.Label>
                        <Form.Control
                            type="number"
                            min="0"
                            max="5"
                            value={rating}
                            onChange={e => setRating(Number(e.target.value))}
                        />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Текст отзыва</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={3}
                            value={text}
                            onChange={e => setText(e.target.value)}
                            placeholder="Текст отзыва"
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

export default CreateReview;
