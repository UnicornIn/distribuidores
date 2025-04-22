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
import { PrivateRoute } from "./components/PrivateRoute";
import ComfirmationPedido from "./components/ConfirmacionPedido"

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />

      {/* Rutas protegidas */}
      <Route path="/distribuidor" element={<PrivateRoute />}>
        <Route path="" element={<DistribuidorLayout />}>
          <Route path="pedidos" element={<PedidosPage />} />
          <Route path="pedidos/nuevo" element={<NuevoPedidoPage />} />
          <Route path="pedidos/:id" element={<DetallePedidoPage />} />
          <Route path="pedidos/confirmacion" element={<ComfirmationPedido />} />
        </Route>
      </Route>

      <Route path="/admin" element={<PrivateRoute />}>
        <Route path="" element={<AdminLayout />}>
          <Route path="dashboard" element={<AdminDashboardPage />} />
          <Route path="productos" element={<ProductosPage />} />
          <Route path="pedidos" element={<AdminPedidosPage />} />
          <Route path="configuracion" element={<ConfiguracionPage />} />
          <Route path="usuarios" element={<UsuariosPage />} />
          <Route path="almacenes" element={<AlmacenesPage />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
