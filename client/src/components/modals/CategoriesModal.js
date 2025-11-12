import React, { useState, useEffect } from 'react';
import Modal from "react-bootstrap/Modal";
import { Button, Form, Tabs, Tab, Alert } from "react-bootstrap";
import { observer } from "mobx-react-lite";
import { createCategory, fetchCategories, deleteCategory } from "../../http/categoryApi";

const CategoriesModal = observer(({ show, onHide, onCategoriesUpdate }) => {
    const [activeTab, setActiveTab] = useState('add');
    const [categories, setCategories] = useState([]);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [selectedCategoryId, setSelectedCategoryId] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Загрузка категорий при открытии модалки
    useEffect(() => {
        if (show) {
            loadCategories();
        }
    }, [show]);

    const loadCategories = async () => {
        try {
            const data = await fetchCategories();
            setCategories(data);
        } catch (err) {
            console.error('Ошибка загрузки категорий:', err);
        }
    };

    const handleCreateCategory = async () => {
        if (!newCategoryName.trim()) {
            setError('Введите название категории');
            return;
        }

        setLoading(true);
        setError('');
        try {
            await createCategory({ name: newCategoryName.trim() });
            setNewCategoryName('');
            await loadCategories(); // Перезагружаем список
            if (onCategoriesUpdate) onCategoriesUpdate();
        } catch (err) {
            setError(err.response?.data?.message || 'Ошибка при создании категории');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteCategory = async () => {
        if (!selectedCategoryId) {
            setError('Выберите категорию для удаления');
            return;
        }

        if (!window.confirm('Вы уверены, что хотите удалить эту категорию?')) {
            return;
        }

        setLoading(true);
        setError('');
        try {
            await deleteCategory(selectedCategoryId);
            setSelectedCategoryId('');
            await loadCategories(); // Перезагружаем список
            if (onCategoriesUpdate) onCategoriesUpdate();
        } catch (err) {
            setError(err.response?.data?.message || 'Ошибка при удалении категории');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setActiveTab('add');
        setNewCategoryName('');
        setSelectedCategoryId('');
        setError('');
        onHide();
    };

    return (
        <Modal show={show} onHide={handleClose} centered>
            <Modal.Header closeButton>
                <Modal.Title>Управление категориями</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Tabs
                    activeKey={activeTab}
                    onSelect={(tab) => setActiveTab(tab)}
                    className="mb-3"
                >
                    {/* Вкладка добавления */}
                    <Tab eventKey="add" title="➕ Добавить">
                        {activeTab === 'add' && (
                            <div className="mt-3">
                                <Form.Group>
                                    <Form.Label>Название новой категории</Form.Label>
                                    <Form.Control
                                        value={newCategoryName}
                                        onChange={e => setNewCategoryName(e.target.value)}
                                        placeholder="Введите название категории"
                                        disabled={loading}
                                    />
                                </Form.Group>
                                <Button
                                    variant="success"
                                    className="mt-3"
                                    onClick={handleCreateCategory}
                                    disabled={loading || !newCategoryName.trim()}
                                >
                                    {loading ? 'Создание...' : 'Создать категорию'}
                                </Button>
                            </div>
                        )}
                    </Tab>

                    {/* Вкладка удаления */}
                    <Tab eventKey="delete" title="❌ Удалить">
                        {activeTab === 'delete' && (
                            <div className="mt-3">
                                <Form.Group>
                                    <Form.Label>Выберите категорию для удаления</Form.Label>
                                    <Form.Select
                                        value={selectedCategoryId}
                                        onChange={e => setSelectedCategoryId(e.target.value)}
                                        disabled={loading || categories.length === 0}
                                    >
                                        <option value="">-- Выберите категорию --</option>
                                        {categories.map(category => (
                                            <option key={category.id} value={category.id}>
                                                {category.name}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                                
                                {categories.length > 0 && selectedCategoryId && (
                                    <Alert variant="warning" className="mt-3 small">
                                        Будет удалена категория: <strong>{
                                            // eslint-disable-next-line eqeqeq
                                            categories.find(c => c.id == selectedCategoryId)?.name
                                        }</strong>
                                    </Alert>
                                )}

                                <Button
                                    variant="danger"
                                    className="mt-3"
                                    onClick={handleDeleteCategory}
                                    disabled={loading || !selectedCategoryId}
                                >
                                    {loading ? 'Удаление...' : 'Удалить категорию'}
                                </Button>
                            </div>
                        )}
                    </Tab>
                </Tabs>

                {/* Список существующих категорий */}
                {/* {categories.length > 0 && (
                    <div className="mt-3">
                        <h6 className="text-muted">Существующие категории:</h6>
                        <ListGroup variant="flush">
                            {categories.map(category => (
                                <ListGroup.Item key={category.id} className="px-0 py-1 small">
                                    • {category.name}
                                </ListGroup.Item>
                            ))}
                        </ListGroup>
                    </div>
                )}

                {categories.length === 0 && (
                    <Alert variant="info" className="mt-3">
                        Нет созданных категорий
                    </Alert>
                )} */}

                {/* Вывод ошибок */}
                {error && (
                    <Alert variant="danger" className="mt-3">
                        {error}
                    </Alert>
                )}
            </Modal.Body>
        </Modal>
    );
});

export default CategoriesModal;