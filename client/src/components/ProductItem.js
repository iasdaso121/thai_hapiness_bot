import React from "react";
import { ListGroup, Badge } from "react-bootstrap";
import { observer } from "mobx-react-lite";

const ProductItem = observer(({ product, onProductClick }) => {
    return (
        <ListGroup.Item 
            action
            onClick={() => onProductClick(product.id)}
            style={{cursor: 'pointer'}}
            className="p-3"
        >
            <div className="d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center flex-grow-1">
                    {product.img && (
                        <img 
                            src={`http://localhost:5050/${product.img}`}
                            alt={product.name}
                            style={{
                                width: '50px',
                                height: '50px',
                                objectFit: 'cover',
                                borderRadius: '5px',
                                marginRight: '15px'
                            }}
                        />
                    )}
                    <div>
                        <h6 className="mb-1">{product.name}</h6>
                        <p className="text-muted mb-0 small">
                            {product.description}
                        </p>
                    </div>
                </div>

                {/*  */}
                
                <div className="text-end ms-3">
                    <div className="mb-1">
                        <small className="text-muted">
                            Категория: <strong>{product.category?.name}</strong>
                        </small>
                    </div>
                    <div className="mb-1">
                        <Badge 
                            bg="dark" 
                            text="white"
                            style={{ fontSize: '0.75rem' }}
                        >
                            Позиций: {product.positions?.length || 0}
                        </Badge>
                    </div>
                    <div>
                        <small className="text-muted">
                            Нажмите для управления позициями
                        </small>
                    </div>
                </div>
            </div>
        </ListGroup.Item>
    );
});

export default ProductItem;