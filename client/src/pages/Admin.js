import React from 'react';
import {Container, Card, Button} from "react-bootstrap";
import {useNavigate} from "react-router-dom";
import { ADMIN_CITIES_ROUTE, ADMIN_PRODUCTS_ROUTE, ADMIN_CONTENT_ROUTE } from "../utils/consts";

const Admin = () => {
    const navigate = useNavigate()

    return (
        <Container className="mt-4">
            <h2>Панель администратора</h2>
            <p>Выберите раздел для управления:</p>
            
            <div className="d-flex gap-3 flex-wrap">
                <Card style={{ width: '18rem' }}>
                    <Card.Body>
                        <Card.Title>Города и районы</Card.Title>
                        <Card.Text>
                            Управление городами и районами доставки
                        </Card.Text>
                        <Button 
                            variant="primary"
                            onClick={() => navigate(ADMIN_CITIES_ROUTE)}>
                            Перейти
                        </Button>
                    </Card.Body>
                </Card>

                <Card style={{ width: '18rem' }}>
                    <Card.Body>
                        <Card.Title>Продукты и позиции</Card.Title>
                        <Card.Text>
                            Управление товарами и активными позициями
                        </Card.Text>
                        <Button 
                            variant="primary"
                            onClick={() => navigate(ADMIN_PRODUCTS_ROUTE)}>
                            Перейти
                        </Button>
                    </Card.Body>
                </Card>

                <Card style={{ width: '18rem' }}>
                    <Card.Body>
                        <Card.Title>Контент бота</Card.Title>
                        <Card.Text>
                            Управление текстами и изображениями для бота
                        </Card.Text>
                        <Button 
                            variant="primary"
                            onClick={() => navigate(ADMIN_CONTENT_ROUTE)}>
                            Перейти
                        </Button>
                    </Card.Body>
                </Card>
            </div>
        </Container>
    );
};

export default Admin;