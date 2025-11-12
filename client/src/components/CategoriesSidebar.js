import React from "react";
// bg="secondary"
import { Card, ListGroup, Button } from "react-bootstrap";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import CategoriesModal from "./modals/CategoriesModal";

const CategoriesSidebar = observer(({ 
    categories, 
    selectedCategory, 
    onCategorySelect,
    onCategoriesUpdate
}) => {
    const [modalShow, setModalShow] = useState(false);

    return (
        <>
        <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
                <h6 className="mb-0">Категории</h6>
                <Button 
                    variant="outline-secondary"
                    size="sm"
                    onClick={() => setModalShow(true)}
                    title="Управление категориями"
                >
                    ...
                </Button>
            </Card.Header>
            <ListGroup variant="flush">
                <ListGroup.Item 
                    action
                    active={!selectedCategory}
                    onClick={() => onCategorySelect(null)}
                    style={{cursor: 'pointer'}}
                >
                    Все категории
                </ListGroup.Item>
                {categories.map(category => (
                    <ListGroup.Item 
                        key={category.id}
                        action
                        active={selectedCategory?.id === category.id}
                        onClick={() => onCategorySelect(category)}
                        style={{cursor: 'pointer'}}
                    >
                        {category.name}
                        {category.productsCount && (
                            <span className="text-muted float-end">
                                ({category.productsCount})
                            </span>
                        )}
                    </ListGroup.Item>
                ))}
            </ListGroup>
        </Card>

        <CategoriesModal 
            show={modalShow}
            onHide={() => setModalShow(false)}
            onCategoriesUpdate={onCategoriesUpdate}
        />
        </>
    );
});

export default CategoriesSidebar;