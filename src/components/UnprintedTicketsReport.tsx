import React from 'react';
import type { DbUser, Order } from '../types';

interface Props {
  apiFetch: (url: string, opts?: RequestInit) => Promise<Response>;
  apiUrl: string;
  dbUsers: DbUser[];
  showToast: (msg: string, v?: any) => void;
  printTicket: (order: any, reprint?: boolean) => Promise<void>;
}

const UnprintedTicketsReport: React.FC<Props> = ({ apiFetch, apiUrl, dbUsers, showToast, printTicket }) => {
  const [orders, setOrders] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [open, setOpen] = React.useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`${apiUrl}/orders/unprinted`);
      const data = await res.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch { showToast('Error al cargar tickets no impresos', 'error'); }
    setLoading(false);
  };

  const handleOpen = () => { setOpen(true); load(); };

  return (
    <div className="bg-white rounded-[40px] shadow-sm p-8 border-2 border-orange-100">
      <h4 className="text-lg font-black text-orange-600 uppercase mb-2">🖨️ Tickets No Impresos</h4>
      <p className="text-sm text-gray-500 mb-4">Pedidos registrados cuyo ticket no fue impreso correctamente.</p>
      <button
        onClick={handleOpen}
        className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-full font-black uppercase text-xs shadow-lg transition-all"
      >
        🖨️ Ver Tickets No Impresos
      </button>
      {open && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="p-6 border-b flex items-center justify-between">
              <h3 className="font-black text-lg uppercase text-orange-600">🖨️ Tickets No Impresos ({orders.length})</h3>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-700 text-2xl font-bold">×</button>
            </div>
            <div className="overflow-y-auto flex-1 p-6">
              {loading ? (
                <p className="text-center text-gray-400 py-8">Cargando...</p>
              ) : orders.length === 0 ? (
                <p className="text-center text-green-600 font-black py-8">✅ Todos los tickets fueron impresos correctamente</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[10px] uppercase text-gray-400 border-b">
                      <th className="pb-2">ID</th>
                      <th className="pb-2">Fecha</th>
                      <th className="pb-2">CI</th>
                      <th className="pb-2">Nombre</th>
                      <th className="pb-2">Consumo</th>
                      <th className="pb-2">Total</th>
                      <th className="pb-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((o: any) => {
                      const u = dbUsers.find(u => u.username === o.userId);
                      return (
                        <tr key={o.id} className="border-b hover:bg-orange-50">
                          <td className="py-2 font-black text-gray-500">#{o.id}</td>
                          <td className="py-2 text-gray-500">{o.dateIso}</td>
                          <td className="py-2 font-bold">{o.userId}</td>
                          <td className="py-2">{u?.fullName || '-'}</td>
                          <td className="py-2 uppercase text-xs">{o.category}</td>
                          <td className="py-2 font-black text-green-700">Gs. {Number(o.total).toLocaleString('es-PY')}</td>
                          <td className="py-2">
                            <button
                              onClick={async () => {
                                await printTicket({ id: o.id, userId: o.userId, category: o.category, dish: o.dishName ? { name: o.dishName } : undefined, quantity: o.quantity, total: o.total, timestamp: o.timestamp, dateIso: o.dateIso }, true);
                                load();
                              }}
                              className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase"
                            >
                              Reimprimir
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
            <div className="p-4 border-t flex justify-end">
              <button onClick={() => setOpen(false)} className="px-6 py-2 rounded-full bg-gray-100 font-black text-xs uppercase hover:bg-gray-200">Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UnprintedTicketsReport;
