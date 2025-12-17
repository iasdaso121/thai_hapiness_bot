import React, { useState, useEffect } from 'react';
import { Container, Button, Card, Row, Col, Spinner, Badge } from "react-bootstrap";
import { fetchReviews, deleteReview } from "../http/reviewAPI";
import CreateReview from "../components/modals/CreateReview";
import CreateBulkReviews from "../components/modals/CreateBulkReviews";

const ReviewsAdmin = () => {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showBulkModal, setShowBulkModal] = useState(false);

    useEffect(() => {
        loadReviews();
    }, []);

    const loadReviews = async () => {
        try {
            const data = await fetchReviews();
            setReviews(data);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Удалить отзыв?')) {
            await deleteReview(id);
            loadReviews();
        }
    };

    if (loading) {
        return <Spinner animation="border" />;
    }

    return (
        <Container className="mt-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>Управление отзывами</h2>
                <div>
                    <Button onClick={() => setShowModal(true)} className="me-2">Добавить отзыв</Button>
                    <Button variant="secondary" onClick={() => setShowBulkModal(true)}>Массовое добавление</Button>
                </div>
            </div>

            <Row>
                {reviews.map(review => (
                    <Col key={review.id} md={4} className="mb-3">
                        <Card>
                            <Card.Body>
                                <div className="d-flex justify-content-between align-items-start">
                                    <Card.Title>{review.author}</Card.Title>
                                    <Badge bg="warning" text="dark">★ {review.rating}</Badge>
                                </div>
                                <Card.Text>{review.text}</Card.Text>
                                <Button variant="danger" onClick={() => handleDelete(review.id)}>Удалить</Button>
                            </Card.Body>
                        </Card>
                    </Col>
                ))}
            </Row>

            <CreateReview
                show={showModal}
                onHide={() => setShowModal(false)}
                onReviewCreated={loadReviews}
            />
            <CreateBulkReviews
                show={showBulkModal}
                onHide={() => setShowBulkModal(false)}
                onReviewsCreated={loadReviews}
            />
        </Container>
    );
};

export default ReviewsAdmin;
