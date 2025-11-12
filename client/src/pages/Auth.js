import React, { useContext, useState } from "react";
import { Row, Button, Card, Container, Form } from "react-bootstrap";
import { SHOP_ROUTE } from "../utils/consts";
import { useNavigate } from "react-router-dom";
import { login } from "../http/userApi";
import { observer } from "mobx-react-lite";
import { Context } from "..";

const Auth = observer(() => {
    const {user} = useContext(Context)
    const [name, setName] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()

    const click = async () => {
        if (!name.trim() || !password.trim()) {
            alert('Введите имя и пароль')
            return
        }

        setLoading(true)
        try {
            const userData = await login(name, password)
            
            user.setUser(userData)
            user.setIsAuth(true)
            
            navigate(SHOP_ROUTE)
        } catch (error) {
            // console.error('Login error:', error)
            alert(error.response?.data?.message || 'Ошибка авторизации')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Container 
            className="d-flex justify-content-center align-items-center"
            style={{height: window.innerHeight - 54}}>
            <Card style={{width: 600}} className="p-5">
                 <h2 className="m-auto">Login</h2>
                <Form className="d-flex flex-column">
                    <Form.Control
                        className="mt-3"
                        placeholder="Name..."
                        value={name}
                        onChange={e => setName(e.target.value)}
                    />
                    <Form.Control
                        className="mt-3"
                        placeholder="Password..."
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        type="password"
                    />
                    <Row className="d-flex justify-content-between mt-3 pl-3 pr-3">
                        <div>
                            Вход только для администраторов
                        </div>
                        <Button
                            variant={"outline-success"}
                            className="mt-3"
                            onClick={click}
                        >
                            {loading ? 'Вход...' : 'Войти'}
                        </Button>
                    </Row>
                </Form>
            </Card>
        </Container>
    );
});

export default Auth;