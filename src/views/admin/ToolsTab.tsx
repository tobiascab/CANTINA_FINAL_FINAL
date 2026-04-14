import React from 'react';
import type { Order, DbUser } from '../../types';
import UnprintedTicketsReport from '../../components/UnprintedTicketsReport';

interface Props {
  availablePrinters: string[];
  setAvailablePrinters: (v: string[]) => void;
  selectedPrinterName: string;
  setSelectedPrinterName: (v: string) => void;
  printerConfigSaved: boolean;
  setPrinterConfigSaved: (v: boolean) => void;
  reprintOrders: any[];
  setReprintOrders: (v: any[]) => void;
  reprintSearch: string;
  setReprintSearch: (v: string) => void;
  reprintDate: string;
  setReprintDate: (v: string) => void;
  setReprintOrder: (v: any) => void;
  setCurrentOrder: (v: Order | null) => void;
  setIsReprint: (v: boolean) => void;
  setView: (v: any) => void;
  setAllOrders: (v: Order[] | ((prev: Order[]) => Order[])) => void;
  menuItems: any[];
  dbUsers: DbUser[];
  apiFetch: (url: string, opts?: RequestInit) => Promise<Response>;
  apiUrl: string;
  showToast: (msg: string, v?: any) => void;
  showConfirm: (msg: string, onYes: () => void, title?: string) => void;
  printTicket: (order: any, reprint?: boolean) => Promise<void>;
}

