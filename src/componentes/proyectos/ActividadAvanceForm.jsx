import React from "react";
import {
  FormControl,
  FormLabel,
  NumberInput,
  NumberInputField,
  Progress,
  VStack,
  HStack,
  Text,
  Box,
  Textarea,
  Input,
  FormErrorMessage,
  Alert,
  AlertIcon,
  Card,
  CardBody,
  Grid,
  GridItem,
  Divider,
} from "@chakra-ui/react";

const ActividadAvanceForm = ({
  actividad = {},
  onAvanceChange = () => {},
  onObservacionesChange = () => {},
  fechasProyecto = {},
}) => {
  if (!fechasProyecto.fechaInicio || !fechasProyecto.fechaFinal) {
    return (
      <Alert status="error" borderRadius="md">
        <AlertIcon />
        <Text>Fechas del proyecto no disponibles</Text>
      </Alert>
    );
  }

  const {
    avance = 0,
    fechaInicio = "",
    fechaFin = "",
    observaciones = "",
  } = actividad;

  const validateFecha = (fecha, tipo) => {
    if (!fechasProyecto?.fechaInicio || !fechasProyecto?.fechaFinal) {
      return "Para agregar actividades, primero debe establecer las fechas del proyecto";
    }

    const fechaActividad = new Date(fecha);
    const fechaInicioProyecto = new Date(fechasProyecto.fechaInicio);
    const fechaFinalProyecto = new Date(fechasProyecto.fechaFinal);

    if (tipo === "inicio") {
      if (fechaActividad < fechaInicioProyecto) {
        return "La fecha de inicio no puede ser anterior a la fecha de inicio del proyecto";
      }
      if (fechaActividad > fechaFinalProyecto) {
        return "La fecha de inicio no puede ser posterior a la fecha final del proyecto";
      }
      if (fechaFin && fechaActividad > new Date(fechaFin)) {
        return "La fecha de inicio debe ser anterior a la fecha de finalización";
      }
    }

    if (tipo === "fin") {
      if (fechaActividad > fechaFinalProyecto) {
        return "La fecha de finalización no puede ser posterior a la fecha final del proyecto";
      }
      if (fechaInicio && fechaActividad < new Date(fechaInicio)) {
        return "La fecha de finalización debe ser posterior a la fecha de inicio";
      }
    }

    return null;
  };

  const handleFechaChange = (tipo, value) => {
    const error = validateFecha(value, tipo);
    if (!error) {
      onObservacionesChange(
        tipo === "inicio" ? "fechaInicio" : "fechaFin",
        value
      );
    }
  };

  return (
    <Card variant="outline" bg="white">
      <CardBody>
        <VStack spacing={6} align="stretch">
          {/* Sección de Avance */}
          <Box>
            <FormControl>
              <FormLabel fontWeight="medium" fontSize="sm" mb={3}>
                Nivel de Avance
              </FormLabel>
              <VStack spacing={2} align="stretch">
                <HStack spacing={4} align="center">
                  <NumberInput
                    value={avance}
                    onChange={(value) => onAvanceChange(Number(value))}
                    min={0}
                    max={100}
                    step={1}
                    size="sm"
                    w="100px"
                  >
                    <NumberInputField />
                  </NumberInput>
                  <Text fontSize="sm" color="gray.600" w="60px">
                    {avance}%
                  </Text>
                </HStack>
                <Progress
                  value={avance}
                  size="sm"
                  colorScheme={
                    avance < 30 ? "red" : avance < 70 ? "yellow" : "green"
                  }
                  borderRadius="full"
                  hasStripe
                />
              </VStack>
            </FormControl>
          </Box>

          <Divider />

          {/* Sección de Fechas */}
          <Grid templateColumns="repeat(2, 1fr)" gap={6}>
            <GridItem>
              <FormControl isRequired isInvalid={!fechaInicio}>
                <FormLabel fontSize="sm">Fecha de Inicio</FormLabel>
                <Input
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => handleFechaChange("inicio", e.target.value)}
                  min={fechasProyecto.fechaInicio}
                  max={fechasProyecto.fechaFinal}
                  size="sm"
                />
                {!fechaInicio && (
                  <FormErrorMessage>
                    La fecha de inicio es requerida
                  </FormErrorMessage>
                )}
              </FormControl>
            </GridItem>

            <GridItem>
              <FormControl isRequired isInvalid={!fechaFin}>
                <FormLabel fontSize="sm">Fecha de Fin</FormLabel>
                <Input
                  type="date"
                  value={fechaFin}
                  onChange={(e) => handleFechaChange("fin", e.target.value)}
                  min={fechaInicio || fechasProyecto.fechaInicio}
                  max={fechasProyecto.fechaFinal}
                  size="sm"
                />
                {!fechaFin && (
                  <FormErrorMessage>
                    La fecha de finalización es requerida
                  </FormErrorMessage>
                )}
              </FormControl>
            </GridItem>
          </Grid>

          <Divider />

          {/* Sección de Observaciones */}
          <FormControl>
            <FormLabel fontSize="sm">Observaciones</FormLabel>
            <Textarea
              value={observaciones}
              onChange={(e) =>
                onObservacionesChange("observaciones", e.target.value)
              }
              placeholder="Ingrese observaciones sobre el avance de la actividad"
              size="sm"
              rows={3}
              resize="vertical"
              bg="white"
            />
          </FormControl>
        </VStack>
      </CardBody>
    </Card>
  );
};

export default ActividadAvanceForm;