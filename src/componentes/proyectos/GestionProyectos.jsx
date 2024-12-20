import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Button,
  Heading,
  useDisclosure,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Input,
  Tag,
  TagLabel,
  TagCloseButton,
  IconButton,
  HStack,
  Text,
  Badge,
  Card,
  CardBody,
  VStack,
  useToast,
  Progress,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  Code,
  Tooltip,
  ModalHeader,
  ModalCloseButton,
  Flex,
  Container,
  UnorderedList,
  ListItem,
  Select,
  ButtonGroup,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useBreakpointValue,
  Alert,
  AlertIcon,
} from "@chakra-ui/react";
import {
  Plus,
  Pencil,
  Eye,
  Power,
  PowerOff,
  ChevronLeft,
  ChevronRight,
  CheckSquare,
} from "lucide-react";
import { motion } from "framer-motion";
import EditarProyecto from "./EditarProyecto";
import CrearProyecto from "./CrearProyecto";
import VerProyecto from "./VerProyecto";

// eslint-disable-next-line
const MotionBox = motion(Box);

// Componente para el menú de estados mejorado visualmente
const EstadoMenu = ({ proyecto, onEstadoChange }) => {
  const estados = {
    Activo: {
      color: "green",
      icon: <Power size={16} />,
      bg: "green.50",
    },
    Inactivo: {
      color: "gray",
      icon: <PowerOff size={16} />,
      bg: "gray.50",
    },
    Finalizado: {
      color: "blue",
      icon: <CheckSquare size={16} />,
      bg: "blue.50",
    },
  };

  const opcionesDisponibles = {
    Activo: ["Inactivo", "Finalizado"],
    Inactivo: ["Activo"],
    Finalizado: ["Activo"],
  };

  return (
    <Menu>
      <MenuButton
        as={IconButton}
        aria-label="Cambiar estado"
        icon={estados[proyecto.estado].icon}
        variant="ghost"
        bg={estados[proyecto.estado].bg}
        color={`${estados[proyecto.estado].color}.600`}
        _hover={{
          bg: `${estados[proyecto.estado].color}.100`,
        }}
        size="sm"
      />
      <MenuList
        border="1px"
        borderColor="gray.100"
        shadow="lg"
        bg="white"
        p="2"
      >
        {opcionesDisponibles[proyecto.estado]?.map((estado) => (
          <MenuItem
            key={estado}
            icon={estados[estado].icon}
            onClick={() => onEstadoChange(proyecto, estado)}
            color={`${estados[estado].color}.600`}
            bg="transparent"
            _hover={{
              bg: `${estados[estado].color}.50`,
            }}
            borderRadius="md"
            mb="1"
          >
            Marcar como {estado}
          </MenuItem>
        ))}
      </MenuList>
    </Menu>
  );
};

