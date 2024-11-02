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
  Table,
  //Divider,
  TableContainer,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Tag,
  TagCloseButton,
  TagLabel,
  Flex,
} from "@chakra-ui/react";
import { ViewIcon } from "@chakra-ui/icons";
import axios from "axios";
import { ModalVerUsuario, ModalAddUsuario } from "./ModalsUsuarios";
import Swal from "sweetalert2";
import { Select } from "@chakra-ui/react";

const VerUsuarios = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [filteredUsuarios, setFilteredUsuarios] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [tags, setTags] = useState([]);
  const [selectedUsuario, setSelectedUsuario] = useState(null);
  const [isActiveTab, setIsActiveTab] = useState(true);
  const [activeCount, setActiveCount] = useState(0);
  const [inactiveCount, setInactiveCount] = useState(0);
  const [selectedRole, setSelectedRole] = useState("");
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isAddOpen, onOpen: onAddOpen, onClose: onAddClose } = useDisclosure();

  useEffect(() => {
    obtenerUsuarios(isActiveTab);
    obtenerContadorUsuarios();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActiveTab]);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      headers: {
        Authorization: `Bearer ${token}`
      }
    };
  };

  const obtenerUsuarios = async (isActive) => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_backend}/usuario`,getAuthHeaders());
      const usuariosFiltrados = response.data
        .filter((user) => user.activo === isActive && user.rol !== "Super")
        .sort((a, b) => a.nombre.localeCompare(b.nombre));
      setUsuarios(usuariosFiltrados);
      setFilteredUsuarios(usuariosFiltrados);
    } catch (error) {
      console.error("Error al obtener los usuarios", error);
    }
  };

  const obtenerContadorUsuarios = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_backend}/usuario`,getAuthHeaders());
      setActiveCount(response.data.filter((user) => user.activo === true).length);
      setInactiveCount(response.data.filter((user) => user.activo === false).length);
    } catch (error) {
      console.error("Error al obtener el contador de usuarios", error);
    }
  };

  const handleVerUsuario = (usuario) => {
    setSelectedUsuario(usuario);
    onOpen();
  };

  const handleInactivarUsuario = async (usuarioId) => {
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
      try {
        await axios.put(`${process.env.REACT_APP_backend}/usuario/${usuarioId}`, { activo: false },getAuthHeaders());
        obtenerUsuarios(isActiveTab);
        obtenerContadorUsuarios();
        Swal.fire("Inactivado!", "El usuario ha sido inactivado.", "success");
      } catch (error) {
        console.error("Error al inactivar el usuario", error);
        Swal.fire("Error", "No se pudo inactivar al usuario.", "error");
      }
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
        await axios.put(`${process.env.REACT_APP_backend}/usuario/${usuarioId}`, { activo: true },getAuthHeaders());
        obtenerUsuarios(isActiveTab);
        obtenerContadorUsuarios();
        Swal.fire("Activado!", "El usuario ha sido activado.", "success");
      } catch (error) {
        console.error("Error al activar el usuario", error);
        Swal.fire("Error", "No se pudo activar al usuario.", "error");
      }
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && searchTerm.trim()) {
      setTags((prevTags) => [...prevTags, searchTerm.trim()]);
      setSearchTerm("");
    }
  };

  const handleDeleteTag = (tagToDelete) => {
    // Eliminar todos los tags que coincidan
    setTags((prevTags) => prevTags.filter((tag) => tag !== tagToDelete));

    // Filtrar usuarios basados en los tags restantes
    const filtered = usuarios.filter((usuario) =>
      tags.every((tag) =>
        ["nombre", "email", "telefono", "rol"].some((field) =>
          usuario[field].toString().toLowerCase().includes(tag.toLowerCase())
        )
      )
    );

    setFilteredUsuarios(filtered);
  };

// Lista de roles disponibles (modifícala según tus necesidades)
const roles = ["Administrador", "Encargado", "Usuario"];

// Función para manejar el cambio de rol
const handleRoleChange = (e) => {
  const role = e.target.value;
  setSelectedRole(role);
};

