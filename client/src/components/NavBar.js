import React, { useContext } from "react";
import { Context } from "..";
import {Nav, Navbar, Container, Button, NavDropdown} from "react-bootstrap";
import { NavLink } from "react-router-dom";
import { SHOP_ROUTE, LOGIN_ROUTE, ADMIN_ROUTE } from "../utils/consts";
import { observer } from "mobx-react-lite";
import {useNavigate} from "react-router-dom"

const NavBar = observer(() => {
    const {user} = useContext(Context)
    const navigate = useNavigate()

    const logOut = () => {
      user.logout()
      navigate(LOGIN_ROUTE)
    }
    
    return (
        <Navbar bg="dark" data-bs-theme="dark">
        <Container>
          <NavLink style={{color:'white', textDecoration: 'none'}} to={ADMIN_ROUTE}>
            Market Admin
          </NavLink>
          {user.isAuth ?
          <Nav className="ml-auto" style={{color:'white', gap:'10px'}}>
            <NavDropdown title="Управление" id="admin-nav-dropdown" menuVariant="dark">
              <NavDropdown.Item onClick={() => navigate('/admin/cities')}>
                Города и районы
              </NavDropdown.Item>
              <NavDropdown.Item onClick={() => navigate('/admin/products')}>
                Продукты и позиции
              </NavDropdown.Item>
              <NavDropdown.Item onClick={() => navigate('/admin/content')}>
                Контент бота
              </NavDropdown.Item>
            </NavDropdown>
            <Button 
              variant="outline-light"
              onClick={() => navigate(SHOP_ROUTE)}>
                Обзор
            </Button>
            <Button 
              variant="outline-light"
              onClick={() => logOut()}>
                Выйти
            </Button>
          </Nav>
          :
          <Nav className="ml-auto" style={{color:'white'}}>
            <Button variant="outline-light" onClick={() => navigate(LOGIN_ROUTE)}>
              Авторизация
            </Button>
          </Nav>
          }
        </Container>
      </Navbar>
    );
});

export default NavBar;