const GestionProyectos = () => {
  // Estados principales
  const [proyectos, setProyectos] = useState([]);
  const [filteredProyectos, setFilteredProyectos] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedProjectDetails, setSelectedProjectDetails] = useState(null);
  // eslint-disable-next-line
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(Date.now());
  const [estadoToChange, setEstadoToChange] = useState(null);
  const [view, setView] = useState("list");
  const [estadoFilter, setEstadoFilter] = useState("todos");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;
  const [tags, setTags] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Referencias
  const cancelRef = React.useRef();

  // Hooks de Chakra UI
  const {
    isOpen: isEditOpen,
    onOpen: onEditOpen,
    onClose: onEditClose,
  } = useDisclosure();

  const {
    isOpen: isCreateOpen,
    onOpen: onCreateOpen,
    onClose: onCreateClose,
  } = useDisclosure();

  const {
    isOpen: isConfirmOpen,
    onOpen: onConfirmOpen,
    onClose: onConfirmClose,
  } = useDisclosure();

  const {
    isOpen: isDetailsOpen,
    onOpen: onDetailsOpen,
    onClose: onDetailsClose,
  } = useDisclosure();

  const toast = useToast();
  const isMobile = useBreakpointValue({ base: true, md: false });

  // Función para cargar proyectos
  const fetchProyectos = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No hay token de autenticación");
  
      const response = await fetch(
        `${process.env.REACT_APP_backend}/proyecto`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
  
      if (!response.ok) throw new Error("Error al cargar proyectos");
  
      const data = await response.json();
  
      if (Array.isArray(data)) {
        const sortedProyectos = data.sort((a, b) => {
          if (!a.numero || !b.numero) return 0;
          const [yearA, numA] = (a.numero || "").split("-");
          const [yearB, numB] = (b.numero || "").split("-");
          if (!yearA || !yearB || !numA || !numB) return 0;
          if (yearB !== yearA) {
            return parseInt(yearB) - parseInt(yearA);
          }
          return parseInt(numB) - parseInt(numA);
        });
  
        setProyectos(sortedProyectos);
        setFilteredProyectos(sortedProyectos);
        
        // Actualizar el proyecto seleccionado si existe
        if (selectedProjectDetails) {
          const updatedProject = sortedProyectos.find(
            p => p._id === selectedProjectDetails._id
          );
          if (updatedProject) {
            setSelectedProjectDetails(updatedProject);
          }
        }
      }
    } catch (error) {
      console.error("Error al cargar proyectos:", error);
      toast({
        title: "Error",
        description: error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast, selectedProjectDetails]);

  // Efecto para cargar proyectos al montar el componente
  useEffect(() => {
    const loadProyectos = async () => {
      try {
        await fetchProyectos();
      } catch (error) {
        console.error("Error al cargar proyectos iniciales:", error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los proyectos",
          status: "error",
          duration: 5000,
        });
      }
    };
    loadProyectos();
    // eslint-disable-next-line
  }, [lastUpdate]);

  // Función para aplicar los filtros
  const applyFilters = useCallback(() => {
    let filtered = proyectos;
    if (estadoFilter !== "todos") {
      filtered = filtered.filter(
        (proyecto) => proyecto.estado === estadoFilter
      );
    }
    if (tags.length > 0) {
      filtered = filtered.filter((proyecto) =>
        tags.every((tag) =>
          ["nombre", "codigo", "estado", "encargado.nombre"].some((field) =>
            (field.split(".").reduce((o, i) => o[i], proyecto) || "")
              .toLowerCase()
              .includes(tag.toLowerCase())
          )
        )
      );
    }
    setFilteredProyectos(filtered);
  }, [proyectos, estadoFilter, tags]);

  // Efecto para cargar proyectos al montar el componente
  useEffect(() => {
    applyFilters();
  }, [tags, estadoFilter, proyectos, applyFilters]);

  //calcular el total de páginas
  useEffect(() => {
    const total = Math.ceil(filteredProyectos.length / itemsPerPage);
    setTotalPages(total);
  }, [filteredProyectos, itemsPerPage]);

  // Funciones de paginación
  const getCurrentPageItems = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredProyectos.slice(startIndex, endIndex);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      // Opcional: Desplazar hacia arriba cuando se cambia de página
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Manejadores de eventos
  //const handleEstadoFilterChange = (e) => {
  //  const newEstado = e.target.value;
  //  setEstadoFilter(newEstado);
  //  applyFilters(proyectos, newEstado);
  //};

  const handleCreateProject = () => {
    setView("create");
    onCreateOpen();
  };

  const handleEditProject = (projectId) => {
    setSelectedProject(projectId);
    setView("edit");
    onEditOpen();
  };

  const handleViewDetails = async (proyecto) => {
    if (!proyecto?._id) {
      console.error('ID de proyecto no válido:', proyecto);
      toast({
        title: "Error",
        description: "No se puede cargar los detalles del proyecto",
        status: "error",
        duration: 5000,
      });
      return;
    }
  
    try {
      setIsLoading(true);
      const token = localStorage.getItem("token");
      
      const response = await fetch(
        `${process.env.REACT_APP_backend}/proyecto/${proyecto._id}`,
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Cache-Control': 'no-cache'
          },
        }
      );
  
      if (!response.ok) {
        throw new Error(`Error al cargar los detalles del proyecto: ${response.statusText}`);
      }
  
      const detallesProyecto = await response.json();
  
      // Verificar que los datos sean válidos y completos
      if (!detallesProyecto || !detallesProyecto._id) {
        throw new Error("Los datos del proyecto están incompletos");
      }
  
      // Asegurar que todas las referencias estén presentes
      const proyectoCompleto = {
        ...detallesProyecto,
        encargado: detallesProyecto.encargado || null,
        donantes: detallesProyecto.donantes || [],
        beneficiarios: detallesProyecto.beneficiarios || [],
        objetivosGlobales: detallesProyecto.objetivosGlobales || [],
        lineasEstrategicas: detallesProyecto.lineasEstrategicas || [],
      };
  
      setSelectedProjectDetails(proyectoCompleto);
      onDetailsOpen();
    } catch (error) {
      console.error('Error en handleViewDetails:', error);
      toast({
        title: "Error",
        description: error.message || "Error al cargar los detalles del proyecto",
        status: "error",
        duration: 5000,
      });
      setSelectedProjectDetails(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Manejadores de eventos para búsqueda por etiquetas
  const handleKeyDown = (e) => {
    if (
      e.key === "Enter" &&
      searchTerm.trim() &&
      !tags.includes(searchTerm.trim())
    ) {
      setTags((prevTags) => [...prevTags, searchTerm.trim()]);
      setSearchTerm("");
    }
  };

  const handleDeleteTag = (tagToDelete) => {
    setTags((prevTags) => prevTags.filter((tag) => tag !== tagToDelete));
  };

  const handleEstadoChange = async (proyecto, nuevoEstado) => {
    setEstadoToChange({ proyecto, nuevoEstado });
    onConfirmOpen();
  };

  const handleConfirmEstadoChange = async () => {
    if (!estadoToChange) return;

    try {
      const { proyecto, nuevoEstado } = estadoToChange;
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.REACT_APP_backend}/proyecto/${proyecto._id}/estado`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ estado: nuevoEstado }),
        }
      );

      if (!response.ok)
        throw new Error("Error al cambiar el estado del proyecto");

      const updatedProyectos = proyectos.map((p) =>
        p._id === proyecto._id ? { ...p, estado: nuevoEstado } : p
      );
      setProyectos(updatedProyectos);
      applyFilters(updatedProyectos, estadoFilter);

      toast({
        title: "Éxito",
        description: `Proyecto marcado como ${nuevoEstado}`,
        status: "success",
        duration: 5000,
        isClosable: true,
      });

      onConfirmClose();
      setEstadoToChange(null);
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleCancelEdit = () => {
    setSelectedProject(null);
    setView("list");
    onEditClose();
  };

  const handleCancelCreate = () => {
    setView("list");
    onCreateClose();
  };

  const handleEditSuccess = async (updatedProject) => {
    try {
      if (!updatedProject?._id) {
        throw new Error("Datos del proyecto actualizados inválidos");
      }
  
      // Actualizar el proyecto en el estado local inmediatamente
      const proyectoActualizado = {
        ...updatedProject,
        encargado: updatedProject.encargado || null,
        donantes: updatedProject.donantes || [],
        beneficiarios: updatedProject.beneficiarios || [],
        objetivosGlobales: updatedProject.objetivosGlobales || [],
        lineasEstrategicas: updatedProject.lineasEstrategicas || [],
      };
  
      setProyectos((prevProyectos) =>
        prevProyectos.map((p) =>
          p._id === proyectoActualizado._id ? proyectoActualizado : p
        )
      );
      
      setFilteredProyectos((prevProyectos) =>
        prevProyectos.map((p) =>
          p._id === proyectoActualizado._id ? proyectoActualizado : p
        )
      );
  
      // Actualizar el proyecto seleccionado si está siendo visualizado
      if (selectedProjectDetails?._id === proyectoActualizado._id) {
        setSelectedProjectDetails(proyectoActualizado);
      }
  
      // Cerrar el modal y limpiar el estado
      setSelectedProject(null);
      setView("list");
      onEditClose();
  
      toast({
        title: "Éxito",
        description: "Proyecto actualizado correctamente",
        status: "success",
        duration: 5000,
        isClosable: true,
      });
  
      // Recargar los proyectos para asegurar sincronización
      await fetchProyectos();
    } catch (error) {
      console.error("Error en handleEditSuccess:", error);
      toast({
        title: "Error",
        description: error.message || "Error al actualizar el proyecto",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleCreateSuccess = async (newProject) => {
    try {
      setLastUpdate(Date.now()); // Trigger actualización
      setView("list");
      onCreateClose();
      toast({
        title: "Éxito",
        description: "Proyecto creado correctamente",
        status: "success",
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Función auxiliar para obtener contenido del diálogo de confirmación
  const getConfirmationDialogContent = (proyecto, nuevoEstado) => {
    switch (nuevoEstado) {
      case "Inactivo":
        return {
          title: "Desactivar Proyecto",
          description: "¿Está seguro de desactivar el proyecto?",
          consequences: [
            "El proyecto se marcará como inactivo",
            "No se podrá editar mientras esté inactivo",
            "Se mantendrá visible en el historial",
            "Podrá reactivarlo más tarde si es necesario",
          ],
          confirmButtonText: "Desactivar",
          confirmButtonColor: "red",
        };
      case "Activo":
        return {
          title: "Reactivar Proyecto",
          description: "¿Está seguro de reactivar el proyecto?",
          consequences: [
            "El proyecto volverá a estar activo",
            "Se podrá editar y actualizar",
            "Continuará con su configuración anterior",
          ],
          confirmButtonText: "Reactivar",
          confirmButtonColor: "green",
        };
      case "Finalizado":
        return {
          title: "Finalizar Proyecto",
          description: "¿Está seguro de marcar el proyecto como finalizado?",
          consequences: [
            "El proyecto se marcará como completado",
            "No se podrá editar después de finalizado",
            "Este cambio no se puede deshacer",
            "Se mantendrá en el historial permanentemente",
          ],
          confirmButtonText: "Finalizar",
          confirmButtonColor: "blue",
        };
      default:
        return {
          title: "Cambiar Estado",
          description: "¿Está seguro de realizar este cambio?",
          consequences: ["El estado del proyecto cambiará"],
          confirmButtonText: "Confirmar",
          confirmButtonColor: "blue",
        };
    }
  };

  // Componente de tarjeta mejorado para móviles
  const ProyectoCard = ({ proyecto }) => (
    <Card
      w="full"
      bg="white"
      shadow="sm"
      _hover={{ shadow: "md" }}
      transition="all 0.2s"
      borderRadius="xl"
      overflow="hidden"
      borderTop="4px solid"
      borderColor="blue.400"
    >
      <CardBody>
        <VStack align="stretch" spacing={4}>
          <HStack justify="space-between" wrap="wrap">
            <VStack align="start" spacing={1}>
              <Badge
                colorScheme="purple"
                px="3"
                py="1"
                borderRadius="full"
                bg="purple.50"
                color="blue.400"
              >
                {proyecto.numero}
              </Badge>
              <Code
                fontSize="xs"
                px="2"
                py="1"
                borderRadius="md"
                bg="gray.50"
                color="gray.600"
              >
                {proyecto.codigo}
              </Code>
            </VStack>
            <Badge
              px="3"
              py="1"
              borderRadius="full"
              bg={
                proyecto.estado === "Activo"
                  ? "green.50"
                  : proyecto.estado === "Inactivo"
                  ? "gray.50"
                  : "blue.50"
              }
              color={
                proyecto.estado === "Activo"
                  ? "green.600"
                  : proyecto.estado === "Inactivo"
                  ? "gray.600"
                  : "blue.600"
              }
            >
              {proyecto.estado}
            </Badge>
          </HStack>

          <Box>
            <Heading size="sm" mb={2} color="gray.800">
              {proyecto.nombre}
            </Heading>
            <Text
              fontSize="sm"
              color="gray.600"
              display="flex"
              alignItems="center"
              gap={1}
            >
              Encargado: {proyecto.encargado?.nombre}
            </Text>
          </Box>

          <Box bg="gray.50" p={3} borderRadius="lg">
            <HStack justify="space-between" mb={2}>
              <Text fontSize="sm" fontWeight="medium" color="gray.700">
                {proyecto.nivelAvance}% completado
              </Text>
              <Text fontSize="xs" color="gray.500">
                {proyecto.personasAlcanzadas} beneficiarios
              </Text>
            </HStack>
            <Progress
              value={proyecto.nivelAvance}
              size="sm"
              borderRadius="full"
              bg="gray.200"
              sx={{
                "& > div": {
                  background:
                    proyecto.nivelAvance < 30
                      ? "linear-gradient(to right, #f56565, #fc8181)"
                      : proyecto.nivelAvance < 70
                      ? "linear-gradient(to right, #ecc94b, #f6e05e)"
                      : "linear-gradient(to right, #48bb78, #68d391)",
                },
              }}
              hasStripe
              isAnimated
            />
          </Box>

          <HStack justify="center" spacing={3} pt={2}>
            <Tooltip label="Ver detalles" hasArrow>
              <IconButton
                icon={<Eye size={16} />}
                aria-label="Ver detalles"
                colorScheme="purple"
                variant="ghost"
                bg="purple.50"
                onClick={() => handleViewDetails(proyecto)}
                size="sm"
                _hover={{ bg: "purple.100" }}
              />
            </Tooltip>
            <Tooltip
              label={
                proyecto.estado === "Activo"
                  ? "Editar proyecto"
                  : proyecto.estado === "Finalizado"
                  ? "No se puede editar un proyecto finalizado"
                  : "Reactive el proyecto para editarlo"
              }
              hasArrow
            >
              <IconButton
                icon={<Pencil size={16} />}
                aria-label="Editar"
                colorScheme="blue"
                variant="ghost"
                bg="blue.50"
                onClick={() => handleEditProject(proyecto._id)}
                size="sm"
                isDisabled={proyecto.estado !== "Activo"}
                _hover={{ bg: "blue.100" }}
              />
            </Tooltip>
            <EstadoMenu
              proyecto={proyecto}
              onEstadoChange={handleEstadoChange}
            />
          </HStack>
        </VStack>
      </CardBody>
    </Card>
  );

  return (
    <Container maxW="container.xl" py={6} px={{ base: 4, md: 6 }} bg="gray.50">
      <VStack spacing={6} align="stretch">
        <Card
          bg="white"
          shadow="sm"
          borderRadius="xl"
          overflow="hidden"
          borderTop="4px solid"
          borderColor="blue.400"
        >
          <CardBody>
            <VStack spacing={6} align="stretch">
              {/* Título separado de los filtros */}
              <Box>
                <Heading
                  size={{ base: "md", md: "lg" }}
                  bgGradient="linear(to-r, purple.600, blue.600)"
                  bgClip="text"
                >
                  Gestión de Proyectos
                </Heading>
              </Box>
              {/* Header con filtros */}
              <Flex
                direction={{ base: "column", md: "row" }}
                justify="space-between"
                align={{ base: "stretch", md: "center" }}
                gap={4}
              >
                <HStack spacing={2} w={{ base: "full", md: "auto" }}>
                  <Input
                    placeholder="Buscar proyecto..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={handleKeyDown}
                    w="500px" // Ajusta el ancho según sea necesario
                    mr={4}
                  />
                  <Select
                    value={estadoFilter}
                    onChange={(e) => setEstadoFilter(e.target.value)}
                    size="md"
                    w={{ base: "full", md: "200px" }}
                    bg="white"
                    borderColor="purple.200"
                    _hover={{ borderColor: "blue.300" }}
                    _focus={{
                      borderColor: "blue.400",
                      boxShadow: "0 0 0 1px var(--chakra-colors-purple-400)",
                    }}
                  >
                    <option value="todos">Todos los estados</option>
                    <option value="Activo">Activos</option>
                    <option value="Inactivo">Inactivos</option>
                    <option value="Finalizado">Finalizados</option>
                  </Select>
                  <Button
                    leftIcon={<Plus className="w-4 h-4" />}
                    bg="blue.500"
                    color="white"
                    _hover={{ bg: "blue.600" }}
                    _active={{ bg: "blue.700" }}
                    size="md"
                    shadow="sm"
                    w={{ base: "full", md: "auto" }}
                    onClick={handleCreateProject} // Asegúrate de que esta línea esté presente
                  >
                    Nuevo Proyecto
                  </Button>
                </HStack>
              </Flex>

              <Flex ml="0%" mt={0} wrap="wrap" justifyContent="flex-start">
                {tags.map((tag) => (
                  <Tag
                    key={tag}
                    size="md"
                    colorScheme="teal"
                    borderRadius="full"
                    mr={0}
                    mb={0}
                  >
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
              </Flex>

              {/* Lista de proyectos */}
              {filteredProyectos.length === 0 ? (
                <Box
                  py={10}
                  textAlign="center"
                  bg="gray.50"
                  borderRadius="xl"
                  border="2px dashed"
                  borderColor="gray.200"
                >
                  <Text color="gray.500" mb={4}>
                    No se encontraron proyectos{" "}
                    {estadoFilter !== "todos"
                      ? `en estado ${estadoFilter}`
                      : ""}
                  </Text>
                  <Button
                    leftIcon={<Plus className="w-4 h-4" />}
                    bg="blue.500"
                    color="white"
                    _hover={{ bg: "blue.600" }}
                    _active={{ bg: "blue.700" }}
                    size="md"
                    shadow="sm"
                    w={{ base: "full", md: "auto" }}
                    onClick={handleCreateProject} // Agrega esta línea
                  >
                    Nuevo Proyecto
                  </Button>
                </Box>
              ) : (
                <Box>
                  {isMobile ? (
                    <VStack spacing={4}>
                      {getCurrentPageItems().map((proyecto) => (
                        <ProyectoCard key={proyecto._id} proyecto={proyecto} />
                      ))}
                    </VStack>
                  ) : (
                    <Box
                      overflowX="auto"
                      bg="white"
                      borderRadius="xl"
                      shadow="sm"
                    >
                      <Table variant="simple">
                        <Thead bg="gray.50">
                          <Tr>
                            <Th
                              borderBottom="2px"
                              borderColor="blue.100"
                              color="gray.700"
                            >
                              Número
                            </Th>
                            <Th borderBottom="2px" borderColor="blue.100">
                              Código
                            </Th>
                            <Th borderBottom="2px" borderColor="blue.100">
                              Nombre
                            </Th>
                            <Th borderBottom="2px" borderColor="blue.100">
                              Encargado
                            </Th>
                            <Th borderBottom="2px" borderColor="blue.100">
                              Estado
                            </Th>
                            <Th borderBottom="2px" borderColor="blue.100">
                              Avance
                            </Th>
                            <Th borderBottom="2px" borderColor="blue.100">
                              Acciones
                            </Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {getCurrentPageItems().map((proyecto) => (
                            <Tr
                              key={proyecto._id}
                              _hover={{ bg: "gray.50" }}
                              transition="all 0.2s"
                            >
                              <Td fontWeight="medium">{proyecto.numero}</Td>
                              <Td>
                                <Code
                                  px="2"
                                  py="1"
                                  borderRadius="md"
                                  bg="gray.50"
                                >
                                  {proyecto.codigo}
                                </Code>
                              </Td>
                              <Td maxW="300px" isTruncated>
                                {proyecto.nombre}
                              </Td>
                              <Td>{proyecto.encargado?.nombre}</Td>
                              <Td>
                                <Badge
                                  px="3"
                                  py="1"
                                  borderRadius="full"
                                  bg={
                                    proyecto.estado === "Activo"
                                      ? "green.50"
                                      : proyecto.estado === "Inactivo"
                                      ? "gray.50"
                                      : "blue.50"
                                  }
                                  color={
                                    proyecto.estado === "Activo"
                                      ? "green.600"
                                      : proyecto.estado === "Inactivo"
                                      ? "gray.600"
                                      : "blue.600"
                                  }
                                >
                                  {proyecto.estado}
                                </Badge>
                              </Td>
                              <Td>
                                <VStack align="stretch" spacing={1}>
                                  <HStack justify="space-between">
                                    <Text fontSize="sm">
                                      {proyecto.nivelAvance}%
                                    </Text>
                                    <Text fontSize="xs" color="gray.500">
                                      {proyecto.personasAlcanzadas}{" "}
                                      beneficiarios
                                    </Text>
                                  </HStack>
                                  <Progress
                                    value={proyecto.nivelAvance}
                                    size="sm"
                                    borderRadius="full"
                                    bg="gray.50"
                                    sx={{
                                      "& > div": {
                                        background:
                                          proyecto.nivelAvance < 30
                                            ? "linear-gradient(to right, #e53e3e, #f56565)"
                                            : proyecto.nivelAvance < 70
                                            ? "linear-gradient(to right, #d69e2e, #ecc94b)"
                                            : "linear-gradient(to right, #38a169, #48bb78)",
                                        boxShadow:
                                          "0px 2px 4px rgba(0, 0, 0, 0.2)",
                                      },
                                    }}
                                    hasStripe
                                  >
                                    <Text
                                      color="white"
                                      fontWeight="bold"
                                      textAlign="center"
                                      position="absolute"
                                      w="100%"
                                    >
                                      {`${proyecto.nivelAvance}%`}
                                    </Text>
                                  </Progress>
                                </VStack>
                              </Td>
                              <Td>
                                <HStack spacing={2}>
                                  <Tooltip label="Ver detalles" hasArrow>
                                    <IconButton
                                      icon={<Eye size={16} />}
                                      aria-label="Ver detalles"
                                      colorScheme="purple"
                                      variant="ghost"
                                      bg="purple.50"
                                      onClick={() =>
                                        handleViewDetails(proyecto)
                                      }
                                      size="sm"
                                      _hover={{ bg: "purple.100" }}
                                    />
                                  </Tooltip>
                                  <Tooltip
                                    label={
                                      proyecto.estado === "Activo"
                                        ? "Editar proyecto"
                                        : proyecto.estado === "Finalizado"
                                        ? "No se puede editar un proyecto finalizado"
                                        : "Reactive el proyecto para editarlo"
                                    }
                                    hasArrow
                                  >
                                    <IconButton
                                      icon={<Pencil size={16} />}
                                      aria-label="Editar"
                                      colorScheme="blue"
                                      variant="ghost"
                                      bg="blue.50"
                                      onClick={() =>
                                        handleEditProject(proyecto._id)
                                      }
                                      size="sm"
                                      isDisabled={proyecto.estado !== "Activo"}
                                      _hover={{ bg: "blue.100" }}
                                    />
                                  </Tooltip>
                                  <EstadoMenu
                                    proyecto={proyecto}
                                    onEstadoChange={handleEstadoChange}
                                  />
                                </HStack>
                              </Td>
                            </Tr>
                          ))}
                        </Tbody>
                      </Table>
                    </Box>
                  )}
                  <Box mt={6}>
                    <HStack spacing={2} justify="center">
                      <ButtonGroup size="sm" isAttached variant="outline">
                        <IconButton
                          icon={<ChevronLeft size={18} />}
                          onClick={() => handlePageChange(currentPage - 1)}
                          isDisabled={currentPage === 1}
                          aria-label="Previous page"
                          bg="white"
                          borderColor="blue.200"
                          _hover={{ bg: "blue.50" }}
                        />

                        {/* Mostrar números de página */}
                        {Array.from({ length: totalPages }, (_, i) => {
                          const pageNum = i + 1;
                          // Mostrar primer página, última página, página actual y páginas adyacentes
                          if (
                            pageNum === 1 ||
                            pageNum === totalPages ||
                            (pageNum >= currentPage - 1 &&
                              pageNum <= currentPage + 1)
                          ) {
                            return (
                              <Button
                                key={pageNum}
                                onClick={() => handlePageChange(pageNum)}
                                bg={
                                  currentPage === pageNum ? "blue.500" : "white"
                                }
                                color={
                                  currentPage === pageNum ? "white" : "gray.600"
                                }
                                borderColor="blue.200"
                                _hover={{
                                  bg:
                                    currentPage === pageNum
                                      ? "blue.600"
                                      : "blue.50",
                                }}
                              >
                                {pageNum}
                              </Button>
                            );
                          }
                          // Mostrar elipsis
                          if (
                            pageNum === currentPage - 2 ||
                            pageNum === currentPage + 2
                          ) {
                            return (
                              <Button
                                key={pageNum}
                                isDisabled
                                bg="white"
                                borderColor="blue.200"
                              >
                                ...
                              </Button>
                            );
                          }
                          return null;
                        })}

                        <IconButton
                          icon={<ChevronRight size={18} />}
                          onClick={() => handlePageChange(currentPage + 1)}
                          isDisabled={currentPage === totalPages}
                          aria-label="Next page"
                          bg="white"
                          borderColor="blue.200"
                          _hover={{ bg: "blue.50" }}
                        />
                      </ButtonGroup>
                    </HStack>

                    {/* Opcional: Mostrar información de paginación */}
                    <Text
                      textAlign="center"
                      fontSize="sm"
                      color="gray.500"
                      mt={2}
                    >
                      Mostrando {(currentPage - 1) * itemsPerPage + 1} a{" "}
                      {Math.min(
                        currentPage * itemsPerPage,
                        filteredProyectos.length
                      )}{" "}
                      de {filteredProyectos.length} registros
                    </Text>
                  </Box>
                </Box>
              )}
            </VStack>
          </CardBody>
        </Card>

        {/* Modales y Diálogos con estilos mejorados */}
        <Modal
          isOpen={isEditOpen || isCreateOpen}
          onClose={view === "edit" ? handleCancelEdit : handleCancelCreate}
          size={{ base: "full", md: "2xl" }}
          motionPreset={isMobile ? "slideInBottom" : "slideInRight"}
        >
          <ModalOverlay bg="blackAlpha.300" backdropFilter="blur(10px)" />
          <ModalContent
            maxW={{ base: "100%", md: "50vw" }}
            minH={{ base: "100vh", md: "50vh" }}
            m={{ base: 0, md: 4 }}
            borderRadius={{ base: 0, md: "xl" }}
            bg="white"
            overflow="hidden"
          >
            <ModalBody
              p={0}
              overflow="auto"
              maxH={{ base: "calc(100vh - 80px)", md: "85vh" }}
            >
              <Box
                h={{ base: "100vh", md: "auto" }}
                overflowY="auto"
                bg="gray.50"
                sx={{
                  "&::-webkit-scrollbar": {
                    width: "4px",
                  },
                  "&::-webkit-scrollbar-track": {
                    width: "6px",
                    bg: "gray.100",
                  },
                  "&::-webkit-scrollbar-thumb": {
                    background: "purple.500",
                    borderRadius: "24px",
                  },
                }}
              >
                {view === "edit" ? (
                  <EditarProyecto
                    proyectoId={selectedProject}
                    onCancel={handleCancelEdit}
                    onSuccess={handleEditSuccess}
                  />
                ) : (
                  <CrearProyecto
                    onCancel={handleCancelCreate}
                    onSuccess={handleCreateSuccess}
                  />
                )}
              </Box>
            </ModalBody>
          </ModalContent>
        </Modal>

        <Modal
          isOpen={isDetailsOpen}
          onClose={() => {
            onDetailsClose();
            setSelectedProjectDetails(null); // Limpiar los detalles al cerrar
          }}
          size={{ base: "full", md: "2xl" }}
          motionPreset="slideInBottom"
        >
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>
              Detalles del Proyecto
              <ModalCloseButton />
            </ModalHeader>
            <ModalBody>
              {isLoading ? (
                <Progress size="xs" isIndeterminate />
              ) : selectedProjectDetails && selectedProjectDetails._id ? (
                <VerProyecto
                  proyecto={selectedProjectDetails}
                  onBack={onDetailsClose}
                />
              ) : (
                <Alert status="error">
                  <AlertIcon />
                  <VStack align="start" spacing={2}>
                    <Text>No se pudieron cargar los detalles del proyecto</Text>
                    <Button size="sm" onClick={onDetailsClose}>
                      Cerrar
                    </Button>
                  </VStack>
                </Alert>
              )}
            </ModalBody>
          </ModalContent>
        </Modal>

        <AlertDialog
          isOpen={isConfirmOpen}
          leastDestructiveRef={cancelRef}
          onClose={onConfirmClose}
          size={{ base: "sm", md: "md" }}
        >
          <AlertDialogOverlay>
            <AlertDialogContent
              m={{ base: 4, md: "auto" }}
              borderRadius="xl"
              overflow="hidden"
            >
              {estadoToChange && (
                <>
                  <AlertDialogHeader
                    fontSize="lg"
                    fontWeight="bold"
                    bg={`${
                      getConfirmationDialogContent(
                        estadoToChange.proyecto,
                        estadoToChange.nuevoEstado
                      ).confirmButtonColor
                    }.50`}
                    color={`${
                      getConfirmationDialogContent(
                        estadoToChange.proyecto,
                        estadoToChange.nuevoEstado
                      ).confirmButtonColor
                    }.700`}
                    px={6}
                    py={4}
                  >
                    {
                      getConfirmationDialogContent(
                        estadoToChange.proyecto,
                        estadoToChange.nuevoEstado
                      ).title
                    }
                  </AlertDialogHeader>

                  <AlertDialogBody px={6} py={4}>
                    <VStack align="stretch" spacing={4}>
                      <Text>
                        {
                          getConfirmationDialogContent(
                            estadoToChange.proyecto,
                            estadoToChange.nuevoEstado
                          ).description
                        }
                      </Text>
                      <Box
                        p={4}
                        bg="gray.50"
                        borderRadius="lg"
                        border="1px"
                        borderColor="gray.200"
                      >
                        <VStack align="start" spacing={2}>
                          <Text
                            fontSize="sm"
                            fontWeight="medium"
                            color="gray.700"
                          >
                            Este cambio implica:
                          </Text>
                          <UnorderedList
                            spacing={2}
                            fontSize="sm"
                            color="gray.600"
                          >
                            {getConfirmationDialogContent(
                              estadoToChange.proyecto,
                              estadoToChange.nuevoEstado
                            ).consequences.map((consequence, index) => (
                              <ListItem key={index}>{consequence}</ListItem>
                            ))}
                          </UnorderedList>
                        </VStack>
                      </Box>
                    </VStack>
                  </AlertDialogBody>

                  <AlertDialogFooter px={6} py={4}>
                    <Button
                      ref={cancelRef}
                      onClick={onConfirmClose}
                      variant="ghost"
                      _hover={{ bg: "gray.100" }}
                    >
                      Cancelar
                    </Button>
                    <Button
                      colorScheme={
                        getConfirmationDialogContent(
                          estadoToChange.proyecto,
                          estadoToChange.nuevoEstado
                        ).confirmButtonColor
                      }
                      onClick={handleConfirmEstadoChange}
                      ml={3}
                      _hover={{
                        transform: "translateY(-1px)",
                        shadow: "md",
                      }}
                    >
                      {
                        getConfirmationDialogContent(
                          estadoToChange.proyecto,
                          estadoToChange.nuevoEstado
                        ).confirmButtonText
                      }
                    </Button>
                  </AlertDialogFooter>
                </>
              )}
            </AlertDialogContent>
          </AlertDialogOverlay>
        </AlertDialog>
      </VStack>
    </Container>
  );
};

export default GestionProyectos;
