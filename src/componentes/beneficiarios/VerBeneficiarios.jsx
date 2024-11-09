import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Box, Button, Input, useDisclosure, Text,
  Table, TableContainer, Thead, Select, Tbody, Tr, Th, Td, Tag, TagCloseButton, TagLabel, Flex, Tooltip
} from "@chakra-ui/react";
import { ViewIcon } from "@chakra-ui/icons";
import axios from "axios";
import { ModalBeneficiario } from "./ModalsBeneficiarios";
import Swal from "sweetalert2";
import { generarReporteBeneficiariosPDF } from "./reporteBeneficiariosPDF";
import { AiFillFilePdf } from "react-icons/ai";

const VerBeneficiarios = () => {
  const [beneficiarios, setBeneficiarios] = useState([]);
  const [filteredBeneficiarios, setFilteredBeneficiarios] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [tags, setTags] = useState([]);
  const [selectedBeneficiario, setSelectedBeneficiario] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isAddOpen, onOpen: onAddOpen, onClose: onAddClose } = useDisclosure();
  const [localFilters, setLocalFilters] = useState({ departamento: "Ver todo", municipio: "Ver todo" });

  const getAuthHeaders = useCallback(() => ({ headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }), []);

  useEffect(() => { obtenerBeneficiarios(); }, []);
  useEffect(() => { filtrarBeneficiarios(); }, [tags, beneficiarios, localFilters]);

  const fetchData = async (url, options = {}) => {
    try {
      const response = await axios.get(url, { ...getAuthHeaders(), ...options });
      return response.data;
    } catch (error) {
      console.error(`Error fetching ${url}:`, error);
      return null;
    }
  };

  const obtenerBeneficiarios = async () => {
    const data = await fetchData(`${process.env.REACT_APP_backend}/beneficiario`);
    if (Array.isArray(data)) {
      setBeneficiarios(data.sort((a, b) => a.nombre.localeCompare(b.nombre)));
    } else {
      console.error("Invalid response format for beneficiaries:", data);
    }
  };

  const filtrarBeneficiarios = useCallback(() => {
    let filtered = beneficiarios;

    if (localFilters.departamento !== "Ver todo") {
      filtered = filtered.filter(b => b.direccion?.departamento === localFilters.departamento);
    }
    if (localFilters.municipio !== "Ver todo") {
      filtered = filtered.filter(b => b.direccion?.municipio === localFilters.municipio);
    }
    if (tags.length > 0) {
      filtered = filtered.filter(beneficiario =>
        tags.every(tag => searchCriteria(tag, beneficiario))
      );
    }
    setFilteredBeneficiarios(filtered);
  }, [tags, beneficiarios, localFilters]);

  const searchCriteria = (tag, beneficiario) => {
    const edad = calcularEdad(new Date(beneficiario.fechaNacimiento));
    const grupoEdad = definirGrupoEdad(edad);
    const fechaNacimientoFormateada = new Date(beneficiario.fechaNacimiento).toLocaleDateString("es-ES", {
      day: "2-digit", month: "long", year: "numeric",
    });
    const direccionFields = [
      beneficiario.direccion?.departamento,
      beneficiario.direccion?.municipio,
      beneficiario.direccion?.localidad,
      beneficiario.direccion?.direccion,
    ];
    return (
      [grupoEdad.toLowerCase(), `${edad} año`, `${edad} años`].includes(tag.toLowerCase()) ||
      fechaNacimientoFormateada.includes(tag) ||
      ["nombre", "dpi", "telefono", "estadoCivil", "genero", "nombrePadre", "nombreMadre"].some(field =>
        beneficiario[field]?.toString().toLowerCase().includes(tag.toLowerCase())
      ) ||
      direccionFields.some(field => field?.toLowerCase().includes(tag.toLowerCase()))
    );
  };

  const departamentosUnicos = useMemo(() => [...new Set(beneficiarios.map(b => b.direccion?.departamento).filter(Boolean))], [beneficiarios]);
  const municipiosUnicos = useMemo(() => [...new Set(beneficiarios.map(b => b.direccion?.municipio).filter(Boolean))], [beneficiarios]);

  const handleVerBeneficiario = beneficiario => {
    setSelectedBeneficiario(beneficiario);
    onOpen();
  };

  const generarPDF = () => {
    const fechaFormato = new Date().toLocaleDateString('es-ES', { year: 'numeric', month: '2-digit', day: '2-digit' }).split('/').reverse().join('-');
    generarReporteBeneficiariosPDF(filteredBeneficiarios, `Reporte_beneficiarios_${fechaFormato}.pdf`);
  };

