'use client'
import { useState } from "react";
import { Search, Bell, ChevronDown, BarChart2, Users, CircleDollarSign, LogOut, Menu, Archive, User, Store, Settings } from "lucide-react";
import MenuContent from "@/components/MenuContent";
import InventarioContent from "@/components/InventarioContent";
import ClientesContent from "@/components/ClientesContent";
import VentasContent from "@/components/VentasContent";
import EmpleadosContent from "@/components/EmpleadosContent";
import SucursalesContent from "@/components/SucursalesContent";
import ConfiguracionContent from "@/components/ConfiguracionContent";

export default function Dashboard() {
  const [activePage, setActivePage] = useState("menu");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const renderContent = () => {
    switch (activePage) {
      case "inventario":
        return <InventarioContent />;
      case "clientes":
        return <ClientesContent />;
      case "ventas":
        return <VentasContent />;
      case "empleados":
        return <EmpleadosContent />;
      case "sucursales":
        return <SucursalesContent />;
      case "configuracion":
        return <ConfiguracionContent />;
      default:
        return <MenuContent />;
    }
  };

  const getPageTitle = () => {
    switch (activePage) {
      case "inventario":
        return "Inventario";
      case "clientes":
        return "Clientes";
      case "ventas":
        return "Ventas";
      case "empleados":
        return "Empleados";
      case "sucursales":
        return "Sucursales";
      case "configuracion":
        return "Configuración";
      default:
        return "Menú";
    }
  };

  return (
    <div className="flex h-screen bg-[#f5f5f5]">
      {/* Overlay for mobile menu */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-20 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar - Modified for mobile */}
      <aside className={`fixed md:static md:flex flex-col w-50 md:w-44 bg-white border-r border-[#e6e6e6] h-full z-30 transition-transform duration-300 ${
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      } md:translate-x-0`}>
        <div className="p-4">
          <h1 className="text-xl font-bold text-[#1b1f26]">Trade Hub</h1>
        </div>
        <nav className="flex-1 overflow-y-auto">
          <div className="px-4 py-2">
            <div className="mt-2 space-y-1">
              <button
                onClick={() => setActivePage("menu")}
                className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${activePage === "menu" ? "bg-[#e8f1fd] text-[#007aff]" : "text-[#667085] hover:bg-[#f5f5f5]"}`}
              >
                <BarChart2 className="mr-3 h-5 w-5" />
                Menú
              </button>
              <button
                onClick={() => setActivePage("inventario")}
                className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${activePage === "inventario" ? "bg-[#e8f1fd] text-[#007aff]" : "text-[#667085] hover:bg-[#f5f5f5]"}`}
              >
                <Archive className="mr-3 h-5 w-5" />
                Inventario
              </button>
              <button
                onClick={() => setActivePage("clientes")}
                className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${activePage === "clientes" ? "bg-[#e8f1fd] text-[#007aff]" : "text-[#667085] hover:bg-[#f5f5f5]"}`}
              >
                <Users className="mr-3 h-5 w-5" />
                Clientes
              </button>
              <button
                onClick={() => setActivePage("ventas")}
                className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${activePage === "ventas" ? "bg-[#e8f1fd] text-[#007aff]" : "text-[#667085] hover:bg-[#f5f5f5]"}`}
              >
                <CircleDollarSign className="mr-3 h-5 w-5" />
                Ventas
              </button>
              <button
                onClick={() => setActivePage("empleados")}
                className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${activePage === "empleados" ? "bg-[#e8f1fd] text-[#007aff]" : "text-[#667085] hover:bg-[#f5f5f5]"}`}
              >
                <User className="mr-3 h-5 w-5" />
                Empleados
              </button>
              <button
                onClick={() => setActivePage("sucursales")}
                className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${activePage === "sucursales" ? "bg-[#e8f1fd] text-[#007aff]" : "text-[#667085] hover:bg-[#f5f5f5]"}`}
              >
                <Store className="mr-3 h-5 w-5" />
                Sucursales
              </button>
            </div>
          </div>
        </nav>
        <div className="p-4 border-t border-[#e6e6e6]">
          <button
            onClick={() => setActivePage("configuracion")}
            className={`flex items-center w-full px-4 py-2 text-sm font-medium rounded-md ${activePage === "configuracion" ? "bg-[#e8f1fd] text-[#007aff]" : "text-[#667085] hover:bg-[#f5f5f5]"}`}
          >
            <Settings className="mr-3 h-5 w-5" />
            Configuración
          </button>
          <button className="flex items-center w-full px-4 py-2 text-sm font-medium text-[#667085] rounded-md hover:bg-[#f5f5f5]">
            <LogOut className="mr-3 h-5 w-5" />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header - Modified menu button */}
        <header className="bg-white border-b border-[#e6e6e6] py-4 px-6 flex items-center justify-between">
          <button 
            className="md:hidden p-2 rounded-md text-[#667085] hover:bg-[#f5f5f5]"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="relative flex-1 max-w-md ml-4 md:ml-0">
            <h1 className="text-2xl font-bold text-[#1b1f26]">{getPageTitle()}</h1>
          </div>
          <div className="flex items-center space-x-4">
            <button className="p-2 rounded-full text-[#667085] hover:bg-[#f5f5f5] relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-[#f36960] rounded-full"></span>
            </button>
            <div className="flex items-center">
              <div className="h-8 w-8 rounded-full bg-[#007aff] flex items-center justify-center text-white font-medium">
                JD
              </div>
              <button className="ml-2 flex items-center text-sm font-medium text-[#1b1f26]">
                John Doe
                <ChevronDown className="ml-1 h-4 w-4 text-[#667085]" />
              </button>
            </div>
          </div>
        </header>

        {/* Main Content Section */}
        <main className="flex-1 overflow-y-auto p-6 bg-[#f5f5f5]">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
