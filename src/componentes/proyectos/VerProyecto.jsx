import React from "react";
import {
  Box,
  Card,
  CardBody,
  Stack,
  Heading,
  Text,
  Divider,
  Badge,
  Grid,
  GridItem,
  VStack,
  HStack,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Code,
} from "@chakra-ui/react";

const VerProyecto = ({ proyecto, onBack }) => {
  const formatFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString("es-GT", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatPresupuesto = (monto) => {
    return new Intl.NumberFormat("es-GT", {
      style: "currency",
      currency: "GTQ",
    }).format(monto);
  };

  return (
    <Box p={{ base: 1, md: 1 }} maxW="container.md" mx="auto">
      <Card>
        <CardBody>
          <VStack spacing={6} align="stretch">
            {/* Encabezado del Proyecto */}
            <HStack justify="space-between" wrap="wrap">
              <VStack align="start" spacing={1}>
                <Heading size="lg" isTruncated>{proyecto.nombre}</Heading>
                <Text color="gray.600">Código: {proyecto.codigo}</Text>
              </VStack>
              <Badge
                colorScheme={
                  proyecto.estado === "Activo"
                    ? "green"
                    : proyecto.estado === "Finalizado"
                    ? "blue"
                    : "red"
                }
                p={2}
                borderRadius="md"
              >
                {proyecto.estado}
              </Badge>
            </HStack>

            <Divider />

            {/* Información del Proyecto */}
            <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={6}>
              <GridItem>
                <Stack spacing={3}>
                  <Box>
                    <Text fontWeight="bold">Encargado</Text>
                    <Text>{proyecto.encargado?.nombre || "No asignado"}</Text>
                  </Box>
                  <Box>
                    <Text fontWeight="bold">Presupuesto</Text>
                    <Text>{formatPresupuesto(proyecto.presupuesto)}</Text>
                  </Box>
                  <Box>
                    <Text fontWeight="bold">Nivel de Avance</Text>
                    <Badge
                      colorScheme={
                        proyecto.nivelAvance >= 75
                          ? "green"
                          : proyecto.nivelAvance >= 50
                          ? "blue"
                          : proyecto.nivelAvance >= 25
                          ? "yellow"
                          : "red"
                      }
                    >
                      {proyecto.nivelAvance}%
                    </Badge>
                  </Box>
                </Stack>
              </GridItem>

              <GridItem>
                <Stack spacing={3}>
                  <Box>
                    <Text fontWeight="bold">Fecha de Inicio</Text>
                    <Text>{formatFecha(proyecto.fechaInicio)}</Text>
                  </Box>
                  <Box>
                    <Text fontWeight="bold">Fecha Final</Text>
                    <Text>{formatFecha(proyecto.fechaFinal)}</Text>
                  </Box>
                  <Box>
                    <Text fontWeight="bold">Implicación Municipal</Text>
                    <Badge>{proyecto.implicacionMunicipalidades}</Badge>
                  </Box>
                </Stack>
              </GridItem>
            </Grid>

            <Divider />

            {/* Tabla de Donantes */}
            <Box>
              <Heading size="md" mb={4}>
                Donantes
              </Heading>
              <Box overflowX="auto">
                <Table variant="simple" size="sm" minW="400px">
                  <Thead>
                    <Tr>
                      <Th>Donante</Th>
                      <Th isNumeric>Porcentaje</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {proyecto.donantes.map((d, index) => (
                      <Tr key={index}>
                        <Td>{d.donante?.nombre || "No asignado"}</Td>
                        <Td isNumeric>{d.porcentaje}%</Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </Box>
            </Box>

            <Divider />

            {/* Tabla de Lugares Priorizados */}
            <Box>
              <Heading size="md" mb={4}>
                Lugares Priorizados
              </Heading>
              <Box overflowX="auto">
                <Table variant="simple" size="sm" minW="600px">
                  <Thead>
                    <Tr>
                      <Th>Departamento</Th>
                      <Th>Municipio</Th>
                      <Th>Localidad</Th>
                      <Th isNumeric>Prioridad</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {proyecto.lugaresAPriorizar.map((lugar, index) => (
                      <Tr key={index}>
                        <Td>{lugar.departamento}</Td>
                        <Td>{lugar.municipio}</Td>
                        <Td>{lugar.localidad}</Td>
                        <Td isNumeric>{lugar.prioridad}</Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </Box>
            </Box>

            <Divider />

            {/* Tabla de Beneficiarios */}
            <Box>
              <Heading size="md" mb={4}>
                Beneficiarios del Proyecto
              </Heading>
              <Box overflowX="auto">
                <Table variant="simple" size="sm" minW="800px">
                  <Thead>
                    <Tr>
                      <Th>Nombre</Th>
                      <Th>DPI</Th>
                      <Th>Género</Th>
                      <Th>Localidad</Th>
                      <Th>Teléfono</Th>
                      <Th>Estado</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                  {proyecto.beneficiarios?.map((b, index) => (
                    <Tr key={index}>
                      <Td>{b.beneficiario?.nombre}</Td>
                      <Td>
                        <Code>{b.beneficiario?.dpi}</Code>
                      </Td>
                      <Td>{b.beneficiario?.genero}</Td>
                      <Td>
                        <Text fontSize="sm">
                          {b.beneficiario?.departamento},{" "}
                          {b.beneficiario?.municipio},{" "}
                          {b.beneficiario?.localidad}
                        </Text>
                      </Td>
                      <Td>{b.beneficiario?.telefono || "No disponible"}</Td>
                      <Td>
                        <Badge
                          colorScheme={b.estado === "Activo" ? "green" : "red"}
                          variant="subtle"
                        >
                          {b.estado}
                        </Badge>
                      </Td>
                    </Tr>
                  ))}
                  </Tbody>
                </Table>
                {(!proyecto.beneficiarios || proyecto.beneficiarios.length === 0) && (
                  <Box py={8} textAlign="center" bg="gray.50" borderRadius="md">
                    <Text color="gray.500">
                      No hay beneficiarios asignados a este proyecto
                    </Text>
                  </Box>
                )}
              </Box>
            </Box>

            <Divider />

            {/* Información de Seguimiento */}
            <Box>
              <Heading size="md" mb={4}>
                Seguimiento
              </Heading>
              <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={6}>
                <Box>
                  <Text fontWeight="bold">Frecuencia</Text>
                  <Text>{proyecto.seguimiento.frecuencia}</Text>
                </Box>
                <Box>
                  <Text fontWeight="bold">Requiere Visita</Text>
                  <Badge colorScheme={proyecto.seguimiento.requiereVisita ? "green" : "gray"}>
                    {proyecto.seguimiento.requiereVisita ? "Sí" : "No"}
                  </Badge>
                </Box>
              </Grid>
            </Box>
          </VStack>
        </CardBody>
      </Card>
    </Box>
  );
};

export default VerProyecto;
