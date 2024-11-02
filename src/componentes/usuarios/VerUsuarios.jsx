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
  const [activeCount, setInactiveCount] = useState(0);
  const [inactiveCount, setActiveCount] = useState(0);
  const [selectedRole, setSelectedRole] = useState("");
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isAddOpen, onOpen: onAddOpen, onClose: onAddClose } = useDisclosure();

  const roles = ["Administrador", "Encargado", "Usuario"];

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
      const response = await axios.get(`${process.env.REACT_APP_backend}/usuario`, getAuthHeaders());
      // Ensure we have valid data before filtering
      const validUsers = Array.isArray(response.data) ? response.data : [];
      const usuariosFiltrados = validUsers
        .filter(user => {
          // Safely check if user object and its properties exist
          return user && 
                 typeof user.activo === 'boolean' && 
                 user.activo === isActive && 
                 user.rol && 
                 user.rol !== "Super" &&
                 user.nombre; // Ensure nombre exists for sorting
        })
        .sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''));
      
      setUsuarios(usuariosFiltrados);
      setFilteredUsuarios(usuariosFiltrados);
    } catch (error) {
      console.error("Error al obtener los usuarios", error);
      Swal.fire("Error", "No se pudieron cargar los usuarios.", "error");
    }
  };

  const obtenerContadorUsuarios = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_backend}/usuario`, getAuthHeaders());
      const validUsers = Array.isArray(response.data) ? response.data : [];
      
      setActiveCount(validUsers.filter(user => user && user.activo === true).length);
      setInactiveCount(validUsers.filter(user => user && user.activo === false).length);
    } catch (error) {
      console.error("Error al obtener el contador de usuarios", error);
    }
  };

  useEffect(() => {
    obtenerUsuarios(isActiveTab);
    obtenerContadorUsuarios();
    // eslint-disable-next-line
  }, [isActiveTab]);

  const handleVerUsuario = (usuario) => {
    if (usuario) {
      setSelectedUsuario(usuario);
      onOpen();
    }
  };

  const handleInactivarUsuario = async (usuarioId) => {
    if (!usuarioId) return;

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
        await axios.put(
          `${process.env.REACT_APP_backend}/usuario/${usuarioId}`,
          { activo: false },
          getAuthHeaders()
        );
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
    if (!usuarioId) return;
    
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
        await axios.put(
          `${process.env.REACT_APP_backend}/usuario/${usuarioId}`,
          { activo: true },
          getAuthHeaders()
        );
        obtenerUsuarios(isActiveTab);
        obtenerContadorUsuarios();
        Swal.fire("Activado!", "El usuario ha sido activado.", "success");
      } catch (error) {
        console.error("Error al activar el usuario", error);
        Swal.fire("Error", "No se pudo activar al usuario.", "error");
      }
    }
  };

  // Safe filter function that checks for undefined values
  const safeFilter = (usuario, tag) => {
    if (!usuario) return false;
    
    return ["nombre", "email", "telefono", "rol"].some(field => {
      const value = usuario[field];
      return value && value.toString().toLowerCase().includes(tag.toLowerCase());
    });
  };

  useEffect(() => {
    if (selectedRole || tags.length > 0) {
      const filtered = usuarios.filter(usuario => {
        const matchesRole = !selectedRole || (usuario && usuario.rol === selectedRole);
        const matchesTags = tags.length === 0 || tags.every(tag => safeFilter(usuario, tag));
        return matchesRole && matchesTags;
      });
      setFilteredUsuarios(filtered);
    } else {
      setFilteredUsuarios(usuarios);
    }
  }, [selectedRole, tags, usuarios]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && searchTerm.trim()) {
      setTags(prevTags => [...prevTags, searchTerm.trim()]);
      setSearchTerm("");
    }
  };

  const handleDeleteTag = (tagToDelete) => {
    setTags(prevTags => prevTags.filter(tag => tag !== tagToDelete));
  };

  const handleRoleChange = (e) => {
    setSelectedRole(e.target.value);
  };

  return (
    <Box p={5} bg="gray.50" borderRadius="lg" boxShadow="base">
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
          {roles.map(rol => (
            <option key={rol} value={rol}>
              {rol}
            </option>
          ))}
        </Select>
      </Flex>

      <Box width="60%" mt={2}>
        {tags.map(tag => (
          <Tag key={tag} size="md" colorScheme="teal" borderRadius="full" mr={2}>
            <TagLabel>{tag}</TagLabel>
            <TagCloseButton onClick={() => handleDeleteTag(tag)} />
          </Tag>
        ))}
        {tags.length > 0 && (
          <Button
            size="sm"
            colorScheme="teal"
            borderRadius="full"
            height="25px"
            paddingX={4}
            ml={2}
            onClick={() => setTags([])}
          >
            Borrar Búsquedas
          </Button>
        )}
      </Box>

      <br />

      <Tabs onChange={index => setIsActiveTab(index === 0)}>
        <TabList>
          <Tab _selected={{ color: "white", bg: "blue.700" }}>
            Activos ({activeCount})
          </Tab>
          <Tab _selected={{ color: "white", bg: "red.500" }}>
            Inactivos ({inactiveCount})
          </Tab>
        </TabList>

        <TabPanels>
          {[true, false].map((isActive, index) => (
            <TabPanel key={index}>
              <TableContainer borderRadius="md" boxShadow="md" bg="white" p={4}>
                <Table variant="striped" colorScheme="gray" size="md">
                  <Thead>
                    <Tr bg={isActive ? "blue.300" : "red.900"}>
                      <Th color="white">Nombre</Th>
                      <Th color="white">Email</Th>
                      <Th color="white">Teléfono</Th>
                      <Th color="white">Rol</Th>
                      <Th color="white">Acciones</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {filteredUsuarios.map(usuario => (
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
                            colorScheme={isActive ? "red" : "green"}
                            size="sm"
                            onClick={() => isActive 
                              ? handleInactivarUsuario(usuario._id)
                              : handleActivarUsuario(usuario._id)
                            }
                          >
                            {isActive ? "Inactivar" : "Activar"}
                          </Button>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </TableContainer>
            </TabPanel>
          ))}
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