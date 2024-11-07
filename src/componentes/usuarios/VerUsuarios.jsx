import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Input,
  useDisclosure,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Flex,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  IconButton,
  Select,
  Table,
  TableContainer,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Tag,
} from "@chakra-ui/react";
import { ChevronDownIcon } from "@chakra-ui/icons";
import axios from "axios";
import { ModalVerUsuario, ModalAddUsuario } from "./ModalsUsuarios";
import Swal from "sweetalert2";

const VerUsuarios = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [filteredUsuarios, setFilteredUsuarios] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUsuario, setSelectedUsuario] = useState(null);
  const [isActiveTab, setIsActiveTab] = useState(true);
  const [activeCount, setActiveCount] = useState(0);
  const [inactiveCount, setInactiveCount] = useState(0);
  const [selectedRole, setSelectedRole] = useState("");
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isAddOpen, onOpen: onAddOpen, onClose: onAddClose } = useDisclosure();

  const roles = ["Administrador", "Encargado"];

  // Obtener usuario actual del token
  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    const userProfile = JSON.parse(atob(token.split(".")[1])); // Extrae el payload del token
    return {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      currentUser: userProfile.userId, // Extrae el ID del usuario
    };
  };

  const obtenerUsuarios = async (isActive) => {
    try {
      const { headers } = getAuthHeaders();
      const response = await axios.get(`${process.env.REACT_APP_backend}/usuario`, { headers });
      const validUsers = Array.isArray(response.data) ? response.data : [];
      const usuariosFiltrados = validUsers
        .filter(
          (user) =>
            user &&
            typeof user.activo === "boolean" &&
            user.activo === isActive &&
            user.rol &&
            user.rol !== "Super" &&
            user.nombre
        )
        .sort((a, b) => (a.nombre || "").localeCompare(b.nombre || ""));

      setUsuarios(usuariosFiltrados);
      setFilteredUsuarios(usuariosFiltrados);
    } catch (error) {
      console.error("Error al obtener los usuarios", error);
      Swal.fire("Error", "No se pudieron cargar los usuarios.", "error");
    }
  };

  const obtenerContadorUsuarios = async () => {
    try {
      const { headers } = getAuthHeaders();
      const response = await axios.get(`${process.env.REACT_APP_backend}/usuario`, { headers });
      const validUsers = Array.isArray(response.data) ? response.data : [];

      setActiveCount(validUsers.filter((user) => user && user.activo === true).length);
      setInactiveCount(validUsers.filter((user) => user && user.activo === false).length);
    } catch (error) {
      console.error("Error al obtener el contador de usuarios", error);
    }
  };

  useEffect(() => {
    obtenerUsuarios(isActiveTab);
    obtenerContadorUsuarios();
  }, [isActiveTab]);

  const handleVerUsuario = (usuario) => {
    if (usuario) {
      setSelectedUsuario(usuario);
      onOpen();
    }
  };