return (
  <Box p={5} bg="gray.50" borderRadius="lg" boxShadow="base">
    <Flex mb={4} alignItems="center" justifyContent="flex-start" wrap="nowrap" gap={4}>

      {/* Botón para añadir beneficiario */}
      <Button colorScheme="blue" onClick={onAddOpen}>
        Añadir Beneficiario
      </Button>

      {/* Input de búsqueda y botón para añadir etiqueta */}
      <Flex align="center" wrap="nowrap" gap={2}>
        <Input
          placeholder="Buscar beneficiario..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          w="400px"
        />
        <Button onClick={() => setTags(prev => prev.includes(searchTerm) ? prev : [...prev, searchTerm])} colorScheme="teal">
          Añadir Etiqueta
        </Button>
      </Flex>

      {/* Filtros por localidad */}
      <Flex align="center" wrap="nowrap" gap={2}>
        <Text fontSize="sm" fontWeight="bold" mb={2}>
          Filtros Por Localidad
        </Text>
        <Select
          value={localFilters.departamento}
          onChange={(e) => setLocalFilters({ ...localFilters, departamento: e.target.value, municipio: "Ver todo" })}
          w="120px"
          bg="blue.50"
        >
          <option value="Ver todo">Departamento</option>
          {departamentosUnicos.map(dep => <option key={dep} value={dep}>{dep}</option>)}
        </Select>
        <Select
          value={localFilters.municipio}
          onChange={(e) => setLocalFilters({ ...localFilters, municipio: e.target.value })}
          w="120px"
          bg="blue.50"
        >
          <option value="Ver todo">Municipio</option>
          {municipiosUnicos
            .filter(mun => beneficiarios.some(b => b.direccion?.departamento === localFilters.departamento && b.direccion?.municipio === mun))
            .map(mun => <option key={mun} value={mun}>{mun}</option>)}
        </Select>
      </Flex>

      {/* Botón para descargar PDF */}
      <Tooltip label="Descarga el listado en PDF según tu búsqueda." aria-label="Descripción del botón PDF">
        <Button bg="#800000" color="white" _hover={{ bg: "#660000" }} onClick={generarPDF} leftIcon={<AiFillFilePdf />}>
          Descargar PDF
        </Button>
      </Tooltip>
    </Flex>

    {/* Etiquetas para búsqueda */}
    <Flex mt={1} wrap="wrap" justifyContent="flex-start" alignItems="center" gap={2}>
      {tags.map(tag => (
        <Tag key={tag} size="md" colorScheme="teal" borderRadius="full">
          <TagLabel>{tag}</TagLabel>
          <TagCloseButton onClick={() => setTags(tags.filter(t => t !== tag))} />
        </Tag>
      ))}
      {tags.length > 0 && (
        <Button size="sm" colorScheme="teal" borderRadius="full" height="25px" paddingX={4} onClick={() => setTags([])}>
          Borrar Búsquedas
        </Button>
      )}
    </Flex>

    {/* Tabla de beneficiarios */}
    <Box overflowX="auto" mt={4}>
      <TableContainer borderRadius="md" boxShadow="md" bg="white">
        <Table variant="striped" colorScheme="gray" size="md">
          <Thead>
            <Tr bg="blue.300">
              <Th color="white" position="sticky" top={0} left={0} zIndex={2} bg="blue.300" width="50px">No.</Th>
              <Th color="white" position="sticky" top={0} left="50px" zIndex={2} bg="blue.300" width="150px">Nombre</Th>
              <Th color="white" width="100px">DPI</Th>
              <Th color="white" width="100px">Teléfono</Th>
              <Th color="white" width="150px">Fecha de Nacimiento</Th>
              <Th color="white" width="80px">Edad</Th>
              <Th color="white" width="80px">Género</Th>
              <Th color="white" width="200px">Dirección Completa</Th>
              <Th color="white" width="150px">Estado Civil</Th>
              <Th color="white" width="150px">Nombre del Padre</Th>
              <Th color="white" width="150px">Nombre de la Madre</Th>
              <Th color="white" width="120px">Acciones</Th>
            </Tr>
          </Thead>
          <Tbody fontSize={{ base: "sm", md: "md" }}>
            {filteredBeneficiarios.map((beneficiario, index) => (
              <Tr key={beneficiario._id} _hover={{ bg: "gray.100" }}>
                <Td position="sticky" left={0} bg="white" width="50px">{index + 1}</Td>
                <Td position="sticky" left="50px" bg="white" fontWeight="bold" width="150px">{beneficiario.nombre}</Td>
                <Td width="100px">{beneficiario.dpi}</Td>
                <Td width="100px">{beneficiario.telefono}</Td>
                <Td width="150px">{new Date(beneficiario.fechaNacimiento).toLocaleDateString("es-ES")}</Td>
                <Td width="80px">{calcularEdad(new Date(beneficiario.fechaNacimiento))} años</Td>
                <Td width="80px">{beneficiario.genero}</Td>
                <Td width="200px">{[beneficiario.direccion?.departamento, beneficiario.direccion?.municipio, beneficiario.direccion?.localidad, beneficiario.direccion?.direccion].filter(Boolean).join(", ")}</Td>
                <Td width="150px">{beneficiario.estadoCivil}</Td>
                <Td width="150px">{beneficiario.nombrePadre}</Td>
                <Td width="150px">{beneficiario.nombreMadre}</Td>
                <Td width="120px">
                  <Button leftIcon={<ViewIcon />} onClick={() => handleVerBeneficiario(beneficiario)} colorScheme="blue" size="sm" mr={2}>Ver</Button>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </TableContainer>
    </Box>

    <ModalBeneficiario
      isOpen={isOpen || isAddOpen}
      onClose={() => { onClose(); onAddClose(); obtenerBeneficiarios(); }}
      beneficiario={selectedBeneficiario}
      obtenerBeneficiarios={obtenerBeneficiarios}
      getAuthHeaders={getAuthHeaders}
    />
  </Box>
);

};

export default VerBeneficiarios;

const calcularEdad = fechaNacimiento => {
  const hoy = new Date();
  let edad = hoy.getFullYear() - fechaNacimiento.getFullYear();
  if (hoy.getMonth() < fechaNacimiento.getMonth() || (hoy.getMonth() === fechaNacimiento.getMonth() && hoy.getDate() < fechaNacimiento.getDate())) edad--;
  return edad;
};

const definirGrupoEdad = edad => (edad < 12 ? "niños" : edad < 18 ? "adolescentes" : edad < 65 ? "adultos" : "adultos mayores");
