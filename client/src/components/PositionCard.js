import { Card, Badge } from "react-bootstrap";
import { observer } from "mobx-react-lite";

const PositionCard = observer(({ position }) => {
    return (
        <Card className="h-100 position-card">
            {position.product?.img && (
                <div style={{ height: '200px', overflow: 'hidden' }}>
                    <img 
                        src={`http://localhost:5050/${position.product.img}`}
                        alt={position.product.name}
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                        }}
                    />
                </div>
            )}
            
            <Card.Body className="d-flex flex-column">
                <div className="d-flex justify-content-between align-items-start mb-2">
                    <h6 className="card-title mb-0">{position.name}</h6>
                    <Badge 
                        bg="light"
                        className="text-capitalize"
                    >
                        {position.type}
                    </Badge>
                </div>

                <div className="mb-2">
                    <small className="text-muted d-block">
                        Продукт: <strong>{position.product?.name}</strong>
                    </small>
                    <small className="text-muted">
                        Категория: <strong>{position.product?.category?.name}</strong>
                    </small>
                </div>

                <div className="mb-2">
                    <h5 className="text-warning mb-0"><b>{position.price} ???</b></h5>
                </div>

                <div className="mb-3">
                    <small className="text-muted d-block">
                        Location: {position.location}
                    </small>
                    <small className="text-muted">
                        {position.city?.name}
                        {position.district && `, ${position.district.name}`}
                    </small>
                </div>

            </Card.Body>
        </Card>
    );
});

export default PositionCard;