const handleInactivarUsuario = async (usuarioId) => {
  try {
    const { headers } = getAuthHeaders();
    const usuario = await axios.get(`${process.env.REACT_APP_backend}/usuario/${usuarioId}`, { headers });

    // Verifica si el usuario está en sesión
    if (usuario.data.sesion) {
      Swal.fire("Error", "No puedes inactivar a un usuario que está en sesión.", "error");
      return;
    }

    const result = await Swal.fire({
      title: "¿Estás seguro?",
      text: "Esta acción inactivará al usuario y le quitará acceso al sistema.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Inactivar",
      cancelButtonText: "Cancelar",
    });

    if (result.isConfirmed) {
      await axios.put(`${process.env.REACT_APP_backend}/usuario/${usuarioId}`, { activo: false }, { headers });
      obtenerUsuarios(isActiveTab); // Actualizar la lista de usuarios
      obtenerContadorUsuarios();    // Actualizar el contador
      Swal.fire("Inactivado!", "El usuario ha sido inactivado.", "success");
    }
  } catch (error) {
    console.error("Error al inactivar el usuario", error);
    Swal.fire("Error", "No se pudo inactivar al usuario.", "error");
  }
};

  const handleActivarUsuario = async (usuarioId) => {
    const result = await Swal.fire({
      title: "¿Estás seguro?",
      text: "Esta acción activará al usuario y le otorgará permisos nuevamente.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Activar",
      cancelButtonText: "Cancelar",
    });

    if (result.isConfirmed) {
      try {
        const { headers } = getAuthHeaders();
        await axios.put(`${process.env.REACT_APP_backend}/usuario/${usuarioId}`, { activo: true }, { headers });
        obtenerUsuarios(isActiveTab);
        obtenerContadorUsuarios();
        Swal.fire("Activado!", "El usuario ha sido activado.", "success");
      } catch (error) {
        console.error("Error al activar el usuario", error);
        Swal.fire("Error", "No se pudo activar al usuario.", "error");
      }
    }
  };

  const handleReenviarVerificacion = async (usuarioId, usuarioEmail) => {
    try {
      const { headers } = getAuthHeaders();
      await axios.post(`${process.env.REACT_APP_backend}/reenviar-verificacion`, { email: usuarioEmail }, { headers });
      Swal.fire("Enviado", "Correo de verificación reenviado exitosamente.", "success");
    } catch (error) {
      console.error("Error al reenviar el correo de verificación", error);
      Swal.fire("Error", "No se pudo reenviar el correo de verificación.", "error");
    }
  };

  useEffect(() => {
    const filtered = usuarios.filter((usuario) => {
      const matchesRole = !selectedRole || (usuario && usuario.rol === selectedRole);
      const matchesSearch = !searchTerm || usuario.nombre.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesRole && matchesSearch;
    });
    setFilteredUsuarios(filtered);
  }, [selectedRole, searchTerm, usuarios]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleRoleChange = (e) => {
    setSelectedRole(e.target.value);
  };

  return (
    <Box p={5} bg="gray.50" borderRadius="lg" boxShadow="base">
      <Flex mb={2} alignItems="center" width="100%" gap={4} flexWrap="nowrap">
        <Button colorScheme="blue" onClick={onAddOpen}>
          Añadir Usuario
        </Button>
        <Input
          placeholder="Buscar usuario..."
          value={searchTerm}
          onChange={handleSearchChange}
          w="50%"
        />
        <Select placeholder="Selecciona un rol" value={selectedRole} onChange={handleRoleChange} w="25%">
          {roles.map((rol) => (
            <option key={rol} value={rol}>
              {rol}
            </option>
          ))}
        </Select>
      </Flex>

      <Tabs onChange={(index) => setIsActiveTab(index === 0)}>
        <TabList>
          <Tab _selected={{ color: "white", bg: "blue.700" }}>Activos ({activeCount - 1})</Tab>
          <Tab _selected={{ color: "white", bg: "red.500" }}>Inactivos ({inactiveCount})</Tab>
        </TabList>

        <TabPanels>
          <TabPanel>
            <TableContainer borderRadius="md" boxShadow="md" bg="white" p={0}>
              <Table variant="striped" colorScheme="gray" size="md">
                <Thead>
                  <Tr bg="blue.300">
                    <Th color="white" position="sticky" left={0} zIndex={1} bg="blue.300" width="50px">
                      No.
                    </Th>
                    <Th color="white" position="sticky" left="50px" zIndex={1} bg="blue.300" width="150px">
                      Nombre
                    </Th>
                    <Th color="white">Email</Th>
                    <Th color="white">Teléfono</Th>
                    <Th color="white">Rol</Th>
                    <Th color="white">Acciones</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {filteredUsuarios.map((usuario, index) => (
                    <Tr key={usuario._id} _hover={{ bg: "gray.100" }}>
                      <Td position="sticky" left={0} bg="white" fontWeight="bold" width="50px">
                        {index + 1}
                      </Td>
                      <Td position="sticky" left="50px" bg="white" fontWeight="bold" width="150px">
                        {usuario.nombre}
                      </Td>
                      <Td>{usuario.email}</Td>
                      <Td>{usuario.telefono}</Td>
                      <Td>
                        <Tag colorScheme={usuario.rol === "Administrador" ? "purple" : "green"}>{usuario.rol}</Tag>
                      </Td>
                      <Td>
                        <Menu>
                          <MenuButton as={IconButton} icon={<ChevronDownIcon />} variant="outline" colorScheme="blue" />
                          <MenuList>
                            <MenuItem onClick={() => handleVerUsuario(usuario)}>Editar</MenuItem>
                            <MenuItem
                              onClick={() =>
                                isActiveTab ? handleInactivarUsuario(usuario._id) : handleActivarUsuario(usuario._id)
                              }
                            >
                              {isActiveTab ? "Inactivar" : "Activar"}
                            </MenuItem>
                            {!usuario.verificado && (
                              <MenuItem onClick={() => handleReenviarVerificacion(usuario._id, usuario.email)}>
                                Reenviar Verificación
                              </MenuItem>
                            )}
                          </MenuList>
                        </Menu>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </TableContainer>
          </TabPanel>
        </TabPanels>
      </Tabs>

      <ModalVerUsuario
        isOpen={isOpen}
        onClose={() => {
          onClose();
          obtenerUsuarios(isActiveTab);
        }}
        usuario={selectedUsuario}
        getAuthHeaders={getAuthHeaders}
      />
      <ModalAddUsuario
        isOpen={isAddOpen}
        onClose={() => {
          onAddClose();
          obtenerUsuarios(isActiveTab);
        }}
        obtenerUsuarios={() => obtenerUsuarios(isActiveTab)}
        getAuthHeaders={getAuthHeaders}
      />
    </Box>
  );
};

export default VerUsuarios;
