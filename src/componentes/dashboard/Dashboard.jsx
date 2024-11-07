import React, { useState } from "react";
import {
  Box,
  Button,
  Image,
  Flex,
  Spacer,
  VStack,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  IconButton,
  useBreakpointValue,
} from "@chakra-ui/react";
import {
  FaUser,
  FaSignOutAlt,
  FaBars,
  FaHeartbeat,
  FaHome,
  FaProjectDiagram,
  FaCog,
} from "react-icons/fa";
import logo from '../../img/logo.png';
import VerUsuarios from '../usuarios/VerUsuarios';
import VerBeneficiarios from '../beneficiarios/VerBeneficiarios';
import ResumenInicio from "../resumeninicio/ResumenInicio";
import MiPerfil from './MiPerfil';
import MailConfig from './MailConfig';
import {jwtDecode} from 'jwt-decode';
import Swal from 'sweetalert2';
import GestionProyectos from "../proyectos/GestionProyectos";

const Dashboard = () => {
  const [view, setView] = useState('dashboard');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const token = localStorage.getItem('token');
  const decodedToken = token ? jwtDecode(token) : null;
  const userRole = decodedToken ? decodedToken.rol : null;
  const userName = decodedToken ? decodedToken.nombre : null;

  const obtenerBeneficiarios = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_backend}/beneficiario`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return await response.json();
    } catch (error) {
      console.error("Error al obtener beneficiarios:", error);
      return [];
    }
  };

  const handleLogout = () => {
    Swal.fire({
      title: "¿Estás seguro?",
      text: "¿Deseas cerrar sesión?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Sí, cerrar sesión",
      cancelButtonText: "Cancelar"
    }).then((result) => {
      if (result.isConfirmed) {
        const userId = decodedToken?.id;

        // Cambia el estado de `sesion` a false en la base de datos
        fetch(`${process.env.REACT_APP_backend}/usuario/${userId}/cerrarsesion`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
        })
          .then(response => {
            if (response.ok) {
              Swal.fire({
                title: "Cerrar sesión",
                text: "Has cerrado sesión. ¡Hasta la próxima!",
                icon: "success",
                confirmButtonText: "Aceptar"
              }).then(() => {
                localStorage.removeItem('token');
                window.location.href = '/';
              });
            } else {
              Swal.fire("Error", "No se pudo cerrar la sesión correctamente.", "error");
            }
          })
          .catch(error => {
            console.error("Error al cerrar sesión:", error);
            Swal.fire("Error", "Hubo un problema al cerrar sesión. Intenta de nuevo.", "error");
          });
      }
    });
  };

  const isMobile = useBreakpointValue({ base: true, md: false });
  const toggleDrawer = () => setIsDrawerOpen(!isDrawerOpen);

  return (
    <Box w="100vw" h="100vh" bg="white">
      <Flex as="nav" bg="white" p="4" boxShadow="md" alignItems="center">
        <Image src={logo} alt="Logo" maxH="50px" objectFit="contain" />
        <Box ml={3}>
          {userName} ({userRole})
        </Box>
        <Spacer />

        {isMobile ? (
          <IconButton
            icon={<FaBars />}
            aria-label="Abrir menú"
            variant="ghost"
            onClick={toggleDrawer}
          />
        ) : (
          <>
            <Button
              colorScheme="green"
              size="sm"
              mr="2.5"
              leftIcon={<FaHome />}
              onClick={() => setView('dashboard')}
            >
              Inicio
            </Button>
            <Button
              colorScheme="orange"
              size="sm"
              mr="2.5"
              leftIcon={<FaProjectDiagram />}
              onClick={() => setView('proyectos')}
            >
              Gestión Proyectos
            </Button>
            <Button
              colorScheme="purple"
              size="sm"
              mr="2.5"
              leftIcon={<FaHeartbeat />}
              onClick={() => setView('beneficiarios')}
            >
              Ver Beneficiarios
            </Button>
            {['Administrador', 'Super'].includes(userRole) && (
              <Button
                colorScheme="blue"
                size="sm"
                mr="2.5"
                leftIcon={<FaUser />}
                onClick={() => setView('usuarios')}
              >
                Ver Usuarios
              </Button>
            )}
            {userRole === 'Super' && (
              <Button
                colorScheme="yellow"
                size="sm"
                mr="2.5"
                leftIcon={<FaCog />}
                onClick={() => setView('mailConfig')}
              >
                Configuración de Correo
              </Button>
            )}
            <Button
              colorScheme="teal"
              size="sm"
              mr="2.5"
              leftIcon={<FaUser />}
              onClick={() => setView('perfil')}
            >
              Mi Perfil
            </Button>
            <Button
              colorScheme="red"
              variant="solid"
              onClick={handleLogout}
              size="sm"
              leftIcon={<FaSignOutAlt />}
            >
              Cerrar Sesión
            </Button>
          </>
        )}
      </Flex>

      <Drawer isOpen={isDrawerOpen} placement="right" onClose={toggleDrawer}>
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader>Menú</DrawerHeader>
          <DrawerBody>
            <VStack align="start" spacing="4">
              <Button
                w="100%"
                colorScheme="teal"
                leftIcon={<FaHome />}
                onClick={() => {
                  setView('dashboard');
                  toggleDrawer();
                }}
              >
                Inicio
              </Button>
              <Button
                w="100%"
                colorScheme="orange"
                leftIcon={<FaProjectDiagram />}
                onClick={() => {
                  setView('proyectos');
                  toggleDrawer();
                }}
              >
                Gestión Proyectos
              </Button>
              {['Administrador', 'Super'].includes(userRole) && (
                <Button
                  w="100%"
                  colorScheme="blue"
                  leftIcon={<FaUser />}
                  onClick={() => {
                    setView('usuarios');
                    toggleDrawer();
                  }}
                >
                  Ver Usuarios
                </Button>
              )}
              <Button
                w="100%"
                colorScheme="purple"
                leftIcon={<FaHeartbeat />}
                onClick={() => {
                  setView('beneficiarios');
                  toggleDrawer();
                }}
              >
                Ver Beneficiarios
              </Button>
              {userRole === 'Super' && (
                <Button
                  w="100%"
                  colorScheme="yellow"
                  leftIcon={<FaCog />}
                  onClick={() => {
                    setView('mailConfig');
                    toggleDrawer();
                  }}
                >
                  Configuración de Correo
                </Button>
              )}
              <Button
                w="100%"
                colorScheme="green"
                leftIcon={<FaUser />}
                onClick={() => {
                  setView('perfil');
                  toggleDrawer();
                }}
              >
                Mi Perfil
              </Button>
              <Button
                w="100%"
                colorScheme="red"
                leftIcon={<FaSignOutAlt />}
                onClick={handleLogout}
              >
                Cerrar Sesión
              </Button>
            </VStack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>

      <Box pt="5">
        {view === 'dashboard' && <ResumenInicio obtenerBeneficiarios={obtenerBeneficiarios} />}
        {view === 'usuarios' && <VerUsuarios />}
        {view === 'beneficiarios' && <VerBeneficiarios />}
        {view === 'perfil' && <MiPerfil />}
        {view === 'proyectos' && <GestionProyectos />}
        {view === 'mailConfig' && <MailConfig />}
      </Box>
    </Box>
  );
};

export default Dashboard;
