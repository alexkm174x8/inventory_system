import React from 'react'
import LoginLogo from './login-logo'

const VentasContent = () => {
  const productosVenta = [
    { name: "Pantalón azul marino", quantity: 2, price: "$30.00 MXN" },
    { name: "Pantalón azul claro", quantity: 1, price: "$40.00 MXN" }
  ];
  const datos = {
    id: 23444,
    cliente: "Público en general",
    mes: "Diciembre",
    dia: 23,
    año: 2025,
    hora: "14:30 PM",
    total: 567
  };
  return (
    <main className="flex-1 overflow-y-auto m-3 bg-[#f5f5f5]">
      <div className="relative flex flex-col my-6 bg-white shadow-sm border border-slate-200 rounded-lg w-96">      
        <div className="mx-3 mb-0 border-b border-slate-200 pt-3 pb-2 px-1">
          <table>
            <tbody >
              <tr >
                <td>
                  <LoginLogo size={60} />
                </td>
                <td>
                  <h2 className="text-lg font-semibold">Venta #{datos.id}</h2>
                  <p className="font-light text-sm mt-2">Cliente: {datos.cliente}</p>
                </td>
              </tr>
            </tbody>
          </table>
          <div className="flex items-center gap-30 mt-3 font-body text-sm">
            <p > {datos.dia} de {datos.mes} de {datos.año}</p>
            <p > {datos.hora}</p>
          </div>
        </div>
        <div className="p-4">
            <div className="flex justify-between text-gray-400  pb-3">
              <span>Cantidad</span>
              <span>Producto</span>
              <span>Precio</span>
            </div>
              <ul className="text-slate-600 font-light">
                {productosVenta.map((producto, index) => (
                  <li key={index} className="flex justify-between py-1">
                    <span>{producto.quantity}</span>
                    <span>{producto.name} </span>
                    <span>{producto.price}</span>
                    </li>
                  ))}
              </ul>
        </div>
        <div className="mx-3 border-t border-slate-200 pb-3 pt-2 px-1">
          <div className=" flex text-sm text-slate-600 font-medium gap-70">
            <p >Total</p>
            <p > ${datos.total}</p>
          </div>
        </div>
      </div>
    </main>
  )
}

export default VentasContent