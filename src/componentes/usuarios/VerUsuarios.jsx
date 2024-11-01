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
  Divider,
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

const VerUsuarios = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [filteredUsuarios, setFilteredUsuarios] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [tags, setTags] = useState([]);
  const [selectedUsuario, setSelectedUsuario] = useState(null);
  const [isActiveTab, setIsActiveTab] = useState(true);
  const [activeCount, setActiveCount] = useState(0);
  const [inactiveCount, setInactiveCount] = useState(0);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isAddOpen, onOpen: onAddOpen, onClose: onAddClose } = useDisclosure();

  useEffect(() => {
    obtenerUsuarios(isActiveTab);
    obtenerContadorUsuarios();
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
    <Box p={0}>
      <Flex mb={4} alignItems="center">
        <Button ml={4} colorScheme="blue" onClick={onAddOpen}>
          Añadir Usuario
        </Button>
        <Input
          placeholder="Buscar usuario..."
          value={searchTerm}
          onChange={handleSearchChange}
          onKeyDown={handleKeyDown}
          ml={4}
          w="50%"
        />
        <Box>
          {tags.map((tag) => (
            <Tag key={tag} ml='2'>
              <TagLabel>{tag}</TagLabel>
              <TagCloseButton onClick={() => handleDeleteTag(tag)} />
            </Tag>
          ))}
        </Box>
      </Flex>

      <Tabs onChange={(index) => setIsActiveTab(index === 0)}>
        <TabList>
          <Tab>Activos ({activeCount})</Tab>
          <Tab>Inactivos ({inactiveCount})</Tab>
        </TabList>

        <TabPanels>
          <TabPanel>
            <TableContainer>
              <Table variant="simple" size="md">
                <Thead display={{ base: "none", md: "table-header-group" }}>
                  <Tr>
                    <Th>Nombre</Th>
                    <Th>Email</Th>
                    <Th>Teléfono</Th>
                    <Th>Rol</Th>
                    <Th>Acciones</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {filteredUsuarios.map((usuario) => (
                    <React.Fragment key={usuario._id}>
                      <Tr display={{ base: "table-row", md: "none" }} borderBottom="1px solid" borderColor="gray.200">
                        <Td colSpan="2">
                          <Box fontWeight="bold" fontSize="lg">{usuario.nombre}</Box>
                          <Box fontSize="sm">
                            <strong>Correo:</strong> {usuario.email} <br />
                            <strong>Teléfono:</strong> {usuario.telefono} <br />
                            <strong>Rol:</strong> {usuario.rol}
                                                       <Box display="flex" justifyContent="flex-end" mt={2} width="100%">
                              <Button
                                leftIcon={<ViewIcon />}
                                onClick={() => handleVerUsuario(usuario)}
                                colorScheme="blue"
                                size="sm"
                                width="75px"
                                mb={1}
                                mr={2} 
                              >
                                Ver
                              </Button>
                              <Button
                                colorScheme="red"
                                size="sm"
                                width="75px"
                                onClick={() => handleInactivarUsuario(usuario._id)}
                              >
                                Inactivar
                              </Button>
                            </Box>
                          </Box>
                        </Td>
                      </Tr>
                      <Tr display={{ base: "none", md: "table-row" }}>
                        <Td>{usuario.nombre}</Td>
                        <Td>{usuario.email}</Td>
                        <Td>{usuario.telefono}</Td>
                        <Td>{usuario.rol}</Td>
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
                    </React.Fragment>
                  ))}
                </Tbody>
              </Table>
            </TableContainer>
          </TabPanel>

          <TabPanel>
            <TableContainer>
              <Table variant="simple" size="md">
                <Thead display={{ base: "none", md: "table-header-group" }}>
                  <Tr>
                    <Th>Nombre</Th>
                    <Th>Email</Th>
                    <Th>Teléfono</Th>
                    <Th>Rol</Th>
                    <Th>Acciones</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {filteredUsuarios.map((usuario) => (
                    <React.Fragment key={usuario._id}>
                      <Tr display={{ base: "table-row", md: "none" }} borderBottom="1px solid" borderColor="gray.200">
                        <Td colSpan="2">
                          <Box fontWeight="bold" fontSize="lg">{usuario.nombre}</Box>
                          <Box fontSize="sm" color="gray.600">{usuario.email}</Box>
                          <Divider my={2} />
                          <Box fontSize="sm">
                            <strong>Teléfono:</strong> {usuario.telefono} <br />
                            <strong>Rol:</strong> {usuario.rol}
                          </Box>
                          <Box mt={2} display="flex" justifyContent="flex-end">
                            <Button
                              leftIcon={<ViewIcon />}
                              onClick={() => handleVerUsuario(usuario)}
                              colorScheme="blue"
                              size="xs"
                              mr={2}
                            >
                              Ver
                            </Button>
                            <Button
                              colorScheme="green"
                              size="xs"
                              onClick={() => handleActivarUsuario(usuario._id)}
                            >
                              Activar
                            </Button>
                          </Box>
                        </Td>
                      </Tr>
                      <Tr display={{ base: "none", md: "table-row" }}>
                        <Td>{usuario.nombre}</Td>
                        <Td>{usuario.email}</Td>
                        <Td>{usuario.telefono}</Td>
                        <Td>{usuario.rol}</Td>
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
                    </React.Fragment>
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
        getAuthHeaders={()=>getAuthHeaders()}

      />
      <ModalAddUsuario
        isOpen={isAddOpen}
        onClose={() => { onAddClose(); obtenerUsuarios(isActiveTab); }}
        obtenerUsuarios={() => obtenerUsuarios(isActiveTab)}
        getAuthHeaders={()=>getAuthHeaders()}

      />
    </Box>
  );
};

export default VerUsuarios;
