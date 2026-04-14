/**
 * AGENTE DE IMPRESION LOCAL - Cantina Reducto
 * ============================================
 * Corre en la PC de la cantina en localhost:9100
 * El sistema web envia los datos del ticket aqui
 * y este agente imprime DIRECTAMENTE en la TM-U220
 * sin ningun dialogo de Windows.
 *
 * Para iniciar: node print-agent.js
 */

const http = require('http');
const { exec } = require('child_process');
const os   = require('os');
const fs   = require('fs');
const path = require('path');

const PORT = 9100;

// ─── HTTP Server ────────────────────────────────────────────────────────────
const server = http.createServer((req, res) => {
  // CORS - permite llamadas desde cualquier origen (el sistema web)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return; }

  // GET /status - para que el sistema web verifique si el agente esta corriendo
  if (req.method === 'GET' && req.url === '/status') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, message: 'Agente de impresion activo', printer: 'TM-U220' }));
    return;
  }

  // POST /print - recibe los datos del ticket y lo imprime
  if (req.method === 'POST' && req.url === '/print') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      try {
        const ticket = JSON.parse(body);
        console.log(`[${new Date().toLocaleTimeString()}] Imprimiendo ticket #${ticket.orderId} para ${ticket.fullName}`);
        printTicket(ticket, res);
      } catch (e) {
        console.error('Error parseando ticket:', e.message);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'JSON invalido: ' + e.message }));
      }
    });
    return;
  }

  res.writeHead(404); res.end('Not found');
});

// ─── Impresion directa con PowerShell ───────────────────────────────────────
function printTicket(ticket, res) {
  const text   = buildTicketText(ticket);
  const tmpTxt = path.join(os.tmpdir(), `cantina_${Date.now()}.txt`);

  fs.writeFileSync(tmpTxt, text, 'utf8');

  // Detectar el nombre exacto de la impresora TM-U220 instalada
  const psGetPrinter = `(Get-Printer | Where-Object { $_.Name -like '*TM*U220*' -or $_.Name -like '*TM-U220*' } | Select-Object -First 1 -ExpandProperty Name)`;
  
  const psCmd = `powershell -NoProfile -Command "` +
    `$printer = ${psGetPrinter}; ` +
    `if (-not $printer) { $printer = (Get-Printer | Select-Object -First 1 -ExpandProperty Name) }; ` +
    `Write-Host ('Imprimiendo en: ' + $printer); ` +
    `Get-Content '${tmpTxt.replace(/\\/g, '\\\\')}' | Out-Printer -Name $printer` +
    `"`;

  exec(psCmd, (err, stdout, stderr) => {
    // Limpiar archivo temporal
    try { fs.unlinkSync(tmpTxt); } catch (_) {}

    if (err) {
      console.error('Error de impresion:', stderr || err.message);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: stderr || err.message }));
    } else {
      console.log(`[OK] Ticket #${ticket.orderId} impreso. ${stdout.trim()}`);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true }));
    }
  });
}

// ─── Formato de texto para la TM-U220 ───────────────────────────────────────
function buildTicketText(t) {
  const LINE  = '--------------------------------';
  const fmtGs = (n) => `Gs. ${Number(n || 0).toLocaleString('es-PY')}`;
  const center = (str, width = 32) => {
    const pad = Math.max(0, Math.floor((width - str.length) / 2));
    return ' '.repeat(pad) + str;
  };
  const row = (label, value, width = 32) => {
    const space = width - label.length - String(value).length;
    return label + ' '.repeat(Math.max(1, space)) + value;
  };

  const lines = [
    center('COMEDOR REDUCTO'),
    center('Cooperativa Reducto Ltda.'),
    center('Casa Central'),
    LINE,
    center(`Pedido Nro. #${t.orderId || 'S/N'}`),
  ];

  if (t.isReprint) lines.push(center('[  REIMPRESION  ]'));

  lines.push(
    LINE,
    `FECHA: ${t.timestamp}`,
    `CI:    ${t.userId}`,
    `NOMBRE: ${String(t.fullName || '').toUpperCase()}`,
    LINE,
    row('TIPO:', String(t.category || '').toUpperCase()),
    row('PLATO:', String(t.dishName || 'DESAYUNO')),
    row('CANT:', String(t.quantity || 1)),
    LINE,
    center('TOTAL A PAGAR'),
    center(fmtGs(t.total)),
    '',
    '',
    '_'.repeat(32),
    center('Firma del beneficiario'),
    '',
    center('¡Buen provecho!'),
    '',
    `Impreso: ${new Date().toLocaleString('es-PY')}`,
    '\n\n\n'  // Avance de papel al final
  );

  return lines.join('\n');
}

// ─── Arranque ────────────────────────────────────────────────────────────────
server.listen(PORT, '127.0.0.1', () => {
  console.log('');
  console.log('=======================================');
  console.log('  AGENTE DE IMPRESION - Cantina Reducto');
  console.log('=======================================');
  console.log(`  Escuchando en: http://localhost:${PORT}`);
  console.log('  Estado: ACTIVO');
  console.log('  No cierres esta ventana.');
  console.log('=======================================');
  console.log('');
});

server.on('error', (e) => {
  if (e.code === 'EADDRINUSE') {
    console.error(`ERROR: El puerto ${PORT} ya esta en uso. El agente ya puede estar corriendo.`);
  } else {
    console.error('Error del servidor:', e.message);
  }
  process.exit(1);
});
