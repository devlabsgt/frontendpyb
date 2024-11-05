import React, { useState, useEffect } from "react";
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
      bg: "green.50" 
    },
    Inactivo: { 
      color: "gray", 
      icon: <PowerOff size={16} />,
      bg: "gray.50"
    },
    Finalizado: { 
      color: "blue", 
      icon: <CheckSquare size={16} />,
      bg: "blue.50"
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
    const [estadoToChange, setEstadoToChange] = useState(null);
    const [view, setView] = useState("list");
    const [estadoFilter, setEstadoFilter] = useState("todos");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const itemsPerPage = 10;
  
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
    const fetchProyectos = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("No hay token de autenticación");
  
        const response = await fetch(`${process.env.REACT_APP_backend}/proyecto`, {
          headers: { Authorization: `Bearer ${token}` },
        });
  
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
          applyFilters(sortedProyectos, estadoFilter);
        } else {
          setProyectos([]);
          applyFilters([], estadoFilter);
        }
      } catch (error) {
        console.error("Error al cargar proyectos:", error);
        setProyectos([]);
        applyFilters([], estadoFilter);
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
    };
  
    // Efecto para cargar proyectos al montar el componente
    useEffect(() => {
      fetchProyectos();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
  
    // Función para aplicar filtros
    const applyFilters = (proyectosList = proyectos, estado = estadoFilter) => {
      let filtered = [...proyectosList];
      if (estado !== "todos") {
        filtered = filtered.filter((proyecto) => proyecto.estado === estado);
      }
      setFilteredProyectos(filtered);
      setTotalPages(Math.ceil(filtered.length / itemsPerPage));
      setCurrentPage(1);
    };
  
    // Funciones de paginación
    const getCurrentPageItems = () => {
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      return filteredProyectos.slice(startIndex, endIndex);
    };
  
    const handlePageChange = (newPage) => {
      setCurrentPage(newPage);
    };
  
    // Manejadores de eventos
    const handleEstadoFilterChange = (e) => {
      const newEstado = e.target.value;
      setEstadoFilter(newEstado);
      applyFilters(proyectos, newEstado);
    };
  
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
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(
          `${process.env.REACT_APP_backend}/proyecto/${proyecto._id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
  
        if (!response.ok) throw new Error("Error al cargar los detalles del proyecto");
  
        const detallesProyecto = await response.json();
        setSelectedProjectDetails(detallesProyecto);
        onDetailsOpen();
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
  
        if (!response.ok) throw new Error("Error al cambiar el estado del proyecto");
  
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
  
    const handleEditSuccess = async () => {
      try {
        await fetchProyectos();
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
  
    const handleCreateSuccess = async () => {
      try {
        await fetchProyectos();
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
      borderColor="purple.400"
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
                color="purple.700"
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
            <Heading 
              size="sm" 
              mb={2}
              color="gray.800"
            >
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

          <Box 
            bg="gray.50" 
            p={3} 
            borderRadius="lg"
          >
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
                '& > div': {
                  background: 
                    proyecto.nivelAvance < 30
                      ? 'linear-gradient(to right, #f56565, #fc8181)'
                      : proyecto.nivelAvance < 70
                      ? 'linear-gradient(to right, #ecc94b, #f6e05e)'
                      : 'linear-gradient(to right, #48bb78, #68d391)'
                }
              }}
              hasStripe
              isAnimated
            />
          </Box>

          <HStack 
            justify="center" 
            spacing={3} 
            pt={2}
          >
            <Tooltip label="Ver detalles" hasArrow>
              <IconButton
                icon={<Eye size={16} />}
                aria-label="Ver detalles"
                colorScheme="purple"
                variant="ghost"
                bg="purple.50"
                onClick={() => handleViewDetails(proyecto)}
                size="sm"
                _hover={{ bg: 'purple.100' }}
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
                _hover={{ bg: 'blue.100' }}
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
    <Container 
      maxW="container.xl" 
      py={6} 
      px={{ base: 4, md: 6 }}
      bg="gray.50"
    >
      <VStack spacing={6} align="stretch">
        <Card
          bg="white"
          shadow="sm"
          borderRadius="xl"
          overflow="hidden"
          borderTop="4px solid"
          borderColor="purple.400"
        >
          <CardBody>
            <VStack spacing={6} align="stretch">
              {/* Header con filtros */}
              <Flex
                direction={{ base: "column", md: "row" }}
                justify="space-between"
                align={{ base: "stretch", md: "center" }}
                gap={4}
              >
                <Heading 
                  size={{ base: "md", md: "lg" }}
                  bgGradient="linear(to-r, purple.600, blue.600)"
                  bgClip="text"
                >
                  Gestión de Proyectos
                </Heading>
                <HStack 
                  spacing={4}
                  w={{ base: "full", md: "auto" }}
                >
                  <Select
                    value={estadoFilter}
                    onChange={handleEstadoFilterChange}
                    size="md"
                    w={{ base: "full", md: "200px" }}
                    bg="white"
                    borderColor="purple.200"
                    _hover={{ borderColor: "purple.300" }}
                    _focus={{ borderColor: "purple.400", boxShadow: "0 0 0 1px var(--chakra-colors-purple-400)" }}
                  >
                    <option value="todos">Todos los estados</option>
                    <option value="Activo">Activos</option>
                    <option value="Inactivo">Inactivos</option>
                    <option value="Finalizado">Finalizados</option>
                  </Select>
                  <Button
                    leftIcon={<Plus className="w-4 h-4" />}
                    bg="purple.500"
                    color="white"
                    _hover={{ bg: "purple.600" }}
                    _active={{ bg: "purple.700" }}
                    onClick={handleCreateProject}
                    size="md"
                    shadow="sm"
                    w={{ base: "full", md: "auto" }}
                  >
                    Nuevo Proyecto
                  </Button>
                </HStack>
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
                    {estadoFilter !== "todos" ? `en estado ${estadoFilter}` : ""}
                  </Text>
                  <Button
                    colorScheme="purple"
                    variant="outline"
                    leftIcon={<Plus className="w-4 h-4" />}
                    onClick={handleCreateProject}
                  >
                    Crear nuevo proyecto
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
                              borderColor="purple.100"
                              color="gray.700"
                            >
                              Número
                            </Th>
                            <Th borderBottom="2px" borderColor="purple.100">Código</Th>
                            <Th borderBottom="2px" borderColor="purple.100">Nombre</Th>
                            <Th borderBottom="2px" borderColor="purple.100">Encargado</Th>
                            <Th borderBottom="2px" borderColor="purple.100">Estado</Th>
                            <Th borderBottom="2px" borderColor="purple.100">Avance</Th>
                            <Th borderBottom="2px" borderColor="purple.100">Acciones</Th>
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
                              <Td maxW="300px" isTruncated>{proyecto.nombre}</Td>
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
                                    <Text fontSize="sm">{proyecto.nivelAvance}%</Text>
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
                                      '& > div': {
                                        background: 
                                          proyecto.nivelAvance < 30
                                            ? 'linear-gradient(to right, #f56565, #fc8181)'
                                            : proyecto.nivelAvance < 70
                                            ? 'linear-gradient(to right, #ecc94b, #f6e05e)'
                                            : 'linear-gradient(to right, #48bb78, #68d391)'
                                      }
                                    }}
                                    hasStripe
                                    isAnimated
                                  />
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
                                      onClick={() => handleViewDetails(proyecto)}
                                      size="sm"
                                      _hover={{ bg: 'purple.100' }}
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
                                      _hover={{ bg: 'blue.100' }}
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
                          borderColor="purple.200"
                          _hover={{ bg: 'purple.50' }}
                        />
                        {Array.from({ length: totalPages }, (_, i) => (
                          <Button
                            key={i + 1}
                            onClick={() => handlePageChange(i + 1)}
                            bg={currentPage === i + 1 ? "purple.500" : "white"}
                            color={currentPage === i + 1 ? "white" : "gray.600"}
                            borderColor="purple.200"
                            _hover={{
                              bg: currentPage === i + 1 ? "purple.600" : "purple.50"
                            }}
                            display={{ base: "none", md: "inline-flex" }}
                          >
                            {i + 1}
                          </Button>
                        ))}
                        <Text 
                          display={{ base: "inline-flex", md: "none" }}
                          px={4}
                          py={2}
                          bg="white"
                          borderX="1px"
                          borderColor="purple.200"
                        >
                          {currentPage} de {totalPages}
                        </Text>
                        <IconButton
                          icon={<ChevronRight size={18} />}
                          onClick={() => handlePageChange(currentPage + 1)}
                          isDisabled={currentPage === totalPages}
                          aria-label="Next page"
                          bg="white"
                          borderColor="purple.200"
                          _hover={{ bg: 'purple.50' }}
                        />
                      </ButtonGroup>
                    </HStack>
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
          size={{ base: "full", md: "6xl" }}
          motionPreset={isMobile ? "slideInBottom" : "slideInRight"}
        >
          <ModalOverlay 
            bg="blackAlpha.300" 
            backdropFilter="blur(10px)" 
          />
          <ModalContent
            maxW={{ base: "100%", md: "50vw" }}
            minH={{ base: "100vh", md: "50vh" }}
            m={{ base: 0, md: 4 }}
            borderRadius={{ base: 0, md: "xl" }}
            bg="white"
            overflow="hidden"
          >
            <ModalBody p={0}>
              <Box
                h={{ base: "100vh", md: "70vh" }}
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
          onClose={onDetailsClose}
          size={{ base: "full", md: "2xl" }}
          motionPreset="slideInBottom"
        >
          <ModalOverlay 
            bg="blackAlpha.300" 
            backdropFilter="blur(10px)" 
          />
          <ModalContent
            maxW={{ base: "100%", md: "800px" }}
            minH={{ base: "100vh", md: "auto" }}
            m={{ base: 0, md: "24px auto" }}
            borderRadius={{ base: 0, md: "xl" }}
            bg="white"
            overflow="hidden"
          >
            <ModalHeader
              borderBottom="1px"
              borderColor="purple.100"
              bg="purple.50"
              px={4}
              py={3}
              color="purple.700"
            >
              Detalles del Proyecto
              <ModalCloseButton color="purple.500" />
            </ModalHeader>
            <ModalBody
              p={0}
              overflow="auto"
              maxH={{ base: "calc(100vh - 80px)", md: "85vh" }}
            >
              {selectedProjectDetails && (
                <VerProyecto
                  proyecto={selectedProjectDetails}
                  onBack={onDetailsClose}
                />
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
                    bg={`${getConfirmationDialogContent(
                      estadoToChange.proyecto,
                      estadoToChange.nuevoEstado
                    ).confirmButtonColor}.50`}
                    color={`${getConfirmationDialogContent(
                      estadoToChange.proyecto,
                      estadoToChange.nuevoEstado
                    ).confirmButtonColor}.700`}
                    px={6}
                    py={4}
                  >
                    {getConfirmationDialogContent(
                      estadoToChange.proyecto,
                      estadoToChange.nuevoEstado
                    ).title}
                  </AlertDialogHeader>

                  <AlertDialogBody px={6} py={4}>
                    <VStack align="stretch" spacing={4}>
                      <Text>
                        {getConfirmationDialogContent(
                          estadoToChange.proyecto,
                          estadoToChange.nuevoEstado
                        ).description}
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
                          <UnorderedList spacing={2} fontSize="sm" color="gray.600">
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
                      _hover={{ bg: 'gray.100' }}
                    >
                      Cancelar
                    </Button>
                    <Button
                      colorScheme={getConfirmationDialogContent(
                        estadoToChange.proyecto,
                        estadoToChange.nuevoEstado
                      ).confirmButtonColor}
                      onClick={handleConfirmEstadoChange}
                      ml={3}
                      _hover={{
                        transform: 'translateY(-1px)',
                        shadow: 'md',
                      }}
                    >
                      {getConfirmationDialogContent(
                        estadoToChange.proyecto,
                        estadoToChange.nuevoEstado
                      ).confirmButtonText}
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