import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Select,
  NumberInput,
  NumberInputField,
  Stack,
  Text,
  Flex,
  Grid,
  GridItem,
  IconButton,
  Checkbox,
  Alert,
  AlertIcon,
  AlertTitle,
  useToast,
  Card,
  CardBody,
  Progress,
  VStack,
  HStack,
  Image,
  AspectRatio,
  Divider,
} from "@chakra-ui/react";
import {
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  Save,
  Plus,
  Trash2,
  Upload,
  Files,
  X,
} from "lucide-react";
import { motion } from "framer-motion";
import QuickCreateSelect from "./QuickCreateSelect";

const MotionBox = motion(Box);

const ProyectoForm = ({ onCancel, onSuccess }) => {
  // 1. Estados
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    nombre: "",
    encargado: "",
    presupuesto: "",
    fechaInicio: "",
    fechaFinal: "",
    objetivosGlobales: [],
    lineasEstrategicas: [],
    donantes: [{ donante: "", porcentaje: 0 }],
    lugaresAPriorizar: [
      { departamento: "", municipio: "", localidad: "", prioridad: 1 },
    ],
    implicacionMunicipalidades: "Media",
    seguimiento: { frecuencia: "mensual", requiereVisita: false },
    nivelAvance: 0,
    personasAlcanzadas: 0,
    beneficiarios: [],
    evidencias: [],
    observaciones: "",
  });

  const [datos, setDatos] = useState({
    encargados: [],
    objetivos: [],
    lineas: [],
    donantes: [],
    beneficiarios: [],
  });

  const [errores, setErrores] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [validationStatus, setValidationStatus] = useState({});
  const [previewImages, setPreviewImages] = useState([]);
  const toast = useToast();

  const steps = [
    "Información Básica",
    "Objetivos y Estrategias",
    "Donantes",
    "Ubicaciones",
    "Beneficiarios y Avance",
    "Evidencias",
    "Configuración Final",
  ];
  // 2. Efectos
  useEffect(() => {
    cargarDatosIniciales();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 3. Funciones de carga y datos
  const cargarDatosIniciales = async () => {
    try {
      const token = localStorage.getItem("token");
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };

      const [encargados, objetivos, lineas, donantes, beneficiarios] =
        await Promise.all([
          fetch(`${process.env.REACT_APP_backend}/usuario?rol=Encargado`, {
            headers,
          }).then((r) => r.json()),
          fetch(`${process.env.REACT_APP_backend}/objetivo-global`, {
            headers,
          }).then((r) => r.json()),
          fetch(`${process.env.REACT_APP_backend}/linea-estrategica`, {
            headers,
          }).then((r) => r.json()),
          fetch(`${process.env.REACT_APP_backend}/donante`, { headers }).then(
            (r) => r.json()
          ),
          fetch(`${process.env.REACT_APP_backend}/beneficiario`, {
            headers,
          }).then((r) => r.json()),
        ]);

      setDatos({ encargados, objetivos, lineas, donantes, beneficiarios });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos iniciales",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // 4. Manejadores de eventos base
  const handleInputChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    validateField(name, value);
  };

  // Manejador de archivos
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const maxSize = 5 * 1024 * 1024; // 5MB
    const validTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "application/pdf",
    ];

    const validFiles = files.filter((file) => {
      // Validar tamaño
      if (file.size > maxSize) {
        toast({
          title: "Error",
          description: `${file.name} excede el tamaño máximo de 5MB`,
          status: "error",
          duration: 3000,
        });
        return false;
      }

      // Validar tipo
      if (!validTypes.includes(file.type)) {
        toast({
          title: "Error",
          description: `${file.name} no es un tipo de archivo válido`,
          status: "error",
          duration: 3000,
        });
        return false;
      }

      return true;
    });

    // Limpiar input
    e.target.value = "";

    // Procesar archivos válidos
    validFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImages((prev) => [
          ...prev,
          {
            url: reader.result,
            type: file.type.startsWith("image/") ? "image" : "pdf",
            name: file.name,
            file, // Guardar referencia al archivo original
          },
        ]);
      };
      reader.readAsDataURL(file);
    });

    // Actualizar formData
    setFormData((prev) => ({
      ...prev,
      evidencias: [...(prev.evidencias || []), ...validFiles],
    }));
  };

  // Manejador de eliminación de archivos
  const handleRemoveFile = (index) => {
    setPreviewImages((prev) => prev.filter((_, i) => i !== index));
    setFormData((prev) => ({
      ...prev,
      evidencias: prev.evidencias.filter((_, i) => i !== index),
    }));
  };

  // 5. Manejadores específicos para donantes y lugares
  const handleDonanteChange = (index, field, value) => {
    const newDonantes = [...formData.donantes];
    newDonantes[index][field] = value;
    handleInputChange("donantes", newDonantes);
  };

  const handleLugarChange = (index, field, value) => {
    const newLugares = [...formData.lugaresAPriorizar];
    newLugares[index] = {
      ...newLugares[index],
      [field]: field === "prioridad" ? value || 1 : value,
    };
    handleInputChange("lugaresAPriorizar", newLugares);
  };

  const agregarDonante = () => {
    setFormData((prev) => ({
      ...prev,
      donantes: [...prev.donantes, { donante: "", porcentaje: 0 }],
    }));
  };

  const removerDonante = (index) => {
    const newDonantes = formData.donantes.filter((_, i) => i !== index);
    handleInputChange("donantes", newDonantes);
  };

  const agregarLugar = () => {
    const ultimaPrioridad =
      formData.lugaresAPriorizar.length > 0
        ? Math.max(...formData.lugaresAPriorizar.map((l) => l.prioridad || 1))
        : 0;

    setFormData((prev) => ({
      ...prev,
      lugaresAPriorizar: [
        ...prev.lugaresAPriorizar,
        {
          departamento: "",
          municipio: "",
          localidad: "",
          prioridad: Math.min(ultimaPrioridad + 1, 5),
        },
      ],
    }));
  };

  const removerLugar = (index) => {
    const newLugares = formData.lugaresAPriorizar.filter((_, i) => i !== index);
    handleInputChange("lugaresAPriorizar", newLugares);
  };

  // 6. Validación
  const validateField = (name, value) => {
    let error = null;

    switch (name) {
      case "nombre":
        if (!value?.trim()) error = "El nombre es requerido";
        else if (value.length < 3)
          error = "El nombre debe tener al menos 3 caracteres";
        break;
      case "encargado":
        if (!value) error = "Debe seleccionar un encargado";
        break;
      case "presupuesto":
        if (!value) error = "El presupuesto es requerido";
        else if (isNaN(value) || value <= 0)
          error = "Ingrese un valor válido mayor a 0";
        break;
      case "fechaInicio":
        if (!value) error = "La fecha de inicio es requerida";
        break;
      case "fechaFinal":
        if (!value) error = "La fecha final es requerida";
        if (
          value &&
          formData.fechaInicio &&
          new Date(value) <= new Date(formData.fechaInicio)
        ) {
          error = "La fecha final debe ser posterior a la fecha de inicio";
        }
        break;
      case "objetivosGlobales":
        if (!value || value.length === 0)
          error = "Debe seleccionar al menos un objetivo";
        break;
      case "lineasEstrategicas":
        if (!value || value.length === 0)
          error = "Debe seleccionar al menos una línea estratégica";
        break;
      case "donantes":
        if (!value || value.length === 0)
          error = "Debe agregar al menos un donante";
        const sumaPorcentajes = value.reduce(
          (sum, d) => sum + Number(d.porcentaje),
          0
        );
        if (sumaPorcentajes !== 100)
          error = `La suma de porcentajes debe ser 100%. Actual: ${sumaPorcentajes}%`;
        break;
      case "nivelAvance":
        if (value < 0 || value > 100)
          error = "El nivel de avance debe estar entre 0 y 100";
        break;
      case "personasAlcanzadas":
        if (value < 0)
          error = "El número de personas alcanzadas no puede ser negativo";
        break;
      default:
        break;
    }

    setValidationStatus((prev) => ({
      ...prev,
      [name]: { isValid: !error, message: error },
    }));

    return error;
  };
  // 7. Funciones de renderizado
  const renderStepIndicator = () => (
    <Flex justify="space-between" mb={8}>
      {steps.map((step, index) => (
        <Flex key={index} direction="column" align="center" position="relative">
          <Flex
            w="8"
            h="8"
            rounded="full"
            align="center"
            justify="center"
            bg={
              index + 1 === currentStep
                ? "blue.100"
                : index + 1 < currentStep
                ? "green.100"
                : "gray.100"
            }
            border={index + 1 === currentStep ? "2px solid" : "none"}
            borderColor="blue.600"
          >
            {index + 1 < currentStep ? (
              <CheckCircle size={20} color="green" />
            ) : (
              <Text>{index + 1}</Text>
            )}
          </Flex>
          <Text
            fontSize="xs"
            mt={2}
            w="24"
            textAlign="center"
            color={
              index + 1 === currentStep
                ? "blue.600"
                : index + 1 < currentStep
                ? "green.500"
                : "gray.400"
            }
          >
            {step}
          </Text>
          {index < steps.length - 1 && (
            <Box
              position="absolute"
              top="4"
              left="8"
              w="calc(200% - 2rem)"
              h="0.5"
              bg={index + 1 < currentStep ? "green.500" : "gray.200"}
            />
          )}
        </Flex>
      ))}
    </Flex>
  );

  const renderDonantes = () => (
    <MotionBox initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
      <Stack spacing={4}>
        {formData.donantes.map((donante, index) => (
          <Flex key={index} gap={4} align="flex-end">
            <Box flex={1}>
              <QuickCreateSelect
                options={datos.donantes}
                value={donante.donante}
                onChange={(value) =>
                  handleDonanteChange(index, "donante", value)
                }
                placeholder="Seleccione un donante"
                type="donante"
                error={validationStatus[`donante_${index}`]?.message}
                onNewOption={(newDonante) => {
                  setDatos((prev) => ({
                    ...prev,
                    donantes: [...prev.donantes, newDonante],
                  }));
                }}
              />
            </Box>
            <FormControl w="32">
              <FormLabel>Porcentaje</FormLabel>
              <NumberInput
                value={donante.porcentaje}
                onChange={(value) =>
                  handleDonanteChange(index, "porcentaje", Number(value))
                }
                min={0}
                max={100}
              >
                <NumberInputField />
              </NumberInput>
            </FormControl>
            {index > 0 && (
              <IconButton
                icon={<Trash2 />}
                onClick={() => removerDonante(index)}
                colorScheme="red"
                variant="ghost"
                size="sm"
                aria-label="Eliminar donante"
              />
            )}
          </Flex>
        ))}

        <Button
          leftIcon={<Plus />}
          onClick={agregarDonante}
          variant="ghost"
          colorScheme="blue"
          size="sm"
          w="fit-content"
        >
          Agregar Donante
        </Button>

        {validationStatus.donantes?.message && (
          <Alert status="error">
            <AlertIcon />
            <Text fontSize="sm">{validationStatus.donantes.message}</Text>
          </Alert>
        )}
      </Stack>
    </MotionBox>
  );

  const renderUbicaciones = () => (
    <MotionBox initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
      <Stack spacing={6}>
        {formData.lugaresAPriorizar.map((lugar, index) => (
          <Grid
            key={index}
            templateColumns={{ base: "1fr", md: "repeat(4, 1fr)" }}
            gap={4}
          >
            <GridItem>
              <FormControl>
                <FormLabel>Departamento</FormLabel>
                <Input
                  value={lugar.departamento}
                  onChange={(e) =>
                    handleLugarChange(index, "departamento", e.target.value)
                  }
                  placeholder="Departamento"
                />
              </FormControl>
            </GridItem>

            <GridItem>
              <FormControl>
                <FormLabel>Municipio</FormLabel>
                <Input
                  value={lugar.municipio}
                  onChange={(e) =>
                    handleLugarChange(index, "municipio", e.target.value)
                  }
                  placeholder="Municipio"
                />
              </FormControl>
            </GridItem>

            <GridItem>
              <FormControl>
                <FormLabel>Localidad</FormLabel>
                <Input
                  value={lugar.localidad}
                  onChange={(e) =>
                    handleLugarChange(index, "localidad", e.target.value)
                  }
                  placeholder="Localidad"
                />
              </FormControl>
            </GridItem>

            <GridItem>
              <Flex gap={2} alignItems="flex-end" h="full">
                <FormControl flex={1}>
                  <FormLabel>Prioridad</FormLabel>
                  <NumberInput
                    value={lugar.prioridad}
                    onChange={(valueString, valueNumber) =>
                      handleLugarChange(index, "prioridad", valueNumber)
                    }
                    min={1}
                    max={5}
                    defaultValue={1}
                  >
                    <NumberInputField />
                  </NumberInput>
                </FormControl>
                {index > 0 && (
                  <IconButton
                    icon={<Trash2 />}
                    onClick={() => removerLugar(index)}
                    colorScheme="red"
                    variant="ghost"
                    size="sm"
                    aria-label="Eliminar ubicación"
                  />
                )}
              </Flex>
            </GridItem>
          </Grid>
        ))}

        <Button
          leftIcon={<Plus />}
          onClick={agregarLugar}
          variant="ghost"
          colorScheme="blue"
          size="sm"
          w="fit-content"
        >
          Agregar Ubicación
        </Button>
      </Stack>
    </MotionBox>
  );

  // Agregar estas funciones después de renderUbicaciones y antes de renderCurrentStep

  const renderInformacionBasica = () => (
    <MotionBox initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
      <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={4}>
        <GridItem colSpan={{ base: 1, md: 2 }}>
          <FormControl
            isRequired
            isInvalid={validationStatus.nombre?.isValid === false}
          >
            <FormLabel>Nombre del Proyecto</FormLabel>
            <Input
              value={formData.nombre}
              onChange={(e) => handleInputChange("nombre", e.target.value)}
              placeholder="Ingrese el nombre del proyecto"
            />
            {validationStatus.nombre?.message && (
              <Text color="red.500" fontSize="sm" mt={1}>
                {validationStatus.nombre.message}
              </Text>
            )}
          </FormControl>
        </GridItem>

        <GridItem>
          <FormControl
            isRequired
            isInvalid={validationStatus.encargado?.isValid === false}
          >
            <FormLabel>Encargado</FormLabel>
            <Select
              value={formData.encargado}
              onChange={(e) => handleInputChange("encargado", e.target.value)}
              placeholder="Seleccione un encargado"
            >
              {datos.encargados.map((encargado) => (
                <option key={encargado._id} value={encargado._id}>
                  {encargado.nombre}
                </option>
              ))}
            </Select>
          </FormControl>
        </GridItem>

        <GridItem>
          <FormControl
            isRequired
            isInvalid={validationStatus.presupuesto?.isValid === false}
          >
            <FormLabel>Presupuesto</FormLabel>
            <NumberInput
              value={formData.presupuesto}
              onChange={(value) => handleInputChange("presupuesto", value)}
              min={0}
            >
              <NumberInputField placeholder="0.00" />
            </NumberInput>
          </FormControl>
        </GridItem>

        <GridItem>
          <FormControl
            isRequired
            isInvalid={validationStatus.fechaInicio?.isValid === false}
          >
            <FormLabel>Fecha de Inicio</FormLabel>
            <Input
              type="date"
              value={formData.fechaInicio}
              onChange={(e) => handleInputChange("fechaInicio", e.target.value)}
            />
          </FormControl>
        </GridItem>

        <GridItem>
          <FormControl
            isRequired
            isInvalid={validationStatus.fechaFinal?.isValid === false}
          >
            <FormLabel>Fecha Final</FormLabel>
            <Input
              type="date"
              value={formData.fechaFinal}
              onChange={(e) => handleInputChange("fechaFinal", e.target.value)}
            />
          </FormControl>
        </GridItem>
      </Grid>
    </MotionBox>
  );

  const renderObjetivosEstrategias = () => (
    <MotionBox initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
      <Stack spacing={6}>
        <FormControl
          isRequired
          isInvalid={validationStatus.objetivosGlobales?.isValid === false}
        >
          <FormLabel>Objetivos Globales</FormLabel>
          <QuickCreateSelect
            options={datos.objetivos}
            value={formData.objetivosGlobales}
            onChange={(value) => handleInputChange("objetivosGlobales", value)}
            placeholder="Seleccione objetivos globales"
            type="objetivo"
            isMulti
            error={validationStatus.objetivosGlobales?.message}
            onNewOption={(newObj) => {
              setDatos((prev) => ({
                ...prev,
                objetivos: [...prev.objetivos, newObj],
              }));
            }}
          />
        </FormControl>

        <FormControl
          isRequired
          isInvalid={validationStatus.lineasEstrategicas?.isValid === false}
        >
          <FormLabel>Líneas Estratégicas</FormLabel>
          <QuickCreateSelect
            options={datos.lineas}
            value={formData.lineasEstrategicas}
            onChange={(value) => handleInputChange("lineasEstrategicas", value)}
            placeholder="Seleccione líneas estratégicas"
            type="linea"
            isMulti
            error={validationStatus.lineasEstrategicas?.message}
            onNewOption={(newLinea) => {
              setDatos((prev) => ({
                ...prev,
                lineas: [...prev.lineas, newLinea],
              }));
            }}
          />
        </FormControl>
      </Stack>
    </MotionBox>
  );

  const renderBeneficiariosAvance = () => (
    <MotionBox initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
      <Stack spacing={6}>
        <FormControl
          isInvalid={validationStatus.nivelAvance?.isValid === false}
        >
          <FormLabel>Nivel de Avance</FormLabel>
          <HStack spacing={4} align="center">
            <NumberInput
              value={formData.nivelAvance}
              onChange={(value) =>
                handleInputChange("nivelAvance", Number(value))
              }
              min={0}
              max={100}
              w="100px"
            >
              <NumberInputField />
            </NumberInput>
            <Progress
              value={formData.nivelAvance}
              w="full"
              colorScheme="green"
              hasStripe
            />
            <Text>{formData.nivelAvance}%</Text>
          </HStack>
        </FormControl>

        <FormControl
          isInvalid={validationStatus.personasAlcanzadas?.isValid === false}
        >
          <FormLabel>Personas Alcanzadas</FormLabel>
          <NumberInput
            value={formData.personasAlcanzadas}
            onChange={(value) =>
              handleInputChange("personasAlcanzadas", Number(value))
            }
            min={0}
          >
            <NumberInputField />
          </NumberInput>
        </FormControl>

        <FormControl
          isInvalid={validationStatus.beneficiarios?.isValid === false}
        >
          <FormLabel>Seleccionar Beneficiarios</FormLabel>
          <QuickCreateSelect
            options={datos.beneficiarios}
            value={formData.beneficiarios}
            onChange={(value) => handleInputChange("beneficiarios", value)}
            placeholder="Seleccione beneficiarios"
            type="beneficiario"
            isMulti
            error={validationStatus.beneficiarios?.message}
          />
        </FormControl>

        <FormControl>
          <FormLabel>Observaciones</FormLabel>
          <Input
            as="textarea"
            value={formData.observaciones}
            onChange={(e) => handleInputChange("observaciones", e.target.value)}
            placeholder="Ingrese observaciones relevantes"
            h="100px"
            resize="vertical"
          />
        </FormControl>
      </Stack>
    </MotionBox>
  );

  const renderEvidencias = () => (
    <MotionBox initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
      <Stack spacing={6}>
        <FormControl>
          <FormLabel>Evidencias del Proyecto</FormLabel>
          <VStack spacing={4} align="stretch">
            <HStack>
              <Input
                type="file"
                accept="image/*,.pdf"
                multiple
                onChange={handleFileChange}
                display="none"
                id="file-upload"
              />
              <Button
                as="label"
                htmlFor="file-upload"
                leftIcon={<Upload />}
                colorScheme="blue"
                cursor="pointer"
              >
                Subir Archivos
              </Button>
              <Text fontSize="sm" color="gray.500">
                Formatos permitidos: Imágenes y PDF (Máx. 5MB por archivo)
              </Text>
            </HStack>

            <Grid
              templateColumns="repeat(auto-fill, minmax(200px, 1fr))"
              gap={4}
            >
              {previewImages.map((preview, index) => (
                <Card key={index}>
                  <CardBody p={2}>
                    <AspectRatio ratio={4 / 3}>
                      <Box position="relative">
                        {preview.type === "image" ? (
                          <Image
                            src={preview.url}
                            alt={`Evidencia ${index + 1}`}
                            objectFit="cover"
                            w="full"
                            h="full"
                            borderRadius="md"
                          />
                        ) : (
                          <Flex
                            bg="gray.100"
                            align="center"
                            justify="center"
                            w="full"
                            h="full"
                            borderRadius="md"
                          >
                            <Files size={40} />
                            <Text ml={2}>PDF</Text>
                          </Flex>
                        )}
                        <IconButton
                          icon={<Trash2 />}
                          size="sm"
                          colorScheme="red"
                          position="absolute"
                          top={2}
                          right={2}
                          onClick={() => handleRemoveFile(index)}
                          aria-label="Eliminar archivo"
                        />
                      </Box>
                    </AspectRatio>
                  </CardBody>
                </Card>
              ))}
            </Grid>
          </VStack>
        </FormControl>
      </Stack>
    </MotionBox>
  );

  const renderConfiguracionFinal = () => (
    <MotionBox initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
      <Stack spacing={6}>
        <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={6}>
          <GridItem>
            <FormControl>
              <FormLabel>Implicación de Municipalidades</FormLabel>
              <Select
                value={formData.implicacionMunicipalidades}
                onChange={(e) =>
                  handleInputChange(
                    "implicacionMunicipalidades",
                    e.target.value
                  )
                }
              >
                <option value="Alta">Alta</option>
                <option value="Media">Media</option>
                <option value="Baja">Baja</option>
                <option value="Nula">Nula</option>
              </Select>
            </FormControl>
          </GridItem>

          <GridItem>
            <FormControl>
              <FormLabel>Frecuencia de Seguimiento</FormLabel>
              <Select
                value={formData.seguimiento.frecuencia}
                onChange={(e) =>
                  handleInputChange("seguimiento", {
                    ...formData.seguimiento,
                    frecuencia: e.target.value,
                  })
                }
              >
                <option value="semanal">Semanal</option>
                <option value="mensual">Mensual</option>
                <option value="trimestral">Trimestral</option>
              </Select>
            </FormControl>
          </GridItem>
        </Grid>

        <FormControl>
          <Checkbox
            isChecked={formData.seguimiento.requiereVisita}
            onChange={(e) =>
              handleInputChange("seguimiento", {
                ...formData.seguimiento,
                requiereVisita: e.target.checked,
              })
            }
          >
            Requiere Visita Presencial
          </Checkbox>
        </FormControl>

        <Divider my={4} />

        <Card>
          <CardBody>
            <VStack align="stretch" spacing={4}>
              <Text fontWeight="medium" fontSize="lg">
                Resumen del Proyecto
              </Text>

              <Grid
                templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }}
                gap={4}
              >
                <Text>
                  <strong>Nombre:</strong> {formData.nombre}
                </Text>
                <Text>
                  <strong>Presupuesto:</strong> Q
                  {Number(formData.presupuesto).toLocaleString()}
                </Text>
                <Text>
                  <strong>Nivel de Avance:</strong> {formData.nivelAvance}%
                </Text>
                <Text>
                  <strong>Personas Alcanzadas:</strong>{" "}
                  {formData.personasAlcanzadas}
                </Text>
                <Text>
                  <strong>Donantes:</strong>{" "}
                  {
                    formData.donantes.filter(
                      (d) => d.donante && d.porcentaje > 0
                    ).length
                  }
                </Text>
                <Text>
                  <strong>Beneficiarios:</strong>{" "}
                  {formData.beneficiarios.length}
                </Text>
                <Text>
                  <strong>Evidencias:</strong> {formData.evidencias.length}{" "}
                  archivos
                </Text>
                <Text>
                  <strong>Ubicaciones:</strong>{" "}
                  {
                    formData.lugaresAPriorizar.filter(
                      (l) => l.departamento || l.municipio || l.localidad
                    ).length
                  }
                </Text>
              </Grid>

              {Object.keys(errores).length > 0 && (
                <Alert status="error" mt={4}>
                  <AlertIcon />
                  <Box>
                    <AlertTitle>
                      Por favor corrija los siguientes errores:
                    </AlertTitle>
                    <VStack align="start" mt={2}>
                      {Object.values(errores).map((error, index) => (
                        <Text key={index} fontSize="sm">
                          {error}
                        </Text>
                      ))}
                    </VStack>
                  </Box>
                </Alert>
              )}
            </VStack>
          </CardBody>
        </Card>
      </Stack>
    </MotionBox>
  );

  // 8. Navegación y validación de pasos
  const validateStep = () => {
    let stepErrors = {};

    switch (currentStep) {
      case 1:
        if (!formData.nombre?.trim())
          stepErrors.nombre = "El nombre es requerido";
        if (!formData.encargado)
          stepErrors.encargado = "Debe seleccionar un encargado";
        if (!formData.presupuesto)
          stepErrors.presupuesto = "El presupuesto es requerido";
        if (!formData.fechaInicio)
          stepErrors.fechaInicio = "La fecha de inicio es requerida";
        if (!formData.fechaFinal)
          stepErrors.fechaFinal = "La fecha final es requerida";
        break;

      case 2:
        if (!formData.objetivosGlobales?.length) {
          stepErrors.objetivosGlobales =
            "Debe seleccionar al menos un objetivo";
        }
        if (!formData.lineasEstrategicas?.length) {
          stepErrors.lineasEstrategicas =
            "Debe seleccionar al menos una línea estratégica";
        }
        break;

      case 3:
        if (!formData.donantes.some((d) => d.donante && d.porcentaje > 0)) {
          stepErrors.donantes = "Debe configurar al menos un donante";
        }
        const sumaPorcentajes = formData.donantes.reduce(
          (sum, d) => sum + Number(d.porcentaje),
          0
        );
        if (sumaPorcentajes !== 100) {
          stepErrors.donantes = `La suma de porcentajes debe ser 100%. Actual: ${sumaPorcentajes}%`;
        }
        break;

      case 4:
        formData.lugaresAPriorizar.forEach((lugar, index) => {
          if (!lugar.departamento || !lugar.municipio || !lugar.localidad) {
            stepErrors[`lugar_${index}`] =
              "Todos los campos de ubicación son requeridos";
          }
        });
        break;

      case 5:
        if (formData.nivelAvance < 0 || formData.nivelAvance > 100) {
          stepErrors.nivelAvance =
            "El nivel de avance debe estar entre 0 y 100";
        }
        if (formData.personasAlcanzadas < 0) {
          stepErrors.personasAlcanzadas =
            "El número de personas alcanzadas no puede ser negativo";
        }
        break;

      default:
        break;
    }

    setErrores(stepErrors);
    return Object.keys(stepErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) {
      setCurrentStep((prev) => Math.min(prev + 1, steps.length));
    }
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };
  // 9. Función de envío final
  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      // Validar el paso actual
      if (!validateStep()) {
        throw new Error("Por favor complete todos los campos requeridos");
      }

      const formDataToSend = new FormData();

      // 1. Campos básicos como strings
      formDataToSend.append("nombre", formData.nombre);
      formDataToSend.append("encargado", formData.encargado);
      formDataToSend.append("presupuesto", formData.presupuesto.toString());
      formDataToSend.append("fechaInicio", formData.fechaInicio);
      formDataToSend.append("fechaFinal", formData.fechaFinal);
      formDataToSend.append(
        "implicacionMunicipalidades",
        formData.implicacionMunicipalidades
      );
      formDataToSend.append("nivelAvance", formData.nivelAvance.toString());
      formDataToSend.append(
        "personasAlcanzadas",
        formData.personasAlcanzadas.toString()
      );
      formDataToSend.append("observaciones", formData.observaciones || "");

      // 2. Arrays simples (IDs)
      formDataToSend.append(
        "objetivosGlobales",
        JSON.stringify(formData.objetivosGlobales.map((id) => id.toString()))
      );
      formDataToSend.append(
        "lineasEstrategicas",
        JSON.stringify(formData.lineasEstrategicas.map((id) => id.toString()))
      );

      // 3. Donantes (Array de objetos)
      const donantesValidos = formData.donantes
        .filter((d) => d.donante && d.porcentaje > 0)
        .map((d) => ({
          donante: d.donante.toString(),
          porcentaje: Number(d.porcentaje),
        }));
      formDataToSend.append("donantes", JSON.stringify(donantesValidos));

      // 4. Beneficiarios (Array de objetos)
      const beneficiariosFormateados = {
        beneficiarios: formData.beneficiarios.map((id) => ({
          beneficiario: id.toString(),
          estado: "Activo",
          fechaIngreso: new Date().toISOString(),
        })),
      };
      formDataToSend.append(
        "beneficiarios",
        JSON.stringify(beneficiariosFormateados.beneficiarios)
      );

      // 5. Lugares
      const lugaresValidos = formData.lugaresAPriorizar
        .filter((l) => l.departamento && l.municipio && l.localidad)
        .map((l) => ({
          departamento: l.departamento.trim(),
          municipio: l.municipio.trim(),
          localidad: l.localidad.trim(),
          prioridad: Number(l.prioridad) || 1,
        }));
      formDataToSend.append(
        "lugaresAPriorizar",
        JSON.stringify(lugaresValidos)
      );

      // 6. Seguimiento
      const seguimientoData = {
        frecuencia: formData.seguimiento.frecuencia || "mensual",
        requiereVisita: Boolean(formData.seguimiento.requiereVisita),
        proximoSeguimiento: new Date(formData.fechaInicio).toISOString(),
      };
      formDataToSend.append("seguimiento", JSON.stringify(seguimientoData));

      // 7. Evidencias
      if (formData.evidencias?.length > 0) {
        formData.evidencias.forEach((file) => {
          formDataToSend.append("evidencias", file);
        });
      }

      // Log para depuración
      for (let [key, value] of formDataToSend.entries()) {
        console.log(`${key}:`, value);
      }

      // 8. Enviar al servidor
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No se encontró el token de autenticación");
      }

      const response = await fetch(
        `${process.env.REACT_APP_backend}/proyecto/crear`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formDataToSend,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error en la respuesta:", errorData);
        throw new Error(
          errorData.error || errorData.message || "Error al crear el proyecto"
        );
      }

      const data = await response.json();

      toast({
        title: "¡Éxito!",
        description: "Proyecto creado correctamente",
        status: "success",
        duration: 5000,
        isClosable: true,
      });

      if (onSuccess) {
        onSuccess(data.proyecto);
      }
    } catch (error) {
      console.error("Error detallado:", error);
      toast({
        title: "Error",
        description: error.message || "Error al crear el proyecto",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 10. Función para renderizar el paso actual
  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return renderInformacionBasica();
      case 2:
        return renderObjetivosEstrategias();
      case 3:
        return renderDonantes();
      case 4:
        return renderUbicaciones();
      case 5:
        return renderBeneficiariosAvance();
      case 6:
        return renderEvidencias();
      case 7:
        return renderConfiguracionFinal();
      default:
        return null;
    }
  };

  // 11. Return del componente
  return (
    <Box maxW="6xl" mx="auto" p={6}>
      <Card>
      <IconButton
            icon={<X size={20} />} // Cambiamos el ícono a X
            aria-label="Cerrar"
            variant="ghost"
            onClick={onCancel}
            position="absolute" // Lo posicionamos de forma absoluta
            right={1} // A 4 unidades del borde derecho
            top={1} // A 4 unidades del borde superior
          />
        <CardBody>

          {renderStepIndicator()}

          <Box mb={8}>{renderCurrentStep()}</Box>

          <Flex justify="space-between" mt={8}>
            <Button
              leftIcon={<ArrowLeft />}
              onClick={handlePrevious}
              isDisabled={currentStep === 1}
              variant="ghost"
            >
              Anterior
            </Button>

            {currentStep < steps.length ? (
              <Button
                rightIcon={<ArrowRight />}
                onClick={handleNext}
                colorScheme="blue"
              >
                Siguiente
              </Button>
            ) : (
              <Button
                rightIcon={<Save />}
                onClick={handleSubmit}
                isLoading={isLoading}
                colorScheme="green"
                loadingText="Guardando..."
              >
                Guardar Proyecto
              </Button>
            )}
          </Flex>
        </CardBody>
      </Card>
    </Box>
  );
};

export default ProyectoForm;
