import React, { useState, useEffect } from "react";
import {
  FormControl,
  FormLabel,
  Select,
  Input,
  Grid,
  GridItem,
  Flex,
  IconButton,
  NumberInput,
  NumberInputField,
  FormErrorMessage,
} from "@chakra-ui/react";
import { Trash2 } from "lucide-react";
import GT from "territory-gt";

const UbicacionForm = ({ lugar, index, onUpdate, onRemove, error }) => {
  // Inicializar los departamentos
  const departamentos = GT.departamentos();
  const [municipios, setMunicipios] = useState([]);

  // Efecto para manejar los municipios cuando cambia el departamento
  useEffect(() => {
    if (lugar.departamento) {
      const munis = GT.municipios(lugar.departamento);
      setMunicipios(munis || []);
    } else {
      setMunicipios([]);
    }
  }, [lugar.departamento]);

  const handleDepartamentoChange = (e) => {
    const nuevoDepartamento = e.target.value;
    // Limpiamos el municipio cuando cambia el departamento
    const nuevoLugar = {
      ...lugar,
      departamento: nuevoDepartamento,
      municipio: "",
      localidad: "",
    };
    onUpdate(index, nuevoLugar);
  };

  const handleMunicipioChange = (e) => {
    const nuevoMunicipio = e.target.value;
    const nuevoLugar = {
      ...lugar,
      municipio: nuevoMunicipio,
      localidad: "",
    };
    onUpdate(index, nuevoLugar);
  };

  const handleLocalidadChange = (e) => {
    const nuevaLocalidad = e.target.value;
    const nuevoLugar = {
      ...lugar,
      localidad: nuevaLocalidad,
    };
    onUpdate(index, nuevoLugar);
  };

  const handlePrioridadChange = (value) => {
    const nuevoLugar = {
      ...lugar,
      prioridad: Number(value),
    };
    onUpdate(index, nuevoLugar);
  };

  return (
    <Grid templateColumns={{ base: "1fr", md: "repeat(4, 1fr)" }} gap={4}>
      <GridItem>
        <FormControl isRequired isInvalid={error?.departamento}>
          <FormLabel>Departamento</FormLabel>
          <Select
            placeholder="Seleccione departamento"
            value={lugar.departamento || ""}
            onChange={handleDepartamentoChange}
          >
            {departamentos.map((dep) => (
              <option key={dep} value={dep}>
                {dep}
              </option>
            ))}
          </Select>
          {error?.departamento && (
            <FormErrorMessage>{error.departamento}</FormErrorMessage>
          )}
        </FormControl>
      </GridItem>

      <GridItem>
        <FormControl isRequired isInvalid={error?.municipio}>
          <FormLabel>Municipio</FormLabel>
          <Select
            placeholder="Seleccione municipio"
            value={lugar.municipio || ""}
            onChange={handleMunicipioChange}
            isDisabled={!lugar.departamento}
          >
            {municipios.map((muni) => (
              <option key={muni} value={muni}>
                {muni}
              </option>
            ))}
          </Select>
          {error?.municipio && (
            <FormErrorMessage>{error.municipio}</FormErrorMessage>
          )}
        </FormControl>
      </GridItem>

      <GridItem>
        <FormControl isRequired isInvalid={error?.localidad}>
          <FormLabel>Localidad</FormLabel>
          <Input
            placeholder="Ingrese el nombre de la localidad"
            value={lugar.localidad || ""}
            onChange={handleLocalidadChange}
          />
          {error?.localidad && (
            <FormErrorMessage>{error.localidad}</FormErrorMessage>
          )}
        </FormControl>
      </GridItem>

      <GridItem>
        <Flex gap={2} alignItems="flex-end" h="full">
          <FormControl flex={1}>
            <FormLabel>Prioridad</FormLabel>
            <NumberInput
              value={lugar.prioridad || 1}
              onChange={handlePrioridadChange}
              min={1}
              max={5}
            >
              <NumberInputField />
            </NumberInput>
          </FormControl>
          {index > 0 && (
            <IconButton
              icon={<Trash2 />}
              onClick={() => onRemove(index)}
              colorScheme="red"
              variant="ghost"
              size="sm"
              aria-label="Eliminar ubicación"
            />
          )}
        </Flex>
      </GridItem>
    </Grid>
  );
};

export default UbicacionForm;
