import { Button, Card, Badge } from "react-bootstrap";
import { observer } from "mobx-react-lite";

const ContentCard = observer(({ content, onImageClick, onEdit, onDelete }) => {

    const getKeyBadgeVariant = (key) => {
        const mainKeys = ['welcome', 'help', 'about'];
        const secondaryKeys = ['contacts', 'payment'];
        
        if (mainKeys.includes(key)) return 'primary';
        if (secondaryKeys.includes(key)) return 'success';
        return 'secondary';
    };

    return (
        <Card className="h-100">
            {/* Изображение */}
            {content.image && (
                <div 
                    style={{ 
                        height: '200px', 
                        cursor: 'pointer',
                        overflow: 'hidden'
                    }}
                    onClick={() => onImageClick(content.image)}
                >
                    <img 
                        src={`http://localhost:5050/${content.image}`}
                        alt={content.key}
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                        }}
                    />
                </div>
            )}
            
            <Card.Body className="d-flex flex-column">
                {/* Ключ */}
                <div className="d-flex justify-content-between align-items-start mb-2">
                    <Badge 
                        bg={getKeyBadgeVariant(content.key)} 
                        className="text-capitalize"
                    >
                        {content.key}
                    </Badge>
                    <small className="text-muted">
                        ID: {content.id}
                    </small>
                </div>

                {/* Текст */}
                <div className="flex-grow-1 mb-3">
                    <h6 className="card-title">Текст сообщения:</h6>
                    <p 
                        className="text-muted small"
                        style={{ 
                            maxHeight: '100px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                        }}
                    >
                        {content.text || <em className="text-warning">Текст не задан</em>}
                    </p>
                </div>

                {/* Кнопки управления */}
                <div className="d-flex gap-2 mt-auto">
                    <Button 
                        variant="outline-primary" 
                        size="sm"
                        onClick={() => onEdit(content)}
                        className="flex-fill"
                    >
                        Редактировать
                    </Button>
                    <Button 
                        variant="outline-danger" 
                        size="sm"
                        onClick={() => onDelete(content.id)}
                    >
                        Удалить
                    </Button>
                </div>
            </Card.Body>
        </Card>
    );
});

export default ContentCard;