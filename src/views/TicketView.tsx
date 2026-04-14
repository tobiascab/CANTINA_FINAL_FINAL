import React from 'react';
import type { Order, DbUser, AppView } from '../types';
import { APP_TITLE } from '../constants';

interface Props {
  currentOrder: Order;
  dbUsers: DbUser[];
  isReprint: boolean;
  setIsReprint: (v: boolean) => void;
  printTicket: (order: Order, reprint?: boolean) => Promise<void>;
  reprintOrder: any;
  setReprintOrder: (v: any) => void;
  setCurrentOrder: (v: Order | null) => void;
  setView: (v: AppView | 'kitchen-dashboard') => void;
  setAdminTab: (v: 'stats' | 'menu' | 'users' | 'tools') => void;
  handleLogout: () => void;
}

const TicketView: React.FC<Props> = ({
  currentOrder, dbUsers, isReprint, setIsReprint, printTicket,
  reprintOrder, setReprintOrder, setCurrentOrder, setView, setAdminTab, handleLogout
}) => {
  return (
    <div className="w-full max-w-[350px] bg-white p-10 border-2 border-black text-center mt-10 shadow-2xl print:shadow-none print:border-none print:w-[80mm] print:max-w-none print:mt-0 print:p-2 print:absolute print:top-0 print:left-0">
      <h2 className="text-2xl font-black uppercase text-black mb-1">{APP_TITLE}</h2>
      <div className="text-xl font-black text-gray-800 mb-2">TICKET N° {currentOrder.id || 'S/N'}</div>
      {isReprint && <div className="text-[12px] font-black text-black mt-1">*** REIMPRESIÓN ***</div>}
      <div className="border-b-2 border-dashed border-black my-4"></div>
      <div className="text-sm space-y-2 text-left uppercase font-bold text-black font-mono leading-tight">
        <div className="flex justify-between"><span>FECHA:</span> <b>{currentOrder.timestamp}</b></div>
        <div className="flex justify-between"><span>CI:</span> <b>{currentOrder.userId}</b></div>
        <div className="flex justify-between"><span>NOMBRE:</span> <b className="truncate max-w-[150px]">{dbUsers.find(u => u.username === currentOrder.userId)?.fullName || 'Socio'}</b></div>
        <div className="flex justify-between"><span>CONSUMICIÓN:</span> <b className="uppercase">{currentOrder.category}</b></div>
        <div className="flex justify-between"><span>PEDIDO:</span> <div className="text-right flex flex-col items-end">
          <b>{currentOrder.dish?.name || 'DESAYUNO'}</b>
          {currentOrder.category === 'combo' && <span className="text-[10px]">+ DESAYUNO</span>}
        </div></div>
        <div className="flex justify-between"><span>CANTIDAD:</span> <b>{currentOrder.quantity}</b></div>
      </div>
      {isReprint && <div className="text-[10px] font-black text-black mt-4 text-center">TICKET SIN VALIDEZ (REIMPRESIÓN)</div>}
      <div className="flex justify-between text-3xl font-black border-t-2 border-dashed border-black pt-6 mt-6 text-black"><span>TOTAL:</span><span>Gs. {currentOrder.total.toLocaleString()}</span></div>
      <div className="mt-12 border-t border-black w-40 mx-auto pt-2 print:w-full"><p className="text-[10px] font-black">Firma</p></div>
      <p className="text-[10px] italic mt-4 print:mb-8 font-mono">¡Buen provecho!</p>

      {isReprint && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.15] z-0 overflow-hidden">
          <div className="text-7xl font-black uppercase text-gray-500 border-[12px] border-gray-500 p-6 rotate-[-35deg] whitespace-nowrap">
            REIMPRESO
          </div>
        </div>
      )}

      <div className="mt-10 flex flex-col gap-3 no-print">
        <button
          onClick={async () => {
            setIsReprint(true);
            await printTicket(currentOrder, true);
          }}
          className="w-full bg-gray-100 text-gray-600 py-4 rounded-3xl font-black text-xs uppercase hover:bg-gray-200 transition-colors"
        >
          🔄 Reimprimir Ticket
        </button>
        {reprintOrder ? (
          <button
            onClick={() => {
              setReprintOrder(null);
              setCurrentOrder(null);
              setView('admin-dashboard');
              setAdminTab('tools');
            }}
            className="w-full bg-[#2E8B57] text-white py-4 rounded-3xl font-black text-xs uppercase shadow-lg hover:bg-green-700 transition-colors"
          >
            ← Volver al Panel
          </button>
        ) : (
          <button
            onClick={handleLogout}
            className="w-full bg-[#2E8B57] text-white py-4 rounded-3xl font-black text-xs uppercase shadow-lg hover:bg-green-700 transition-colors"
          >
            Finalizar y Salir
          </button>
        )}
      </div>
    </div>
  );
};

export default TicketView;
