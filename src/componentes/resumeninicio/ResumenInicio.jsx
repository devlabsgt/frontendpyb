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
  Grid,
} from "@chakra-ui/react";
import { Pie, Bar, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
} from "chart.js";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement
);

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
    const activos = data.filter((b) => b.activo === true);

    setBeneficiarios(activos);
    const total = activos.length;
    const ninos = activos.filter((b) => calcularEdad(new Date(b.fechaNacimiento)) < 13).length;
    const adolescentes = activos.filter((b) => {
      const edad = calcularEdad(new Date(b.fechaNacimiento));
      return edad >= 13 && edad < 18;
    }).length;
    const adultos = activos.filter((b) => {
      const edad = calcularEdad(new Date(b.fechaNacimiento));
      return edad >= 18 && edad < 65;
    }).length;
    const adultosMayores = activos.filter((b) => calcularEdad(new Date(b.fechaNacimiento)) >= 65).length;

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
        tension: 0.1,
      },
    ],
  };

  const lineOptions = {
    responsive: true,
    scales: {
      y: { beginAtZero: true },
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

  const renderTable2 = () => (
    <table variant="simple" size="sm">
      <tbody>
        <tr>
          <td style={{ border: "1px solid #0099cc", padding: "8px" }}>
            <Box as="span" bg="#ffc534" w="10px" h="10px" borderRadius="50%" display="inline-block" mr="2" />
            Niños
          </td>
          <td style={{ border: "1px solid #0099cc", padding: "8px" }}>menores de 12 años</td>
        </tr>
        <tr>
          <td style={{ border: "1px solid #0099cc", padding: "8px" }}>
            <Box as="span" bg="#059bff" w="10px" h="10px" borderRadius="50%" display="inline-block" mr="2" />
            Adolescentes
          </td>
          <td style={{ border: "1px solid #0099cc", padding: "8px" }}>12 a 17 años</td>
        </tr>
        <tr>
          <td style={{ border: "1px solid #0099cc", padding: "8px" }}>
            <Box as="span" bg="#22cfcf" w="10px" h="10px" borderRadius="50%" display="inline-block" mr="2" />
            Adultos
          </td>
          <td style={{ border: "1px solid #0099cc", padding: "8px" }}>18 a 64 años</td>
        </tr>
        <tr>
          <td style={{ border: "1px solid #0099cc", padding: "8px" }}>
            <Box as="span" bg="#ff4069" w="10px" h="10px" borderRadius="50%" display="inline-block" mr="2" />
            Adultos Mayores
          </td>
          <td style={{ border: "1px solid #0099cc", padding: "8px" }}>65 años o más</td>
        </tr>
      </tbody>
    </table>
  );

  return (
<Box>
  <Grid
    templateColumns={{ base: "1fr", lg: "repeat(3, 1fr)" }}
    templateRows={{ base: "auto", lg: "auto auto" }}
    gap={4}
    px={5}
  >
<Box gridColumn={{ base: "1", lg: "1 / -1" }} display="flex" justifyContent="center">
  <Card
    boxShadow="lg"
    p={4}
    bg="gray.100"
    width="500px"
    height="auto"
    display="flex"
    flexDirection="column"
    alignItems="center"
    justifyContent="center"
  >
    <Heading size="md" textAlign="center">Categorías de Beneficiarios</Heading>
    <CardBody display="flex" justifyContent="center">
      {renderTable2()}
    </CardBody>
  </Card>
</Box>


    <Card boxShadow="lg" p={4} bg="gray.100" width="500px" mx="auto" display="flex" flexDirection="column" justifyContent="center" alignItems="center">
      <Heading size="md" textAlign="center">Gráfica de Pastel</Heading>
      <CardBody>
        <Pie data={pieData} />
      </CardBody>
      <CardFooter>{renderTable()}</CardFooter>
    </Card>
<Card boxShadow="lg" p={4} bg="gray.100" width="500px" mx="auto" display="flex" flexDirection="column" justifyContent="center" alignItems="center">
  <Heading size="md" textAlign="center">Gráfica de Barras</Heading>
  <CardBody width="100%" height="400px" display="flex" justifyContent="center" alignItems="center">
    <Bar
      data={barData}
      options={{
        ...barOptions,
        responsive: true,
        maintainAspectRatio: false,
      }}
      width={500}
      height={350}
    />
  </CardBody>
  <CardFooter>{renderTable()}</CardFooter>
</Card>

<Card boxShadow="lg" p={4} bg="gray.100" width="500px" mx="auto" display="flex" flexDirection="column" justifyContent="center" alignItems="center">
  <Heading size="md" textAlign="center">Gráfica de Línea</Heading>
  <CardBody width="100%" height="400px" display="flex" justifyContent="center" alignItems="center">
    <Line
      data={lineData}
      options={{
        ...lineOptions,
        responsive: true,
        maintainAspectRatio: false,
      }}
      width={500}
      height={350}
    />
  </CardBody>
  <CardFooter>{renderTable()}</CardFooter>
</Card>



  </Grid>
</Box>


  );
};

export default ResumenInicio;
