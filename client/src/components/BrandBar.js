import React, {useContext} from 'react';
import {observer} from "mobx-react-lite";
import { Context } from "../index";
import {Card, Row, Col} from "react-bootstrap";

const BrandBar = observer(() => {
    const {device} = useContext(Context)

    return (
        <Row className="d-flex flex-wrap">
            {device.brands.map(brand =>
                <Col xs="auto" key={brand.id} >
                    <Card
                    style={{cursor:'pointer', display:'inline-block'}}
                    // key={brand.id}
                    className="p-3"
                    onClick={() => device.setSelectedBrand(brand)}
                    border={brand.id === device.selectedBrand.id ? 'danger' : 'light'}
                >
                    {brand.name}
                </Card>
                </Col>
            )}
        </Row>
    );
});

export default BrandBar;