const ToolsTab: React.FC<Props> = ({
  availablePrinters, setAvailablePrinters, selectedPrinterName, setSelectedPrinterName,
  printerConfigSaved, setPrinterConfigSaved, reprintOrders, setReprintOrders,
  reprintSearch, setReprintSearch, reprintDate, setReprintDate,
  setReprintOrder, setCurrentOrder, setIsReprint, setView, setAllOrders,
  menuItems, dbUsers, apiFetch, apiUrl, showToast, showConfirm, printTicket
}) => {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 space-y-8">
      <h3 className="text-2xl font-black text-[#2E8B57] uppercase">⚙️ Herramientas</h3>

      {/* PRINTER CONFIG */}
      <div className="bg-white rounded-[40px] shadow-sm p-8 border-2 border-green-100">
        <h4 className="text-lg font-black text-gray-800 uppercase mb-1">🖨️ Impresora Térmica</h4>
        <p className="text-sm text-gray-500 mb-5">Seleccione la impresora de tickets térmica conectada.</p>
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[220px]">
            <label className="block text-[9px] font-black uppercase text-gray-400 mb-1">Impresora</label>
            <select
              value={selectedPrinterName}
              onChange={e => { setSelectedPrinterName(e.target.value); setPrinterConfigSaved(false); }}
              className="w-full p-3 bg-gray-50 rounded-xl font-bold text-sm border-2 border-transparent focus:border-[#2E8B57] outline-none"
            >
              <option value="">-- Seleccionar impresora --</option>
              {availablePrinters.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <button
            onClick={async () => {
              try {
                const res = await apiFetch(`${apiUrl}/printers`);
                const { printers } = await res.json();
                setAvailablePrinters(printers || []);
                showToast('Lista de impresoras actualizada', 'info');
              } catch (e) { showToast('Error al buscar impresoras', 'error'); }
            }}
            className="bg-gray-100 hover:bg-gray-200 text-gray-600 px-5 py-3 rounded-xl font-black uppercase text-xs transition-all"
          >
            🔄 Actualizar
          </button>
          <button
            onClick={async () => {
              if (!selectedPrinterName) { showToast('Seleccione una impresora primero', 'warning'); return; }
              try {
                const res = await apiFetch(`${apiUrl}/printer-config`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ printerName: selectedPrinterName, interface: 'windows' })
                });
                if (res.ok) {
                  setPrinterConfigSaved(true);
                  showToast(`✅ Impresora "${selectedPrinterName}" configurada`, 'success');
                } else { showToast('Error al guardar configuración', 'error'); }
              } catch (e) { showToast('Error de conexión', 'error'); }
            }}
            className="bg-[#2E8B57] hover:bg-green-700 text-white px-6 py-3 rounded-xl font-black uppercase text-xs shadow-lg transition-all"
          >
            💾 Guardar
          </button>
        </div>
        {selectedPrinterName && (
          <div className={`mt-4 flex items-center gap-2 text-xs font-bold ${printerConfigSaved ? 'text-green-600' : 'text-yellow-600'}`}>
            <span>{printerConfigSaved ? '✅' : '⚠️'}</span>
            <span>{printerConfigSaved ? `Impresora activa: "${selectedPrinterName}"` : `Impresora seleccionada: "${selectedPrinterName}" — Presione GUARDAR para aplicar`}</span>
          </div>
        )}
        {!selectedPrinterName && <p className="mt-4 text-xs font-bold text-red-500">⚠️ Sin impresora configurada. Los tickets no se imprimirán automáticamente.</p>}
      </div>

      {/* BACKUP IMAGES */}
      <div className="bg-white rounded-[40px] shadow-sm p-8">
        <h4 className="text-lg font-black text-gray-800 uppercase mb-2">📸 Respaldo de Imágenes</h4>
        <p className="text-sm text-gray-500 mb-4">Guarda una copia de todas las imágenes de los platos como archivos en el servidor.</p>
        <button
          onClick={async () => {
            try {
              const res = await apiFetch(`${apiUrl}/dishes/backup-images`, { method: 'POST' });
              const data = await res.json();
              if (data.success) showToast(data.message, 'success');
              else showToast('Error al respaldar imágenes', 'error');
            } catch (e) { showToast('Error de conexión', 'error'); }
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-full font-black uppercase text-xs shadow-lg transition-all"
        >
          📸 Respaldar Todas las Imágenes
        </button>
      </div>

      {/* TICKETS NO IMPRESOS */}
      <UnprintedTicketsReport apiFetch={apiFetch} apiUrl={apiUrl} dbUsers={dbUsers} showToast={showToast} printTicket={printTicket} />

      {/* DELETE ALL ORDERS */}
      <div className="bg-white rounded-[40px] shadow-sm p-8 border-2 border-red-100">
        <h4 className="text-lg font-black text-red-600 uppercase mb-2">🗑️ Borrar Datos de Cantina</h4>
        <p className="text-sm text-gray-500 mb-4">Elimina TODOS los pedidos/consumos registrados. Esta acción no se puede deshacer.</p>
        <button
          onClick={() => showConfirm('¿Estás SEGURO de borrar TODOS los pedidos?\nEsta acción no se puede deshacer.', async () => {
            try {
              const res = await apiFetch(`${apiUrl}/orders/all`, { method: 'DELETE' });
              const data = await res.json();
              if (data.success) { setAllOrders([]); showToast('Todos los pedidos eliminados', 'success'); }
              else showToast('Error al borrar pedidos', 'error');
            } catch (e) { showToast('Error de conexión', 'error'); }
          }, 'Borrar Datos')}
          className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-full font-black uppercase text-xs shadow-lg transition-all"
        >
          🗑️ Borrar TODOS los Pedidos
        </button>
      </div>

      {/* REPRINT RECEIPTS */}
      <div className="bg-white rounded-[40px] shadow-sm p-8">
        <h4 className="text-lg font-black text-gray-800 uppercase mb-4">🧾 Reimprimir Facturas</h4>
        <div className="flex flex-wrap gap-4 mb-6">
          <div>
            <label className="block text-[8px] font-black uppercase text-gray-400 mb-1">Fecha</label>
            <input type="date" value={reprintDate} onChange={e => setReprintDate(e.target.value)} className="p-3 rounded-xl bg-gray-50 font-bold text-sm border-none focus:ring-2 focus:ring-[#2E8B57]" />
          </div>
          <div>
            <label className="block text-[8px] font-black uppercase text-gray-400 mb-1">Buscar por CI o Nombre</label>
            <input type="text" value={reprintSearch} onChange={e => setReprintSearch(e.target.value)} placeholder="CI o Nombre..." className="p-3 rounded-xl bg-gray-50 font-bold text-sm border-none focus:ring-2 focus:ring-[#2E8B57] w-64" />
          </div>
          <div className="flex items-end">
            <button
              onClick={async () => {
                try {
                  const res = await apiFetch(`${apiUrl}/orders/search?dateFrom=${reprintDate}&dateTo=${reprintDate}`);
                  const data = await res.json();
                  setReprintOrders(data);
                } catch (e) { showToast('Error al buscar', 'error'); }
              }}
              className="bg-[#2E8B57] hover:bg-green-700 text-white px-6 py-3 rounded-full font-black uppercase text-xs shadow-lg transition-all"
            >
              🔍 Buscar Pedidos
            </button>
          </div>
        </div>

        {reprintOrders.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs font-black text-gray-500">
              {reprintOrders.filter(o => {
                if (!reprintSearch) return true;
                const user = dbUsers.find(u => u.username === o.userId);
                const search = reprintSearch.toLowerCase();
                return o.userId.includes(search) || (user?.fullName || '').toLowerCase().includes(search);
              }).length} resultados encontrados
            </p>
            <div className="max-h-[400px] overflow-y-auto space-y-2">
              {reprintOrders.filter(o => {
                if (!reprintSearch) return true;
                const user = dbUsers.find(u => u.username === o.userId);
                const search = reprintSearch.toLowerCase();
                return o.userId.includes(search) || (user?.fullName || '').toLowerCase().includes(search);
              }).map((order, i) => {
                const user = dbUsers.find(u => u.username === order.userId);
                return (
                  <div key={i} className="flex items-center justify-between bg-gray-50 p-4 rounded-2xl hover:bg-gray-100 transition-colors">
                    <div className="flex-1">
                      <p className="font-black text-sm text-gray-800 uppercase">{user?.fullName || order.userId}</p>
                      <p className="text-[10px] font-bold text-gray-500">CI: {order.userId} | {order.category?.toUpperCase()} | {order.dishName || 'DESAYUNO'} x{order.quantity}</p>
                      <p className="text-[10px] font-bold text-gray-400">{order.timestamp}</p>
                    </div>
                    <div className="text-right mr-4">
                      <p className="font-black text-[#2E8B57]">Gs. {order.total?.toLocaleString()}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setReprintOrder(order);
                          const dish = menuItems.find((d: any) => d.name === order.dishName);
                          setCurrentOrder({ userId: order.userId, category: order.category, dish: dish || undefined, quantity: order.quantity, total: order.total, timestamp: order.timestamp, dateIso: order.dateIso });
                          setIsReprint(false);
                          setView('ticket');
                        }}
                        className="bg-[#2E8B57] hover:bg-green-700 text-white px-3 py-2 rounded-xl font-black uppercase text-[9px] shadow transition-all"
                      >
                        🖨️ Original
                      </button>
                      <button
                        onClick={() => {
                          setReprintOrder(order);
                          const dish = menuItems.find((d: any) => d.name === order.dishName);
                          setCurrentOrder({ userId: order.userId, category: order.category, dish: dish || undefined, quantity: order.quantity, total: order.total, timestamp: order.timestamp, dateIso: order.dateIso });
                          setIsReprint(true);
                          setView('ticket');
                        }}
                        className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-2 rounded-xl font-black uppercase text-[9px] shadow transition-all"
                      >
                        📋 Duplicado
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {reprintOrders.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            <span className="text-4xl block mb-2">🧾</span>
            <p className="font-bold">Selecciona una fecha y busca pedidos para reimprimir</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ToolsTab;
