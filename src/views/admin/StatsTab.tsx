import React from 'react';
import DatePicker, { registerLocale } from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { es } from 'date-fns/locale';
import * as XLSX from 'xlsx-js-style';
import type { UserSummary } from '../../types';
import { APP_TITLE } from '../../constants';

registerLocale('es', es);

interface Stats {
  totalRevenue: number;
  totalOrders: number;
  averageTicket: number;
  userList: UserSummary[];
  topDish: string;
  dishRanking: [string, number][];
}

interface Props {
  stats: Stats;
  dateStart: string;
  setDateStart: (v: string) => void;
  dateEnd: string;
  setDateEnd: (v: string) => void;
  logoBase64: string | null;
  currentPage: number;
  setCurrentPage: (v: number) => void;
  isGeneratingPdf: boolean;
  setIsGeneratingPdf: (v: boolean) => void;
  showToast: (msg: string, v?: any) => void;
}

const ITEMS_PER_PAGE = 10;

const StatsTab: React.FC<Props> = ({
  stats, dateStart, setDateStart, dateEnd, setDateEnd,
  logoBase64, currentPage, setCurrentPage,
  isGeneratingPdf, setIsGeneratingPdf, showToast
}) => {
  const exportToExcel = () => {
    const fmtDate = (d: string) => d.split('-').reverse().join('/');
    const now = new Date().toLocaleString('es-PY');
    const totalBreakfast = stats.userList.reduce((a, u) => a + u.breakfastCount, 0);
    const totalLunch = stats.userList.reduce((a, u) => a + u.lunchCount, 0);

    const S: any = {
      title: { font: { bold: true, sz: 16, color: { rgb: 'FFFFFF' } }, fill: { fgColor: { rgb: '2E8B57' } }, alignment: { horizontal: 'center', vertical: 'center' } },
      subtitle: { font: { bold: false, sz: 10, color: { rgb: 'FFFFFF' } }, fill: { fgColor: { rgb: '2E8B57' } }, alignment: { horizontal: 'center', vertical: 'center' } },
      statLabel: { font: { bold: true, sz: 9, color: { rgb: '374151' } }, fill: { fgColor: { rgb: 'D1FAE5' } }, alignment: { horizontal: 'center', vertical: 'center' }, border: { bottom: { style: 'thin', color: { rgb: '6EE7B7' } } } },
      statValue: { font: { bold: true, sz: 12, color: { rgb: '065F46' } }, fill: { fgColor: { rgb: 'ECFDF5' } }, alignment: { horizontal: 'center', vertical: 'center' } },
      colHeader: { font: { bold: true, sz: 9, color: { rgb: 'FFFFFF' } }, fill: { fgColor: { rgb: '2E8B57' } }, alignment: { horizontal: 'center', vertical: 'center' }, border: { top: { style: 'thin' }, bottom: { style: 'medium' }, left: { style: 'thin' }, right: { style: 'thin' } } },
      colHeaderLeft: { font: { bold: true, sz: 9, color: { rgb: 'FFFFFF' } }, fill: { fgColor: { rgb: '2E8B57' } }, alignment: { horizontal: 'left', vertical: 'center' }, border: { top: { style: 'thin' }, bottom: { style: 'medium' }, left: { style: 'thin' }, right: { style: 'thin' } } },
      dataEven: { font: { sz: 9 }, fill: { fgColor: { rgb: 'FFFFFF' } }, alignment: { vertical: 'center' }, border: { top: { style: 'thin', color: { rgb: 'E5E7EB' } }, bottom: { style: 'thin', color: { rgb: 'E5E7EB' } }, left: { style: 'thin', color: { rgb: 'E5E7EB' } }, right: { style: 'thin', color: { rgb: 'E5E7EB' } } } },
      dataOdd: { font: { sz: 9 }, fill: { fgColor: { rgb: 'F0FDF4' } }, alignment: { vertical: 'center' }, border: { top: { style: 'thin', color: { rgb: 'D1FAE5' } }, bottom: { style: 'thin', color: { rgb: 'D1FAE5' } }, left: { style: 'thin', color: { rgb: 'D1FAE5' } }, right: { style: 'thin', color: { rgb: 'D1FAE5' } } } },
      dataCenter: (odd: boolean) => ({ font: { sz: 9 }, fill: { fgColor: { rgb: odd ? 'F0FDF4' : 'FFFFFF' } }, alignment: { horizontal: 'center', vertical: 'center' }, border: { top: { style: 'thin', color: { rgb: odd ? 'D1FAE5' : 'E5E7EB' } }, bottom: { style: 'thin', color: { rgb: odd ? 'D1FAE5' : 'E5E7EB' } }, left: { style: 'thin', color: { rgb: odd ? 'D1FAE5' : 'E5E7EB' } }, right: { style: 'thin', color: { rgb: odd ? 'D1FAE5' : 'E5E7EB' } } } }),
      dataAmount: (odd: boolean) => ({ font: { bold: true, sz: 9, color: { rgb: '065F46' } }, fill: { fgColor: { rgb: odd ? 'F0FDF4' : 'FFFFFF' } }, alignment: { horizontal: 'right', vertical: 'center' }, border: { top: { style: 'thin', color: { rgb: odd ? 'D1FAE5' : 'E5E7EB' } }, bottom: { style: 'thin', color: { rgb: odd ? 'D1FAE5' : 'E5E7EB' } }, left: { style: 'thin', color: { rgb: odd ? 'D1FAE5' : 'E5E7EB' } }, right: { style: 'thin', color: { rgb: odd ? 'D1FAE5' : 'E5E7EB' } } } }),
      totalLabel: { font: { bold: true, sz: 10, color: { rgb: 'FFFFFF' } }, fill: { fgColor: { rgb: '065F46' } }, alignment: { horizontal: 'left', vertical: 'center' }, border: { top: { style: 'medium' }, bottom: { style: 'medium' }, left: { style: 'thin' }, right: { style: 'thin' } } },
      totalCell: { font: { bold: true, sz: 10, color: { rgb: 'FFFFFF' } }, fill: { fgColor: { rgb: '065F46' } }, alignment: { horizontal: 'center', vertical: 'center' }, border: { top: { style: 'medium' }, bottom: { style: 'medium' }, left: { style: 'thin' }, right: { style: 'thin' } } },
      totalAmount: { font: { bold: true, sz: 10, color: { rgb: 'FFFFFF' } }, fill: { fgColor: { rgb: '065F46' } }, alignment: { horizontal: 'right', vertical: 'center' }, border: { top: { style: 'medium' }, bottom: { style: 'medium' }, left: { style: 'thin' }, right: { style: 'thin' } } },
    };

    const aoa: any[][] = [
      ['COOPERATIVA REDUCTO LTDA. — COMEDOR REDUCTO', '', '', '', '', ''],
      ['Reporte de Consumo del Comedor', '', '', '', '', ''],
      [`Período: ${fmtDate(dateStart)} al ${fmtDate(dateEnd)}   |   Generado: ${now}`, '', '', '', '', ''],
      ['', '', '', '', '', ''],
      ['TOTAL PEDIDOS', 'RECAUDACIÓN (Gs.)', 'TICKET PROM. (Gs.)', 'FUNCIONARIOS', 'DESAYUNOS', 'ALMUERZOS'],
      [stats.totalOrders, stats.totalRevenue, Math.round(stats.averageTicket), stats.userList.length, totalBreakfast, totalLunch],
      ['', '', '', '', '', ''],
      ['Funcionario', 'Cédula', 'Desayunos', 'Almuerzos', 'Total Pedidos', 'Total Gasto (Gs.)'],
      ...stats.userList.map(u => [u.name, u.userId, u.breakfastCount, u.lunchCount, u.totalQuantity, u.totalSpent]),
      ['TOTAL PERÍODO', '', totalBreakfast, totalLunch, stats.totalOrders, stats.totalRevenue],
    ];

    const ws = XLSX.utils.aoa_to_sheet(aoa);
    const numRows = aoa.length;
    const dataStart = 8;
    const dataEnd = dataStart + stats.userList.length - 1;

    for (let R = 0; R < numRows; R++) {
      for (let C = 0; C < 6; C++) {
        const ref = XLSX.utils.encode_cell({ r: R, c: C });
        if (!ws[ref]) ws[ref] = { t: 's', v: '' };
        const isOdd = (R - dataStart) % 2 === 1;
        if (R === 0) ws[ref].s = S.title;
        else if (R === 1) ws[ref].s = S.subtitle;
        else if (R === 2) ws[ref].s = S.subtitle;
        else if (R === 4) ws[ref].s = S.statLabel;
        else if (R === 5) ws[ref].s = S.statValue;
        else if (R === 7) ws[ref].s = C === 0 ? S.colHeaderLeft : S.colHeader;
        else if (R >= dataStart && R <= dataEnd) {
          if (C === 0) ws[ref].s = { ...(isOdd ? S.dataOdd : S.dataEven), alignment: { horizontal: 'left', vertical: 'center' } };
          else if (C === 5) ws[ref].s = S.dataAmount(isOdd);
          else ws[ref].s = S.dataCenter(isOdd);
        } else if (R === dataEnd + 1) {
          if (C === 0) ws[ref].s = S.totalLabel;
          else if (C === 5) ws[ref].s = S.totalAmount;
          else ws[ref].s = S.totalCell;
        }
      }
    }

    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 5 } },
      { s: { r: 2, c: 0 }, e: { r: 2, c: 5 } },
      { s: { r: dataEnd + 1, c: 0 }, e: { r: dataEnd + 1, c: 1 } },
    ];
    ws['!rows'] = Array(numRows).fill({ hpt: 16 });
    ws['!rows'][0] = { hpt: 28 };
    ws['!rows'][4] = { hpt: 18 };
    ws['!rows'][5] = { hpt: 22 };
    ws['!rows'][7] = { hpt: 20 };
    ws['!rows'][dataEnd + 1] = { hpt: 20 };
    ws['!cols'] = [{ wch: 38 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 20 }];
    ws['!freeze'] = { xSplit: 0, ySplit: 8 };

    const rankAoa: any[][] = [
      ['RANKING DE PLATOS', ''],
      [`Período: ${fmtDate(dateStart)} al ${fmtDate(dateEnd)}`, ''],
      ['', ''],
      ['Plato / Categoría', 'Porciones'],
      ...stats.dishRanking.map(([name, count]) => [name, count]),
    ];
    const ws2 = XLSX.utils.aoa_to_sheet(rankAoa);
    const rankDataEnd = 4 + stats.dishRanking.length - 1;
    for (let R = 0; R < rankAoa.length; R++) {
      for (let C = 0; C < 2; C++) {
        const ref = XLSX.utils.encode_cell({ r: R, c: C });
        if (!ws2[ref]) ws2[ref] = { t: 's', v: '' };
        const isOdd = (R - 4) % 2 === 1;
        if (R === 0) ws2[ref].s = S.title;
        else if (R === 1) ws2[ref].s = S.subtitle;
        else if (R === 3) ws2[ref].s = C === 0 ? S.colHeaderLeft : S.colHeader;
        else if (R >= 4 && R <= rankDataEnd) {
          ws2[ref].s = C === 1 ? S.dataCenter(isOdd) : { ...(isOdd ? S.dataOdd : S.dataEven), alignment: { horizontal: 'left', vertical: 'center' } };
        }
      }
    }
    ws2['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }, { s: { r: 1, c: 0 }, e: { r: 1, c: 1 } }];
    ws2['!cols'] = [{ wch: 40 }, { wch: 14 }];
    ws2['!rows'] = [{ hpt: 24 }, { hpt: 16 }, { hpt: 8 }, { hpt: 18 }];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, ws, 'Reporte Consumo');
    XLSX.utils.book_append_sheet(workbook, ws2, 'Ranking Platos');
    XLSX.writeFile(workbook, `Reporte_Comedor_${dateStart}_${dateEnd}.xlsx`);
  };

  const handleGeneratePdf = async () => {
    setIsGeneratingPdf(true);
    try {
      const { jsPDF } = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default;
      const fmtGs = (n: number) => `Gs. ${Number(n || 0).toLocaleString('es-PY')}`;
      const GREEN: [number, number, number] = [46, 139, 87];
      const DARK: [number, number, number] = [31, 41, 55];
      const GRAY: [number, number, number] = [107, 114, 128];

      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageW = doc.internal.pageSize.getWidth();
      const headerH = logoBase64 ? 32 : 28;
      doc.setFillColor(...GREEN);
      doc.rect(0, 0, pageW, headerH, 'F');

      if (logoBase64) {
        try {
          const imgFormat = logoBase64.startsWith('data:image/png') ? 'PNG' : 'JPEG';
          doc.addImage(logoBase64, imgFormat, 6, 4, 24, 24);
        } catch (_) { }
      }

      const textX = logoBase64 ? pageW / 2 + 10 : pageW / 2;
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text('COOPERATIVA REDUCTO LTDA.', textX, 11, { align: 'center' });
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Reporte de Consumo del Comedor', textX, 19, { align: 'center' });
      doc.setFontSize(8);
      doc.text(`Período: ${dateStart}  al  ${dateEnd}   |   Generado: ${new Date().toLocaleString('es-PY')}`, textX, 26, { align: 'center' });

      const cards = [
        { label: 'TOTAL PEDIDOS', value: String(stats.totalOrders) },
        { label: 'RECAUDACIÓN', value: fmtGs(stats.totalRevenue) },
        { label: 'TICKET PROMEDIO', value: fmtGs(stats.averageTicket) },
        { label: 'PLATO ESTRELLA', value: stats.topDish },
      ];
      const cardY = headerH + 3;
      const cardW = (pageW - 20) / 4;
      cards.forEach((c, i) => {
        const x = 10 + i * (cardW + 2);
        doc.setFillColor(240, 253, 244);
        doc.roundedRect(x, cardY, cardW, 16, 2, 2, 'F');
        doc.setTextColor(...GREEN);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.text(c.value, x + cardW / 2, cardY + 8, { align: 'center', maxWidth: cardW - 2 });
        doc.setTextColor(...GRAY);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6);
        doc.text(c.label, x + cardW / 2, cardY + 13, { align: 'center' });
      });

      let startY = headerH + 23;

      if (stats.dishRanking.length > 0) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(...DARK);
        doc.text('RANKING DE PLATOS', 10, startY);
        autoTable(doc, {
          startY: startY + 2,
          head: [['#', 'Plato', 'Porciones']],
          body: stats.dishRanking.slice(0, 5).map(([name, count], i) => [i + 1, name, count]),
          theme: 'striped',
          headStyles: { fillColor: GREEN, textColor: [255, 255, 255], fontSize: 8 },
          bodyStyles: { fontSize: 8 },
          columnStyles: { 0: { cellWidth: 10, halign: 'center' }, 2: { halign: 'center' } },
          margin: { left: 10, right: 10 },
        } as any);
        startY = (doc as any).lastAutoTable.finalY + 6;
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(...DARK);
      doc.text(`DETALLE POR FUNCIONARIO  (${stats.userList.length} personas)`, 10, startY);

      autoTable(doc, {
        startY: startY + 2,
        head: [['Nombre', 'C.I.', 'Desayunos', 'Almuerzos', 'Total', 'Monto (Gs.)']],
        body: stats.userList.map(u => [u.name.toUpperCase(), u.userId, u.breakfastCount, u.lunchCount, u.totalQuantity, u.totalSpent.toLocaleString('es-PY')]),
        foot: [['TOTAL GENERAL', '', '', '', stats.totalOrders, stats.totalRevenue.toLocaleString('es-PY')]],
        theme: 'striped',
        headStyles: { fillColor: GREEN, textColor: [255, 255, 255], fontSize: 8, fontStyle: 'bold' },
        bodyStyles: { fontSize: 7.5 },
        footStyles: { fillColor: [240, 253, 244], textColor: GREEN, fontStyle: 'bold', fontSize: 8 },
        columnStyles: { 0: { cellWidth: 60 }, 2: { halign: 'center' }, 3: { halign: 'center' }, 4: { halign: 'center', fontStyle: 'bold' }, 5: { halign: 'right', fontStyle: 'bold', textColor: GREEN } },
        margin: { left: 10, right: 10 },
        showFoot: 'lastPage',
      } as any);

      const totalPages = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(7);
        doc.setTextColor(...GRAY);
        doc.text(`Página ${i} de ${totalPages}  —  Cooperativa Reducto Ltda. Casa Central`, pageW / 2, doc.internal.pageSize.getHeight() - 5, { align: 'center' });
      }

      doc.save(`Reporte_Comedor_${dateStart}_${dateEnd}.pdf`);
    } catch (err) {
      showToast('Error generando PDF', 'error');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="animate-in fade-in">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-[#2E8B57] p-8 rounded-[40px] text-white shadow-lg">
          <p className="text-[10px] font-black uppercase opacity-60">Ingresos</p>
          <p className="text-2xl font-black">Gs. {stats.totalRevenue.toLocaleString()}</p>
        </div>
        <div className="bg-white p-8 rounded-[40px] shadow-sm">
          <p className="text-[10px] font-black uppercase text-gray-400">Pedidos</p>
          <p className="text-2xl font-black text-[#2E8B57]">{stats.totalOrders}</p>
        </div>
        <div className="bg-white p-8 rounded-[40px] shadow-sm">
          <p className="text-[10px] font-black uppercase text-gray-400">Plato Estrella</p>
          <p className="text-xl font-black text-[#2E8B57] truncate">{stats.topDish}</p>
        </div>
        <div className="bg-white p-8 rounded-[40px] shadow-sm flex flex-col justify-center no-print relative z-50">
          <div className="flex gap-2">
            <div className="w-1/2">
              <p className="text-[10px] items-center font-black uppercase text-gray-400 mb-1 pl-2">Desde</p>
              <DatePicker
                selected={new Date(dateStart + 'T00:00:00')}
                onChange={(date) => date && setDateStart(date.toISOString().split('T')[0])}
                locale={es}
                dateFormat="dd/MM/yyyy"
                className="w-full text-xs font-black p-3 bg-gray-50 rounded-xl border-none text-center cursor-pointer hover:bg-gray-100 transition-colors focus:ring-2 focus:ring-[#2E8B57] focus:outline-none"
              />
            </div>
            <div className="w-1/2">
              <p className="text-[10px] items-center font-black uppercase text-gray-400 mb-1 pl-2">Hasta</p>
              <DatePicker
                selected={new Date(dateEnd + 'T00:00:00')}
                onChange={(date) => date && setDateEnd(date.toISOString().split('T')[0])}
                locale={es}
                dateFormat="dd/MM/yyyy"
                className="w-full text-xs font-black p-3 bg-gray-50 rounded-xl border-none text-center cursor-pointer hover:bg-gray-100 transition-colors focus:ring-2 focus:ring-[#2E8B57] focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[50px] shadow-2xl p-10 overflow-x-auto print:shadow-none print:p-0">
        {/* Print header */}
        <div className="hidden print:block mb-6 pt-4 text-center border-b-2 border-dashed border-black pb-6">
          <h1 className="text-3xl font-black uppercase text-black mb-2">{APP_TITLE}</h1>
          <h2 className="text-xl font-bold text-gray-600 tracking-widest uppercase mb-6">Reporte de Consumo</h2>
          <div className="flex justify-between max-w-2xl mx-auto mb-6 bg-gray-50 p-4 rounded-xl border border-gray-200">
            <div className="text-left">
              <p className="text-[10px] font-black uppercase text-gray-400">Desde</p>
              <p className="text-lg font-black text-black">{dateStart.split('-').reverse().join('/')}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black uppercase text-gray-400">Hasta</p>
              <p className="text-lg font-black text-black">{dateEnd.split('-').reverse().join('/')}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 mb-4 text-left max-w-4xl mx-auto">
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
              <p className="text-[10px] font-black uppercase text-gray-400">Total Ingresos</p>
              <p className="text-xl font-black">Gs. {stats.totalRevenue.toLocaleString()}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
              <p className="text-[10px] font-black uppercase text-gray-400">Total Pedidos</p>
              <p className="text-xl font-black">{stats.totalOrders}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
              <p className="text-[10px] font-black uppercase text-gray-400">Plato Estrella</p>
              <p className="text-base font-black truncate">{stats.topDish}</p>
            </div>
          </div>
          <p className="text-[10px] text-gray-400 mt-4 uppercase">Generado el: {new Date().toLocaleString('es-PY')}</p>
        </div>

        <table className="w-full text-left">
          <thead>
            <tr className="text-[10px] font-black uppercase border-b-2 border-black tracking-wider">
              <th className="py-4 pl-4 min-w-[250px]">Funcionario</th>
              <th className="py-4">Cédula</th>
              <th className="py-4 text-center">Desayunos</th>
              <th className="py-4 text-center">Almuerzos</th>
              <th className="py-4 text-center">Total Pedidos</th>
              <th className="py-4 pr-4 text-right">Total (Gs)</th>
            </tr>
          </thead>
          <tbody>
            {stats.userList.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE).map((user, idx) => (
              <tr key={user.userId} className={`border-b border-gray-100 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                <td className="py-4 pl-4 text-xs font-bold text-gray-800 uppercase tracking-wide">{user.name}</td>
                <td className="py-4 text-[10px] text-gray-500 font-mono font-bold">{user.userId}</td>
                <td className="py-4 text-xs font-black text-center text-gray-600">{user.breakfastCount}</td>
                <td className="py-4 text-xs font-black text-center text-gray-600">{user.lunchCount}</td>
                <td className="py-4 text-xs font-black text-center text-gray-800">{user.totalQuantity}</td>
                <td className="py-4 pr-4 text-xs font-black text-right text-[#2E8B57]">{user.totalSpent.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {stats.userList.length > ITEMS_PER_PAGE && (
          <div className="mt-8 flex justify-center items-center gap-4 no-print">
            <button disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)} className={`p-2 rounded-full w-10 h-10 flex items-center justify-center transition-colors ${currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'bg-gray-100 text-[#2E8B57] hover:bg-green-50'}`}>←</button>
            <div className="flex gap-2">
              {Array.from({ length: Math.ceil(stats.userList.length / ITEMS_PER_PAGE) }).map((_, i) => (
                <button key={i} onClick={() => setCurrentPage(i + 1)} className={`w-8 h-8 rounded-full text-[10px] font-black transition-all ${currentPage === i + 1 ? 'bg-[#2E8B57] text-white shadow-md scale-110' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}>{i + 1}</button>
              ))}
            </div>
            <button disabled={currentPage === Math.ceil(stats.userList.length / ITEMS_PER_PAGE)} onClick={() => setCurrentPage(currentPage + 1)} className={`p-2 rounded-full w-10 h-10 flex items-center justify-center transition-colors ${currentPage === Math.ceil(stats.userList.length / ITEMS_PER_PAGE) ? 'text-gray-300 cursor-not-allowed' : 'bg-gray-100 text-[#2E8B57] hover:bg-green-50'}`}>→</button>
          </div>
        )}

        <div className="mt-8 flex justify-end gap-3 no-print">
          <button onClick={exportToExcel} className="bg-green-700 text-white px-6 py-3 rounded-full font-black text-[10px] uppercase hover:bg-green-800 transition-all shadow-md">📊 Excel</button>
          <button disabled={isGeneratingPdf} onClick={handleGeneratePdf} className={`px-6 py-3 rounded-full font-black text-[10px] uppercase transition-all shadow-md flex items-center gap-2 ${isGeneratingPdf ? 'bg-gray-400 cursor-wait text-white' : 'bg-red-600 hover:bg-red-700 text-white'}`}>
            {isGeneratingPdf ? '⏳ GENERANDO...' : '📄 PDF'}
          </button>
          <button onClick={() => window.print()} className="bg-black text-white px-6 py-3 rounded-full font-black text-[10px] uppercase hover:bg-gray-800 transition-all shadow-md">🖨️ Imprimir</button>
        </div>
      </div>
    </div>
  );
};

export default StatsTab;
