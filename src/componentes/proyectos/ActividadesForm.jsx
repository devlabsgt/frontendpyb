import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Input,
  NumberInput,
  NumberInputField,
  VStack,
  HStack,
  IconButton,
  Text,
  Alert,
  AlertIcon,
  TableContainer,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  useToast,
  Progress,
  Collapse,
  Card,
  CardBody,
  Divider,
} from "@chakra-ui/react";
import { Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import QuickCreateSelect from "./QuickCreateSelect";
import ActividadAvanceForm from "./ActividadAvanceForm";

const ActividadesForm = ({
  presupuestoTotal = 0,
  actividades = [],
  onActividadesChange = () => {},
  beneficiariosDisponibles = [],
  fechasProyecto = {},
  onAvanceChange = () => {},
}) => {
  const [actividadesLocales, setActividadesLocales] = useState(actividades);
  const [error, setError] = useState(null);
  const [expandedActividad, setExpandedActividad] = useState(null);
  const toast = useToast();

  useEffect(() => {
    setActividadesLocales(actividades);
  }, [actividades]);

  const calcularAvanceTotal = (actividades) => {
    if (!actividades || actividades.length === 0) return 0;

    const totalPresupuesto = actividades.reduce(
      (sum, act) => sum + Number(act.presupuestoAsignado || 0),
      0
    );

    if (totalPresupuesto === 0) return 0;

    return actividades.reduce((total, actividad) => {
      const peso =
        Number(actividad.presupuestoAsignado || 0) / totalPresupuesto;
      const avance = Number(actividad.avance || 0);
      return total + avance * peso;
    }, 0);
  };

  useEffect(() => {
    const nuevoAvanceTotal = calcularAvanceTotal(actividadesLocales);
    onAvanceChange(Math.round(nuevoAvanceTotal * 100) / 100);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actividadesLocales]);

  const calcularPorcentajePresupuesto = (presupuestoActividad) => {
    if (!presupuestoTotal || presupuestoTotal <= 0) return 0;
    return (Number(presupuestoActividad) / Number(presupuestoTotal)) * 100;
  };

  const calcularPresupuestoDisponible = () => {
    const presupuestoUsado = actividadesLocales.reduce(
      (sum, act) => sum + Number(act.presupuestoAsignado || 0),
      0
    );
    return Number(presupuestoTotal) - presupuestoUsado;
  };

  const handleAvanceChange = (index, nuevoAvance) => {
    const nuevasActividades = [...actividadesLocales];
    nuevasActividades[index] = {
      ...nuevasActividades[index],
      avance: nuevoAvance,
    };
    setActividadesLocales(nuevasActividades);
    onActividadesChange(nuevasActividades);
  };

  const handleObservacionesChange = (index, campo, valor) => {
    const nuevasActividades = [...actividadesLocales];
    nuevasActividades[index] = {
      ...nuevasActividades[index],
      [campo]: valor,
    };
    setActividadesLocales(nuevasActividades);
    onActividadesChange(nuevasActividades);
  };

  const actualizarBeneficiarios = (index, beneficiarios) => {
    const nuevasActividades = [...actividadesLocales];
    nuevasActividades[index].beneficiariosAsociados = beneficiarios.map(
      (id) => ({
        beneficiario: id,
        estado: "Activo",
        fechaAsignacion: new Date().toISOString(),
      })
    );

    setActividadesLocales(nuevasActividades);
    onActividadesChange(nuevasActividades);
  };

  const agregarActividad = () => {
    const nuevaActividad = {
      nombre: "",
      descripcion: "",
      presupuestoAsignado: 0,
      porcentajePresupuesto: 0,
      fechaInicio: "",
      fechaFin: "",
      estado: "Pendiente",
      avance: 0,
      beneficiariosAsociados: [],
      observaciones: "",
      resultadosEsperados: [],
      metasAlcanzadas: [],
    };

    const nuevasActividades = [...actividadesLocales, nuevaActividad];
    setActividadesLocales(nuevasActividades);
    onActividadesChange(nuevasActividades);
  };

  const actualizarActividad = (index, campo, valor) => {
    const nuevasActividades = [...actividadesLocales];

    if (campo === "presupuestoAsignado") {
      const valorNumerico = Number(valor);
      const otrosPresupuestos = nuevasActividades.reduce(
        (sum, act, i) =>
          i !== index ? sum + Number(act.presupuestoAsignado || 0) : sum,
        0
      );

      if (otrosPresupuestos + valorNumerico > presupuestoTotal) {
        toast({
          title: "Error",
          description: `El presupuesto total de las actividades excedería el presupuesto del proyecto (${presupuestoTotal})`,
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      nuevasActividades[index] = {
        ...nuevasActividades[index],
        [campo]: valorNumerico,
        porcentajePresupuesto: calcularPorcentajePresupuesto(valorNumerico),
      };
    } else {
      nuevasActividades[index] = {
        ...nuevasActividades[index],
        [campo]: valor,
      };
    }

    setError(null);
    setActividadesLocales(nuevasActividades);
    onActividadesChange(nuevasActividades);
  };

  const removerActividad = (index) => {
    const nuevasActividades = actividadesLocales.filter((_, i) => i !== index);
    setActividadesLocales(nuevasActividades);
    onActividadesChange(nuevasActividades);
  };

  const formatearMoneda = (valor) => {
    return new Intl.NumberFormat("es-GT", {
      style: "currency",
      currency: "GTQ",
    }).format(valor);
  };

  return (
    <Box p={4} bg="white" borderRadius="xl" shadow="sm">
      <VStack spacing={4} align="stretch">
        {error && (
          <Alert status="error" borderRadius="md">
            <AlertIcon />
            {error}
          </Alert>
        )}

        {/* Header con información y botón de agregar */}
        <Card bg="gray.50" variant="outline">
          <CardBody>
            <HStack justify="space-between" wrap="wrap" spacing={4}>
              <VStack align="start" spacing={1}>
                <Text fontWeight="medium" color="gray.700">
                  Presupuesto Disponible:{" "}
                  <Text as="span" fontWeight="bold" color="green.600">
                    {new Intl.NumberFormat("es-GT", {
                      style: "currency",
                      currency: "GTQ",
                    }).format(calcularPresupuestoDisponible())}
                  </Text>
                </Text>
                <Text fontSize="sm" color="gray.600">
                  Avance Total del Proyecto:{" "}
                  <Text as="span" fontWeight="bold" color="blue.600">
                    {calcularAvanceTotal(actividadesLocales).toFixed(1)}%
                  </Text>
                </Text>
              </VStack>
              <Button
                leftIcon={<Plus size={16} />}
                onClick={agregarActividad}
                colorScheme="blue"
                size="sm"
                isDisabled={calcularPresupuestoDisponible() <= 0}
              >
                Agregar Actividad
              </Button>
            </HStack>
          </CardBody>
        </Card>

        <TableContainer
          maxH="calc(100vh - 400px)"
          overflowY="auto"
          sx={{
            "&::-webkit-scrollbar": {
              width: "8px",
              borderRadius: "8px",
              backgroundColor: "rgba(0, 0, 0, 0.05)",
            },
            "&::-webkit-scrollbar-thumb": {
              backgroundColor: "rgba(0, 0, 0, 0.1)",
              borderRadius: "8px",
            },
          }}
        >
          <Table variant="simple" size="sm">
            <Thead position="sticky" top={0} bg="white" zIndex={1}>
              <Tr>
                <Th width="40px"></Th>
                <Th>Nombre</Th>
                <Th width="150px">Presupuesto</Th>
                <Th width="100px">% Total</Th>
                <Th width="120px">Avance</Th>
                <Th>Beneficiarios</Th>
                <Th width="100px">Acciones</Th>
              </Tr>
            </Thead>
            <Tbody>
              {actividadesLocales.map((actividad, index) => (
                <React.Fragment key={index}>
                  <Tr>
                    <Td p={2}>
                      <IconButton
                        icon={expandedActividad === index ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        variant="ghost"
                        size="sm"
                        onClick={() => setExpandedActividad(expandedActividad === index ? null : index)}
                        aria-label="Expandir actividad"
                      />
                    </Td>
                    <Td>
                      <Input
                        value={actividad.nombre}
                        onChange={(e) => actualizarActividad(index, "nombre", e.target.value)}
                        size="sm"
                        variant="filled"
                      />
                    </Td>
                    <Td>
                      <NumberInput
                        value={actividad.presupuestoAsignado}
                        onChange={(value) => actualizarActividad(index, "presupuestoAsignado", Number(value))}
                        size="sm"
                        max={calcularPresupuestoDisponible() + Number(actividad.presupuestoAsignado)}
                        min={0}
                      >
                        <NumberInputField />
                      </NumberInput>
                    </Td>
                    <Td isNumeric>
                      <Text fontSize="sm" color="gray.600">
                        {calcularPorcentajePresupuesto(actividad.presupuestoAsignado).toFixed(1)}%
                      </Text>
                    </Td>
                    <Td>
                      <VStack spacing={1} align="stretch">
                        <Progress
                          value={actividad.avance}
                          size="sm"
                          colorScheme={actividad.avance < 30 ? "red" : actividad.avance < 70 ? "yellow" : "green"}
                          borderRadius="full"
                          bg="gray.100"
                        />
                        <Text fontSize="xs" textAlign="right" color="gray.600">
                          {actividad.avance}%
                        </Text>
                      </VStack>
                    </Td>
                    <Td>
                      <QuickCreateSelect
                        options={beneficiariosDisponibles}
                        value={actividad.beneficiariosAsociados?.map((b) => b.beneficiario)}
                        onChange={(value) => actualizarBeneficiarios(index, value)}
                        placeholder="Seleccionar beneficiarios"
                        type="beneficiario"
                        isMulti={true}
                        size="sm"
                      />
                    </Td>
                    <Td>
                      <IconButton
                        icon={<Trash2 size={16} />}
                        onClick={() => removerActividad(index)}
                        colorScheme="red"
                        variant="ghost"
                        size="sm"
                        aria-label="Eliminar actividad"
                      />
                    </Td>
                  </Tr>
                  <Tr>
                    <Td colSpan={7} p={0}>
                      <Collapse in={expandedActividad === index}>
                        <Box p={4} bg="gray.50">
                          <ActividadAvanceForm
                            actividad={actividad}
                            onAvanceChange={(avance) => handleAvanceChange(index, avance)}
                            onObservacionesChange={(campo, valor) => handleObservacionesChange(index, campo, valor)}
                            fechasProyecto={fechasProyecto}
                          />
                        </Box>
                      </Collapse>
                    </Td>
                  </Tr>
                </React.Fragment>
              ))}
            </Tbody>
          </Table>
        </TableContainer>
      </VStack>
    </Box>
  );
};

export default ActividadesForm;