import { Outlet } from "react-router-dom"
import { AdminNav } from "../components/admin-nav"

export default function AdminLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <AdminNav />
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  )
}

