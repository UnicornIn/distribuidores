import { Routes, Route } from "react-router-dom";
import HomePage from "./pages/home";
import LoginPage from "./pages/login";
import DistribuidorLayout from "./layouts/distribuidor-layout";
import PedidosPage from "./pages/distribuidor/pedidos";
import NuevoPedidoPage from "./pages/distribuidor/nuevo-pedido";
import DetallePedidoPage from "./pages/distribuidor/detalle-pedido";
import AdminLayout from "./layouts/admin-layout";
import AdminDashboardPage from "./pages/admin/dashboard";
import ProductosPage from "./pages/admin/productos";
import AdminPedidosPage from "./pages/admin/pedidos";
import ConfiguracionPage from "./pages/admin/configuracion";
import UsuariosPage from "./pages/admin/usuarios";
import AlmacenesPage from "./pages/admin/almacenes";

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />

      {/* Distribuidor routes */}
      <Route path="/distribuidor" element={<DistribuidorLayout />}>
        <Route path="pedidos" element={<PedidosPage />} />
        <Route path="pedidos/nuevo" element={<NuevoPedidoPage />} />
        <Route path="pedidos/:id" element={<DetallePedidoPage />} />
      </Route>

      {/* Admin routes */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route path="dashboard" element={<AdminDashboardPage />} />
        <Route path="productos" element={<ProductosPage />} />
        <Route path="pedidos" element={<AdminPedidosPage />} />
        <Route path="configuracion" element={<ConfiguracionPage />} />
        <Route path="usuarios" element={<UsuariosPage />} />
        <Route path="almacenes" element={<AlmacenesPage />} />
      </Route>
    </Routes>
  );
}

export default App;
