import React, { useState, useEffect } from 'react';
import Modal from "react-bootstrap/Modal";
import { Button, Form, Alert, Tabs, Tab } from "react-bootstrap";
import { observer } from "mobx-react-lite";
import { createProduct, deleteProduct, fetchProducts } from "../../http/productApi";
import { fetchCategories } from "../../http/categoryApi";

const CreateProduct = observer(({ show, onHide, onProductCreated, onProductDeleted }) => {
    const [activeTab, setActiveTab] = useState('add');
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [img, setImg] = useState(null);
    const [selectedProductId, setSelectedProductId] = useState('');
    const [categories, setCategories] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Загрузка данных при открытии модалки
    useEffect(() => {
        if (show) {
            loadCategories();
            loadProducts();
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

    const loadProducts = async () => {
        try {
            const data = await fetchProducts(null, 100, 1); // Все продукты
            setProducts(data.rows || data);
        } catch (err) {
            console.error('Ошибка загрузки продуктов:', err);
        }
    };

    const handleCreateProduct = async () => {
        if (!name.trim()) {
            setError('Введите название продукта');
            return;
        }
        if (!categoryId) {
            setError('Выберите категорию');
            return;
        }
        if (!img) {
            setError('Выберите изображение');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const formData = new FormData();
            formData.append('name', name.trim());
            formData.append('description', description.trim());
            formData.append('categoryId', categoryId);
            formData.append('img', img);

            const newProduct = await createProduct(formData);
            
            setName('');
            setDescription('');
            setCategoryId('');
            setImg(null);
            
            // Уведомляем родительский компонент
            if (onProductCreated) {
                onProductCreated(newProduct);
            }
            
        } catch (err) {
            setError(err.response?.data?.message || 'Ошибка при создании продукта');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteProduct = async () => {
        if (!selectedProductId) {
            setError('Выберите продукт для удаления');
            return;
        }

        if (!window.confirm('Вы уверены, что хотите удалить этот продукт? Все связанные позиции также будут удалены.')) {
            return;
        }

        setLoading(true);
        setError('');

        try {
            await deleteProduct(selectedProductId);
            
            setSelectedProductId('');
            
            await loadProducts();
            
            // Уведомляем родительский компонент
            if (onProductDeleted) {
                onProductDeleted(selectedProductId);
            }
            
        } catch (err) {
            setError(err.response?.data?.message || 'Ошибка при удалении продукта');
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                setError('Выберите файл изображения');
                return;
            }
            setImg(file);
            setError('');
        }
    };

    const handleClose = () => {
        setName('');
        setDescription('');
        setCategoryId('');
        setImg(null);
        setSelectedProductId('');
        setError('');
        setActiveTab('add');
        onHide();
    };

    const getSelectedProduct = () => {
        // eslint-disable-next-line eqeqeq
        return products.find(p => p.id == selectedProductId);
    };

    return (
        <Modal show={show} onHide={handleClose} centered size="lg">
            <Modal.Header closeButton>
                <Modal.Title>Управление продуктами</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Tabs
                    activeKey={activeTab}
                    onSelect={(tab) => setActiveTab(tab)}
                    className="mb-3"
                >
                    {/* Вкладка добавления */}
                    <Tab eventKey="add" title="➕ Добавить продукт">
                        {activeTab === 'add' && (
                            <div className="mt-3">
                                {error && (
                                    <Alert variant="danger" className="mb-3">
                                        {error}
                                    </Alert>
                                )}

                                <Form>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Название продукта *</Form.Label>
                                        <Form.Control
                                            value={name}
                                            onChange={e => setName(e.target.value)}
                                            placeholder="Введите название продукта"
                                            disabled={loading}
                                        />
                                    </Form.Group>

                                    <Form.Group className="mb-3">
                                        <Form.Label>Описание</Form.Label>
                                        <Form.Control
                                            as="textarea"
                                            rows={3}
                                            value={description}
                                            onChange={e => setDescription(e.target.value)}
                                            placeholder="Введите описание продукта"
                                            disabled={loading}
                                        />
                                    </Form.Group>

                                    <Form.Group className="mb-3">
                                        <Form.Label>Категория *</Form.Label>
                                        <Form.Select
                                            value={categoryId}
                                            onChange={e => setCategoryId(e.target.value)}
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

                                    <Form.Group className="mb-3">
                                        <Form.Label>Изображение продукта *</Form.Label>
                                        <Form.Control
                                            type="file"
                                            accept="image/*"
                                            onChange={handleFileChange}
                                            disabled={loading}
                                        />
                                        {img && (
                                            <Alert variant="info" className="mt-2 py-2 small">
                                                Выбран файл: {img.name}
                                            </Alert>
                                        )}
                                    </Form.Group>
                                </Form>

                                <Button 
                                    variant="success" 
                                    onClick={handleCreateProduct}
                                    disabled={loading || !name.trim() || !categoryId || !img}
                                    className="w-100"
                                >
                                    {loading ? 'Создание...' : 'Создать продукт'}
                                </Button>
                            </div>
                        )}
                    </Tab>

                    {/* Вкладка удаления */}
                    <Tab eventKey="delete" title="❌ Удалить продукт">
                        {activeTab === 'delete' && (
                            <div className="mt-3">
                                {error && (
                                    <Alert variant="danger" className="mb-3">
                                        {error}
                                    </Alert>
                                )}

                                <Form.Group className="mb-3">
                                    <Form.Label>Выберите продукт для удаления</Form.Label>
                                    <Form.Select
                                        value={selectedProductId}
                                        onChange={e => setSelectedProductId(e.target.value)}
                                        disabled={loading || products.length === 0}
                                    >
                                        <option value="">-- Выберите продукт --</option>
                                        {products.map(product => (
                                            <option key={product.id} value={product.id}>
                                                {product.name} ({product.category?.name})
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>

                                {selectedProductId && (
                                    <Alert variant="warning" className="mb-3">
                                        <strong>Будет удалено:</strong><br />
                                        Продукт: {getSelectedProduct()?.name}<br />
                                        Категория: {getSelectedProduct()?.category?.name}<br />
                                        <small className="text-danger">
                                            Все связанные позиции также будут удалены!
                                        </small>
                                    </Alert>
                                )}

                                <Button 
                                    variant="danger" 
                                    onClick={handleDeleteProduct}
                                    disabled={loading || !selectedProductId}
                                    className="w-100"
                                >
                                    {loading ? 'Удаление...' : 'Удалить продукт'}
                                </Button>
                            </div>
                        )}
                    </Tab>
                </Tabs>
            </Modal.Body>
        </Modal>
    );
});

export default CreateProduct;