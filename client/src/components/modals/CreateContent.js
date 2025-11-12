import React, { useState, useEffect } from 'react';
import Modal from "react-bootstrap/Modal";
import { Button, Form, Alert, Row, Col } from "react-bootstrap";
import { observer } from "mobx-react-lite";
import { $authHost } from "../../http";

const CreateContentModal = observer(({ 
    show, 
    onHide, 
    onContentCreated, 
    onContentUpdated,
    editContent 
}) => {
    const [key, setKey] = useState('');
    const [text, setText] = useState('');
    const [image, setImage] = useState(null);
    const [currentImage, setCurrentImage] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Заполнение формы при редактировании
    useEffect(() => {
        if (editContent) {
            setKey(editContent.key);
            setText(editContent.text || '');
            setCurrentImage(editContent.image);
        } else {
            setKey('');
            setText('');
            setImage(null);
            setCurrentImage(null);
        }
    }, [editContent, show]);

    const handleSaveContent = async () => {
        // Валидация
        if (!key.trim()) {
            setError('Введите ключ контента');
            return;
        }

        setLoading(true);
        setError('');

        try {
            if (editContent) {
                // Редактирование существующего контента
                await handleUpdateContent();
            } else {
                // Создание нового контента
                await handleCreateContent();
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Ошибка при сохранении контента');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateContent = async () => {
        const formData = new FormData();
        formData.append('key', key.trim());
        formData.append('text', text.trim());
        if (image) {
            formData.append('image', image);
        }

        const { data } = await $authHost.post('api/bot/content', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });

        // Сбрасываем форму
        resetForm();
        
        // Уведомляем родительский компонент
        if (onContentCreated) {
            onContentCreated(data);
        }
        
        // Закрываем модалку
        onHide();
    };

    const handleUpdateContent = async () => {
        const formData = new FormData();
        formData.append('key', key.trim());
        formData.append('text', text.trim());
        if (image) {
            formData.append('image', image);
        }

        const { data } = await $authHost.put(`api/bot/content/${editContent.id}`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });

        resetForm();
        if (onContentUpdated) onContentUpdated(data);
        onHide();
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                setError('Выберите файл изображения');
                return;
            }
            setImage(file);
            setError('');
        }
    };

    const resetForm = () => {
        setKey('');
        setText('');
        setImage(null);
        setCurrentImage(null);
        setError('');
    };

    const handleClose = () => {
        resetForm();
        onHide();
    };

    const isEditMode = Boolean(editContent);

    return (
        <Modal show={show} onHide={handleClose} centered size="lg">
            <Modal.Header closeButton>
                <Modal.Title>
                    {isEditMode ? 'Редактировать блок контента' : 'Добавить блок контента'}
                </Modal.Title>
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
                                <Form.Label>Ключ контента *</Form.Label>
                                <Form.Control
                                    value={key}
                                    onChange={e => setKey(e.target.value)}
                                    placeholder="Например: welcome, help, about"
                                    disabled={loading}
                                />
                                <Form.Text className="text-muted">
                                    Уникальный идентификатор для команды бота
                                </Form.Text>
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>
                                    Изображение {isEditMode && '(оставьте пустым чтобы не менять)'}
                                </Form.Label>
                                <Form.Control
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    disabled={loading}
                                />
                                <Form.Text className="text-muted">
                                    Опциональное изображение для контента
                                </Form.Text>
                            </Form.Group>
                        </Col>
                    </Row>

                    <Form.Group className="mb-3">
                        <Form.Label>Текст сообщения</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={4}
                            value={text}
                            onChange={e => setText(e.target.value)}
                            placeholder="Введите текст сообщения для бота..."
                            disabled={loading}
                        />
                        <Form.Text className="text-muted">
                            Текст который бот будет отправлять пользователю
                        </Form.Text>
                    </Form.Group>

                    {/* Предпросмотр текущего изображения в режиме редактирования */}
                    {isEditMode && currentImage && !image && (
                        <Alert variant="info" className="py-2">
                            <strong>Текущее изображение:</strong>{' '}
                            <a 
                                href={`http://localhost:5050/${currentImage}`} 
                                target="_blank" 
                                rel="noopener noreferrer"
                            >
                                {currentImage}
                            </a>
                        </Alert>
                    )}

                    {/* Предпросмотр нового изображения */}
                    {image && (
                        <Alert variant="success" className="py-2">
                            <strong>Новое изображение:</strong> {image.name}
                        </Alert>
                    )}
                </Form>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="outline-secondary" onClick={handleClose} disabled={loading}>
                    Отмена
                </Button>
                <Button 
                    variant={isEditMode ? "primary" : "success"} 
                    onClick={handleSaveContent}
                    disabled={loading || !key.trim()}
                >
                    {loading ? 'Сохранение...' : (isEditMode ? 'Обновить' : 'Создать')}
                </Button>
            </Modal.Footer>
        </Modal>
    );
});

export default CreateContentModal;