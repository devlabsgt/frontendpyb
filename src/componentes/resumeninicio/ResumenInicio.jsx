import React, { useEffect, useState } from "react";
import {
  Box,
  Heading,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Text,
  Flex,
   Table, Tbody, Tr, Td,
} from "@chakra-ui/react";
import { Pie, Bar, Line } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement } from "chart.js";


ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement);


const ResumenInicio = ({ obtenerBeneficiarios }) => {
  const [beneficiarios, setBeneficiarios] = useState([]);
  const [total, setTotal] = useState(0);
  const [ninos, setNinos] = useState(0);
  const [adolescentes, setAdolescentes] = useState(0);
  const [adultos, setAdultos] = useState(0);
  const [adultosMayores, setAdultosMayores] = useState(0);

  useEffect(() => {
    obtenerDatosBeneficiarios();
  }, []);

const obtenerDatosBeneficiarios = async () => {
  const data = await obtenerBeneficiarios();
  // Filtrar solo los beneficiarios activos
  const activos = data.filter(b => b.activo === true);
  
  setBeneficiarios(activos);

  const total = activos.length;
  const ninos = activos.filter(b => calcularEdad(new Date(b.fechaNacimiento)) < 13).length;
  const adolescentes = activos.filter(b => {
    const edad = calcularEdad(new Date(b.fechaNacimiento));
    return edad >= 13 && edad < 18;
  }).length;
  const adultos = activos.filter(b => {
    const edad = calcularEdad(new Date(b.fechaNacimiento));
    return edad >= 18 && edad < 65;
  }).length;
  const adultosMayores = activos.filter(b => calcularEdad(new Date(b.fechaNacimiento)) >= 65).length;

  setTotal(total);
  setNinos(ninos);
  setAdolescentes(adolescentes);
  setAdultos(adultos);
  setAdultosMayores(adultosMayores);
};


  const calcularEdad = (fechaNacimiento) => {
    const hoy = new Date();
    let edad = hoy.getFullYear() - fechaNacimiento.getFullYear();
    const mes = hoy.getMonth() - fechaNacimiento.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < fechaNacimiento.getDate())) {
      edad--;
    }
    return edad;
  };

  const calcularPorcentaje = (cantidad) => {
    const porcentaje = (cantidad / total) * 100;
    return porcentaje % 1 === 0 ? porcentaje.toFixed(0) : porcentaje.toFixed(2);
  };

  const pieData = {
    labels: ["Niños", "Adolescentes", "Adultos", "Adultos Mayores"],
    datasets: [
      {
        data: [ninos, adolescentes, adultos, adultosMayores],
        backgroundColor: ["#FFCE56", "#36A2EB", "#4BC0C0", "#FF6384"],
      },
    ],
  };

  const barData = {
    labels: ["Niños", "Adolescentes", "Adultos", "Adultos Mayores"],
    datasets: [
      {
        label: "Cantidad de Beneficiarios",
        data: [ninos, adolescentes, adultos, adultosMayores],
        backgroundColor: ["#FFCE56", "#36A2EB", "#4BC0C0", "#FF6384"],
      },
    ],
  };

