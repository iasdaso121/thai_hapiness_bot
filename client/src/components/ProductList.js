// import { Card, ListGroup, Spinner } from "react-bootstrap";
// import { observer } from "mobx-react-lite";
// import ProductItem from "./ProductItem";

// const ProductsList = observer(({ 
//     products, 
//     loading, 
//     selectedCategory, 
//     onProductClick 
// }) => {
//     return (
//         <Card>
//             <Card.Header>
//                 <h6 className="mb-0">
//                     Продукты 
//                     {selectedCategory && ` - ${selectedCategory.name}`}
//                     <span className="text-muted ms-2">
//                         ({products.length})
//                     </span>
//                 </h6>
//             </Card.Header>
            
//             {loading ? (
//                 <Card.Body className="text-center">
//                     <Spinner animation="border" />
//                 </Card.Body>
//             ) : (
//                 <ListGroup variant="flush">
//                     {products.map(product => (
//                         <ProductItem 
//                             key={product.id}
//                             product={product}
//                             onProductClick={onProductClick}
//                         />
//                     ))}
//                 </ListGroup>
//             )}

//             {!loading && products.length === 0 && (
//                 <Card.Body className="text-center">
//                     <p className="text-muted mb-0">
//                         {selectedCategory 
//                             ? `Нет продуктов в категории "${selectedCategory.name}"`
//                             : 'Нет продуктов'
//                         }
//                     </p>
//                 </Card.Body>
//             )}
//         </Card>
//     );
// });

// export default ProductsList;
import React from "react";
import { Card, ListGroup, Spinner, Alert } from "react-bootstrap";
import { observer } from "mobx-react-lite";
import ProductItem from "./ProductItem";

const ProductsList = observer(({ 
    products, 
    loading, 
    selectedCategory, 
    onProductClick 
}) => {
    return (
        <Card>
            <Card.Header>
                <div className="d-flex justify-content-between align-items-center">
                    <h6 className="text-dark mb-0">
                        {selectedCategory ? (
                            <>
                                Продукты в категории: 
                                <span className="text-secondary ms-2">
                                    {selectedCategory.name}
                                </span>
                            </>
                        ) : (
                            "Все продукты"
                        )}
                    </h6>
                    <span className="text-muted">
                        Найдено: {products.length}
                    </span>
                </div>
            </Card.Header>
            
            {loading ? (
                <Card.Body className="text-center">
                    <Spinner animation="border" />
                    <div className="mt-2 text-muted">Загрузка продуктов...</div>
                </Card.Body>
            ) : (
                <>
                    <ListGroup variant="flush">
                        {products.map(product => (
                            <ProductItem 
                                key={product.id}
                                product={product}
                                onProductClick={onProductClick}
                            />
                        ))}
                    </ListGroup>

                    {products.length === 0 && (
                        <Card.Body className="text-center">
                            <Alert variant="info" className="mb-0">
                                {selectedCategory ? (
                                    <>
                                        <strong>В категории "{selectedCategory.name}" нет продуктов</strong><br />
                                        <small>Создайте первый продукт в этой категории</small>
                                    </>
                                ) : (
                                    <>
                                        <strong>Нет продуктов</strong><br />
                                        <small>Создайте первый продукт</small>
                                    </>
                                )}
                            </Alert>
                        </Card.Body>
                    )}
                </>
            )}
        </Card>
    );
});

export default ProductsList;