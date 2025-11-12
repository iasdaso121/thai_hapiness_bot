import React, { useState, useEffect } from 'react';
import { Container, Button, Card, Row, Col, Alert, Spinner, Modal, Badge } from "react-bootstrap";
import { observer } from "mobx-react-lite";
import CreateContent from "../components/modals/CreateContent";
import { $authHost } from "../http";
import ContentCard from '../components/ContentCard';

const ContentAdmin = observer(() => {
    const [contentBlocks, setContentBlocks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [contentModalShow, setContentModalShow] = useState(false);
    const [imageModalShow, setImageModalShow] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);

    // Загрузка контента при монтировании
    useEffect(() => {
        loadContent();
    }, []);

    const loadContent = async () => {
        setLoading(true);
        setError('');
        try {
            const { data } = await $authHost.get('api/bot/content');
            setContentBlocks(data);
        } catch (err) {
            setError('Ошибка загрузки контента');
            console.error('Ошибка загрузки контента:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleContentCreated = () => {
        loadContent();
    };

    const handleContentUpdated = () => {
        loadContent();
    };

    const handleContentDeleted = () => {
        loadContent();
    };

    const handleImageClick = (imageUrl) => {
        if (imageUrl) {
            setSelectedImage(`http://localhost:5050/${imageUrl}`);
            setImageModalShow(true);
        }
    };

    const handleDeleteContent = async (contentId) => {
        if (!window.confirm('Вы уверены, что хотите удалить этот блок контента?')) {
            return;
        }

        try {
            await $authHost.delete(`api/bot/content/${contentId}`);
            handleContentDeleted();
        } catch (err) {
            alert(err.response?.data?.message || 'Ошибка при удалении контента');
            console.error('Ошибка удаления контента:', err);
        }
    };

    return (
        <Container className="mt-4">
            {/* Заголовок и кнопка */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>Управление контентом бота</h2>
                <Button 
                    variant="success"
                    onClick={() => setContentModalShow(true)}
                >
                    + Добавить блок контента
                </Button>
            </div>

            {/* Информационное поле */}
            <Alert variant="info" className="mb-4">
                <h6 className="mb-2">Основные ключи для команд:</h6>
                <div className="d-flex gap-3">
                    <Badge bg="primary">welcome</Badge>
                    <Badge bg="primary">help</Badge>
                    <Badge bg="primary">about</Badge>
                    <Badge bg="secondary">contacts</Badge>
                    <Badge bg="secondary">payment</Badge>
                </div>
                <small className="d-block mt-2">
                    Эти ключи используются ботом для ответов на команды пользователей
                </small>
            </Alert>

            {/* Сообщения об ошибках */}
            {error && (
                <Alert variant="danger" className="mb-3">
                    {error}
                </Alert>
            )}

            {/* Список блоков контента */}
            {loading ? (
                <div className="text-center">
                    <Spinner animation="border" />
                    <div className="mt-2 text-muted">Загрузка контента...</div>
                </div>
            ) : (
                <Row>
                    {contentBlocks.map(content => (
                        <Col key={content.id} md={6} lg={4} className="mb-3">
                            <ContentCard 
                                content={content}
                                onImageClick={handleImageClick}
                                onEdit={() => setContentModalShow(content)}
                                onDelete={handleDeleteContent}
                            />
                        </Col>
                    ))}
                </Row>
            )}

            {!loading && contentBlocks.length === 0 && (
                <Card className="text-center p-5">
                    <Card.Body>
                        <h5 className="text-muted">Нет блоков контента</h5>
                        <p className="text-muted mb-3">
                            Создайте первый блок контента для бота
                        </p>
                        <Button 
                            variant="success"
                            onClick={() => setContentModalShow(true)}
                        >
                            Создать первый блок
                        </Button>
                    </Card.Body>
                </Card>
            )}

            {/* Модальное окно создания/редактирования контента */}
            <CreateContent
                show={contentModalShow}
                onHide={() => setContentModalShow(false)}
                onContentCreated={handleContentCreated}
                onContentUpdated={handleContentUpdated}
                editContent={typeof contentModalShow === 'object' ? contentModalShow : null}
            />

            {/* Модальное окно просмотра изображения */}
            <Modal show={imageModalShow} onHide={() => setImageModalShow(false)} centered size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>Просмотр</Modal.Title>
                </Modal.Header>
                <Modal.Body className="text-center">
                    {selectedImage && (
                        <img 
                            src={selectedImage} 
                            alt="Контент бота" 
                            style={{ maxWidth: '100%', maxHeight: '70vh' }}
                        />
                    )}
                </Modal.Body>
            </Modal>
        </Container>
    );
});


export default ContentAdmin;