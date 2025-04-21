import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { Button } from "@/components/ui/button";
import {Input } from "@/components/ui/input";
import {Label} from "@/components/ui/label";

interface Sucursal {
  id: string;
  nombre: string;
  direccion: string;
  imagen?: string;
}

const SucursalesContent: React.FC = () => {
  const [SucursalImage, setSucursalImage] = useState<string | null>(null);
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [showAddSucursal, setShowAddSucursal] = useState(false);
  const [SucursalName, setSucursalName] = useState('');
  const [SucursalDireccion, setSucursalDireccion] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState("");

  useEffect(() => {
    const guardadas = localStorage.getItem("sucursales");
    if (guardadas) {
      setSucursales(JSON.parse(guardadas));
    }
  }, []);

  const guardarSucursal = () => {
    const nuevaSucursal: Sucursal = {
      id: crypto.randomUUID(),
      nombre: SucursalName,
      direccion: SucursalDireccion,
      imagen: SucursalImage || undefined,
    };

    const nuevas = [...sucursales, nuevaSucursal];
    setSucursales(nuevas);
    localStorage.setItem("sucursales", JSON.stringify(nuevas));
    setSucursalName('');
    setSucursalDireccion('');
    setSucursalImage(null);
    setShowAddSucursal(false);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
    
      const allowedTypes = ["image/png", "image/jpeg"];
      if (!allowedTypes.includes(file.type)) {
        alert("Formato no permitido. Usa PNG o JPG ");
        return;
      }
    
      if (file.size > 10 * 1024 * 1024) {
        alert("El archivo supera los 10MB permitidos.");
        return;
      }
      setFileName(file.name);
      const imageUrl = URL.createObjectURL(file);
      setSucursalImage(imageUrl);
    };
  
    const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();
      setIsDragging(false);
      const file = event.dataTransfer.files?.[0];
      if (file) processFile(file);
    };
  
    const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();
      setIsDragging(true);
    };
  
    const handleDragLeave = () => setIsDragging(false);
  
    const processFile = (file: File) => {
      setSucursalImage(URL.createObjectURL(file));
      setFileName(file.name);
    };

  return (
    <main className="flex-1 overflow-y-auto m-3 bg-[#f5f5f5]">
      {showAddSucursal ? (
        <div className="p-6 bg-white shadow-md rounded-lg max-w-md mx-auto">
          <h2 className="text-lg font-semibold mb-3 ">Agregar nueva sucursal</h2>
          <div
            className={`mb-3 flex-col items-center rounded-lg border border-dashed py-8 cursor-pointer transition-all ${
              isDragging ? "border-blue-500 bg-blue-100" : "border-gray-300"
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => document.getElementById("file-upload")?.click()}
          >
            <div className="text-center">
              {SucursalImage ? (
                <div className="flex flex-col items-center">
                  <img
                    src={SucursalImage}
                    alt="Preview"
                    className="w-24 h-24 object-cover rounded mb-2"
                  />
                  <p className="text-sm text-gray-500">{fileName}</p>
                  <div className="flex gap-8 mt-2">
                    <Button variant="destructive" onClick={() => setSucursalImage(null)}>
                      Eliminar
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <svg
                    className="mx-auto size-12 text-gray-300"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M1.5 6a2.25 2.25 0 0 1 2.25-2.25h16.5A2.25 2.25 0 0 1 22.5 6v12a2.25 2.25 0 0 1-2.25 2.25H3.75A2.25 2.25 0 0 1 1.5 18V6ZM3 16.06V18c0 .414.336.75.75.75h16.5A.75.75 0 0 0 21 18v-1.94l-2.69-2.689a1.5 1.5 0 0 0-2.12 0l-.88.879.97.97a.75.75 0 1 1-1.06 1.06l-5.16-5.159a1.5 1.5 0 0 0-2.12 0L3 16.061Zm10.125-7.81a1.125 1.125 0 1 1 2.25 0 1.125 1.125 0 0 1-2.25 0Z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <label className="cursor-pointer">
                    <span className="text-blue-500 text-sm mt-2">Sube la imagen</span>
                    <span className="text-sm text-gray-400 text-center">
                      o Arrastra la imagen
                    </span>
                    <p className="text-xs text-gray-600">PNG, JPG, hasta 10MB</p>
                    <input
                      id="file-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                  </label>
                </>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="sucursal-name">Nombre</Label>
              <Input
                id="sucursal-name"
                value={SucursalName}
                onChange={(e) => setSucursalName(e.target.value)}
                placeholder="Nombre de la sucursal"
            />
          </div>
          <div className='mt-3 '>
          <div className="space-y-2">
            <Label htmlFor="direccion-name">Dirección</Label>
              <Input
                id="direccion-name"
                value={SucursalDireccion}
                onChange={(e) => setSucursalDireccion(e.target.value)}
                placeholder="Agregue la dirección"
            />
          </div>
          </div>
          <div className="flex justify-end mt-3 gap-3">
            <Button variant="outline" type="button" 
              onClick={guardarSucursal}>
              Cancelar
            </Button>
            <Button type="button" onClick={() => setShowAddSucursal(false)}
                className="bg-blue-500 hover:bg-blue-600">
                Guardar
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="mb-6">
            <button
              onClick={() => setShowAddSucursal(true)}
              className="px-3 py-3 flex items-center gap-2 rounded-sm bg-[#1366D9] text-white shadow-lg"
            >
              <Plus className="w-4 h-4" />
              Agregar sucursal
            </button>
          </div>

          <div className="grid grid-cols-1 justify-items-center md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
            {sucursales.length === 0 ? (
              <p>No hay sucursales registradas</p>
            ) : (
              sucursales.map((sucursal) => (
                <div
                  key={sucursal.id}
                  className="relative flex flex-col bg-white shadow-sm border border-slate-200 rounded-lg w-full"
                >
                  {sucursal.imagen && (
                    <img
                      src={sucursal.imagen}
                      alt={sucursal.nombre}
                      className="w-20 h-20 object-cover rounded-t-lg"
                    />
                  )}
                  <div className="p-4">
                    <h2 className="text-lg font-semibold">{sucursal.nombre}</h2>
                    <p className="text-sm text-slate-600 mt-2">{sucursal.direccion}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </main>
  );
};

export default SucursalesContent;