const lineData = {
  labels: ["Niños", "Adolescentes", "Adultos", "Adultos Mayores"],
  datasets: [
    {
      label: "Distribución de Beneficiarios",
      data: [ninos, adolescentes, adultos, adultosMayores],
      borderColor: "#36A2EB",
      fill: false,
      tension: 0.1, // para una línea ligeramente curvada, ajusta a 0 para línea recta
    },
  ],
};
const lineOptions = {
  responsive: true,
  plugins: {
    tooltip: {
      callbacks: {
        label: (tooltipItem) => `${tooltipItem.raw} beneficiarios`,
      },
    },
  },
  scales: {
    y: {
      beginAtZero: true,
    },
  },
};



  const barOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (tooltipItem) => `${tooltipItem.raw} beneficiarios`,
        },
      },
    },
  };

  const scatterOptions = {
    scales: {
      x: {
        type: "category",
        labels: ["Niños", "Adolescentes", "Adultos", "Adultos Mayores"],
      },
      y: {
        beginAtZero: true,
      },
    },
    plugins: {
      tooltip: {
        callbacks: {
          label: (tooltipItem) => `${tooltipItem.raw.y} beneficiarios`,
        },
      },
    },
  };

  const renderTable = () => (
    <table style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead>
        <tr>
          <th style={{ borderBottom: "2px solid #e2e2e2", padding: "8px", textAlign: "left" }}>
            Categoría
          </th>
          <th style={{ borderBottom: "2px solid #e2e2e2", padding: "8px", textAlign: "right" }}>
            Cantidad
          </th>
          <th style={{ borderBottom: "2px solid #e2e2e2", padding: "8px", textAlign: "right" }}>
            Porcentaje
          </th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style={{ borderBottom: "1px solid #e2e2e2", padding: "8px" }}>Total de Beneficiarios</td>
          <td style={{ borderBottom: "1px solid #e2e2e2", padding: "8px", textAlign: "right" }}>{total}</td>
          <td style={{ borderBottom: "1px solid #e2e2e2", padding: "8px", textAlign: "right" }}>100%</td>
        </tr>
        <tr>
          <td style={{ borderBottom: "1px solid #e2e2e2", padding: "8px" }}>Niños</td>
          <td style={{ borderBottom: "1px solid #e2e2e2", padding: "8px", textAlign: "right" }}>{ninos}</td>
          <td style={{ borderBottom: "1px solid #e2e2e2", padding: "8px", textAlign: "right" }}>{calcularPorcentaje(ninos)}%</td>
        </tr>
        <tr>
          <td style={{ borderBottom: "1px solid #e2e2e2", padding: "8px" }}>Adolescentes</td>
          <td style={{ borderBottom: "1px solid #e2e2e2", padding: "8px", textAlign: "right" }}>{adolescentes}</td>
          <td style={{ borderBottom: "1px solid #e2e2e2", padding: "8px", textAlign: "right" }}>{calcularPorcentaje(adolescentes)}%</td>
        </tr>
        <tr>
          <td style={{ borderBottom: "1px solid #e2e2e2", padding: "8px" }}>Adultos</td>
          <td style={{ borderBottom: "1px solid #e2e2e2", padding: "8px", textAlign: "right" }}>{adultos}</td>
          <td style={{ borderBottom: "1px solid #e2e2e2", padding: "8px", textAlign: "right" }}>{calcularPorcentaje(adultos)}%</td>
        </tr>
        <tr>
          <td style={{ padding: "8px" }}>Adultos Mayores</td>
          <td style={{ padding: "8px", textAlign: "right" }}>{adultosMayores}</td>
          <td style={{ padding: "8px", textAlign: "right" }}>{calcularPorcentaje(adultosMayores)}%</td>
        </tr>
      </tbody>
    </table>
  );

  return (
    <Box>
      <Box textAlign="center" mb={6}>
        <Heading>Bienvenido al Dashboard</Heading>

 <Flex justify="center" mt={5}>
    <Card boxShadow="lg" px={4} bg="gray.50" w="500px">
      <CardHeader>
        <Heading size="md" textAlign="center">
          Los beneficiarios se agrupan en las siguientes categorías:
        </Heading>
      </CardHeader>
      <CardBody pt="0">
        <Table variant="simple" size="sm" >
          <Tbody>
        <Tr>
          <Td border="1px solid" borderColor="#0099cc">
            <Box as="span" bg="#ffc534" w="10px" h="10px" borderRadius="50%" display="inline-block" mr="2" />
            Niños
          </Td>
          <Td border="1px solid" borderColor="#0099cc">menores de 12 años</Td>
        </Tr>
        <Tr>
          <Td border="1px solid" borderColor="#0099cc">
            <Box as="span" bg="#059bff" w="10px" h="10px" borderRadius="50%" display="inline-block" mr="2" />
            Adolescentes
          </Td>
          <Td border="1px solid" borderColor="#0099cc">12 a 17 años</Td>
        </Tr>
        <Tr>
          <Td border="1px solid" borderColor="#0099cc">
            <Box as="span" bg="#22cfcf" w="10px" h="10px" borderRadius="50%" display="inline-block" mr="2" />
            Adultos
          </Td>
          <Td border="1px solid" borderColor="#0099cc">18 a 64 años</Td>
        </Tr>
        <Tr>
          <Td border="1px solid" borderColor="#0099cc">
            <Box as="span" bg="#ff4069" w="10px" h="10px" borderRadius="50%" display="inline-block" mr="2" />
            Adultos Mayores
          </Td>
          <Td border="1px solid" borderColor="#0099cc">65 años o más</Td>
        </Tr>

          </Tbody>
        </Table>
      </CardBody>
    </Card>
  </Flex>



      </Box>

      <Flex justifyContent="center" wrap="wrap" gap={6} px={5}>
        {/* Gráfica de Pastel */}
        <Card w="500px" boxShadow="lg" p={3} bg="gray.50" mx="auto" mt={{ base: 4, md: 0 }}>
          <CardHeader>
            <Heading size="md" textAlign="center">
              Resumen de Beneficiarios - Gráfica de Pastel
            </Heading>
          </CardHeader>
          <CardBody>
            <Pie data={pieData} style={{ width: "100%", height: "100px" }} />
          </CardBody>
          <CardFooter>{renderTable()}</CardFooter>
        </Card>

        {/* Gráfica de Barras */}
        <Card w="500px" boxShadow="lg" p={3} bg="gray.50" mx="auto" mt={{ base: 4, md: 0 }}>
          <CardHeader>
            <Heading size="md" textAlign="center">
              Resumen de Beneficiarios - Gráfica de Barras
            </Heading>
          </CardHeader>
          <CardBody>
            <Bar data={barData} options={barOptions} style={{ width: "100%", height: "450px" }} />
          </CardBody>
          <CardFooter>{renderTable()}</CardFooter>
        </Card>

        {/* Gráfica de Puntos */}
        <Card w="500px" boxShadow="lg" p={3} bg="gray.50" mx="auto" mt={{ base: 4, md: 0 }}>
          <CardHeader>
            <Heading size="md" textAlign="center">
              Resumen de Beneficiarios - Gráfica de Puntos
            </Heading>
          </CardHeader>
          <CardBody>
                <Line data={lineData} options={lineOptions} style={{ width: "100%", height: "450px" }} />
          </CardBody>
          <CardFooter>{renderTable()}</CardFooter>
        </Card>
      </Flex>
    </Box>
  );
};

export default ResumenInicio;
