import { observer } from "mobx-react-lite";
import { Button, ListGroup, Row, Col } from "react-bootstrap";
import { deletePosition } from "../http/positionApi";

const PositionItem = observer(({ position, onPositionDeleted }) => {
    const handleDelete = async () => {
        if (!window.confirm(`Удалить позицию "${position.name}"?`)) {
            return;
        }
        
        try {
            await deletePosition(position.id);
            if (onPositionDeleted) onPositionDeleted();
        } catch (err) {
            alert(err.response?.data?.message || 'Ошибка при удалении позиции');
            console.error('Ошибка удаления позиции:', err);
        }
    };

    return (
        <ListGroup.Item className="p-3">
            <Row className="align-items-center">
                <Col>
                    <h6 className="mb-1">{position.name}</h6>
                    <div className="d-flex gap-3 align-items-center text-muted small">
                        <span>Цена: <strong className="text-dark">{position.price} ₽</strong></span>
                        <span>Тип: <strong>{position.type}</strong></span>
                        <span>Местоположение: <strong>{position.location}</strong></span>
                    </div>
                    <div className="mt-1">
                        <small className="text-muted">
                            Город: <strong>{position.city?.name}</strong>
                            {position.district && `, Район: ${position.district.name}`}
                        </small>
                    </div>
                </Col>
                <Col md="auto">
                    <Button 
                        variant="outline-danger" 
                        size="sm"
                        onClick={handleDelete}
                    >
                        Удалить
                    </Button>
                </Col>
            </Row>
        </ListGroup.Item>
    );
});

export default PositionItem;