// Filtra usuarios según el rol seleccionado
useEffect(() => {
  if (selectedRole) {
    const filteredByRole = usuarios.filter((usuario) => usuario.rol === selectedRole);
    setFilteredUsuarios(filteredByRole);
  } else {
    setFilteredUsuarios(usuarios);
  }
}, [selectedRole, usuarios]);



  useEffect(() => {
    if (tags.length > 0) {
      const filtered = usuarios.filter((usuario) =>
        tags.every((tag) =>
          ["nombre", "email", "telefono", "rol"].some((field) =>
            usuario[field].toString().toLowerCase().includes(tag.toLowerCase())
          )
        )
      );
      setFilteredUsuarios(filtered);
    } else {
      setFilteredUsuarios(usuarios);
    }
  }, [tags, usuarios]);

  return (
<Box p={5} bg="gray.50" borderRadius="lg" boxShadow="base">
  {/* Contenedor horizontal para el botón, campo de búsqueda y selector de roles */}
  <Flex mb={2} alignItems="center" width="100%">
    <Button colorScheme="blue" onClick={onAddOpen} mr={4}>
      Añadir Usuario
    </Button>
    <Input
      placeholder="Buscar usuario..."
      value={searchTerm}
      onChange={handleSearchChange}
      onKeyDown={handleKeyDown}
      w="50%"
      mr={4}
    />
    <Select
      placeholder="Selecciona un rol"
      value={selectedRole}
      onChange={handleRoleChange}
      w="25%"
    >
      {roles.map((rol) => (
        <option key={rol} value={rol}>
          {rol}
        </option>
      ))}
    </Select>
  </Flex>

  {/* Contenedor para las etiquetas, colocado en una nueva línea */}
  <Box width="60%" mt={2}>
    {tags.map((tag) => (
      <Tag key={tag} size="md" colorScheme="teal" borderRadius="full" mr={2}>
        <TagLabel>{tag}</TagLabel>
        <TagCloseButton onClick={() => handleDeleteTag(tag)} />
      </Tag>
    ))}

     {/* Botón para borrar todas las etiquetas */}
     {tags.length > 0 && (
      <Button
      size="sm"
      colorScheme="teal"
      borderRadius="full" // Bordes redondeados
      height="25px" // Altura similar a las etiquetas
      paddingX={4} // Ajusta el padding horizontal
      ml={2} // Espaciado entre el botón y las etiquetas
      onClick={() => setTags([])}
      >
        Borrar Busquedas
      </Button>
    )}
  </Box>

<br />

  <Tabs onChange={(index) => setIsActiveTab(index === 0)}>
    <TabList>
      <Tab _selected={{ color: "white", bg: "blue.700" }}>Activos ({activeCount})</Tab>
      <Tab _selected={{ color: "white", bg: "red.500" }}>Inactivos ({inactiveCount})</Tab>
    </TabList>

    <TabPanels>
      <TabPanel>
        <TableContainer borderRadius="md" boxShadow="md" bg="white" p={4}>
          <Table variant="striped" colorScheme="gray" size="md">
            <Thead>
            <Tr bg="blue.300">
            <Th color="white">Nombre</Th>
            <Th color="white">Email</Th>
            <Th color="white">Teléfono</Th>
            <Th color="white">Rol</Th>
            <Th color="white">Acciones</Th>
          </Tr>
            </Thead>
            <Tbody>
              {filteredUsuarios.map((usuario) => (
                <Tr key={usuario._id} _hover={{ bg: "gray.100" }}>
                  <Td fontWeight="bold">{usuario.nombre}</Td>
                  <Td>{usuario.email}</Td>
                  <Td>{usuario.telefono}</Td>
                  <Td>
                    <Tag colorScheme={usuario.rol === "Administrador" ? "purple" : "green"}>
                      {usuario.rol}
                    </Tag>
                  </Td>
                  <Td>
                    <Button
                      leftIcon={<ViewIcon />}
                      onClick={() => handleVerUsuario(usuario)}
                      colorScheme="blue"
                      size="sm"
                      mr={2}
                    >
                      Ver
                    </Button>
                    <Button
                      colorScheme="red"
                      size="sm"
                      onClick={() => handleInactivarUsuario(usuario._id)}
                    >
                      Inactivar
                    </Button>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </TableContainer>
      </TabPanel>

      <TabPanel>
        <TableContainer borderRadius="md" boxShadow="md" bg="white" p={4}>
        <Table size="md" variant="striped">
        <Thead>
            <Tr bg="red.900">
              <Th color="white">Nombre</Th>
              <Th color="white">Email</Th>
              <Th color="white">Teléfono</Th>
              <Th color="white">Rol</Th>
              <Th color="white">Acciones</Th>
            </Tr>
            </Thead>
            <Tbody>
              {filteredUsuarios.map((usuario) => (
                <Tr key={usuario._id} _hover={{ bg: "gray.100" }}>
                  <Td fontWeight="bold">{usuario.nombre}</Td>
                  <Td>{usuario.email}</Td>
                  <Td>{usuario.telefono}</Td>
                  <Td>
                    <Tag colorScheme={usuario.rol === "Administrador" ? "purple" : "green"}>
                      {usuario.rol}
                    </Tag>
                  </Td>
                  <Td>
                    <Button
                      leftIcon={<ViewIcon />}
                      onClick={() => handleVerUsuario(usuario)}
                      colorScheme="blue"
                      size="sm"
                      mr={2}
                    >
                      Ver
                    </Button>
                    <Button
                      colorScheme="green"
                      size="sm"
                      onClick={() => handleActivarUsuario(usuario._id)}
                    >
                      Activar
                    </Button>
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
    onClose={() => { onClose(); obtenerUsuarios(isActiveTab); }} 
    usuario={selectedUsuario} 
    getAuthHeaders={getAuthHeaders}
  />
  <ModalAddUsuario
    isOpen={isAddOpen}
    onClose={() => { onAddClose(); obtenerUsuarios(isActiveTab); }}
    obtenerUsuarios={() => obtenerUsuarios(isActiveTab)}
    getAuthHeaders={getAuthHeaders}
  />
</Box>

  );
};

export default VerUsuarios;
