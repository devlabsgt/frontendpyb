import React, { useState } from "react";
import {
  Box,
  Button,
  Image,
  Flex,
  Spacer,
  useDisclosure,
  VStack,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  IconButton,
  useBreakpointValue,
  Heading,
} from "@chakra-ui/react";
import { FaUser, FaSignOutAlt, FaBars } from "react-icons/fa";
import logo from '../../img/logo.png';
import VerUsuarios from '../usuarios/VerUsuarios';
import MiPerfil from './MiPerfil'; // Asegúrate de tener este componente
import { jwtDecode } from 'jwt-decode';
import Swal from 'sweetalert2'; // Importa SweetAlert2

const Dashboard = () => {
  const [view, setView] = useState('dashboard');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const token = localStorage.getItem('token'); // Obtiene el token del local storage
  const decodedToken = token ? jwtDecode(token) : null; // Decodifica el token
  const userRole = decodedToken ? decodedToken.rol : null; // Obtiene el rol del usuario

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
      Swal.fire({
        title: "Cerrar sesión",
        text: "Has cerrado sesión. ¡Hasta la próxima!",
        icon: "success",
        confirmButtonText: "Aceptar"
      }).then(() => {
        localStorage.removeItem('token');
        window.location.href = '/';
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
            {['Administrador', 'Super'].includes(userRole) && ( // Solo muestra el botón si el rol es Administrador o Super
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
            <Button
              colorScheme="green" // Botón de Mi Perfil
              size="sm"
              mr="2.5"
              leftIcon={<FaUser />}
              onClick={() => setView('perfil')} // Cambiar a la vista de perfil
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

      {/* Drawer para dispositivos móviles */}
      <Drawer isOpen={isDrawerOpen} placement="right" onClose={toggleDrawer}>
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader>Menú</DrawerHeader>
          <DrawerBody>
            <VStack align="start" spacing="4">
              {['Administrador', 'Super'].includes(userRole) && ( // Solo muestra el botón en el drawer si el rol es Administrador o Super
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
                colorScheme="green" // Botón de Mi Perfil
                leftIcon={<FaUser />} // Puedes cambiar el icono si lo deseas
                onClick={() => {
                  setView('perfil'); // Cambiar a la vista de perfil
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

      <Box pt="5" textAlign="center">
        {view === 'dashboard' && (
          <>
            <Heading>Bienvenido al Dashboard</Heading>
            <p>Aquí puedes administrar los proyectos y beneficiarios de Paz y Bien, Quezaltepeque.</p>
          </>
        )}
        {view === 'usuarios' && <VerUsuarios />}
        {view === 'perfil' && <MiPerfil />} {/* Aquí se muestra el componente de Mi Perfil */}
      </Box>
    </Box>
  );
};

export default Dashboard;
