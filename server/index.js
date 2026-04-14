const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { initDB, Dish, Order, User } = require('./db');
const { exec } = require('child_process');
const os = require('os');
const { ThermalPrinter, PrinterTypes, CharacterSet, BreakLine } = require('node-thermal-printer');
const bcrypt = require('bcrypt');
const rateLimit = require('express-rate-limit');
const { generateToken, verifyToken, requireAuth, requireAdmin, requireKitchenOrAdmin } = require('./auth');

const SALT_ROUNDS = 10;
const DEFAULT_PASSWORD_PLAIN = 'Reducto2026*/';

// Archivo de configuración de impresora
const PRINTER_CONFIG_PATH = path.join(__dirname, 'printer-config.json');

function loadPrinterConfig() {
    try {
        if (fs.existsSync(PRINTER_CONFIG_PATH)) {
            return JSON.parse(fs.readFileSync(PRINTER_CONFIG_PATH, 'utf8'));
        }
    } catch (e) { /* ignore */ }
    return { interface: 'windows', printerName: '' };
}

function savePrinterConfig(config) {
    fs.writeFileSync(PRINTER_CONFIG_PATH, JSON.stringify(config, null, 2));
}

// Lista impresoras disponibles en Windows usando PowerShell
function listPrinters() {
    return new Promise((resolve) => {
        exec('powershell -NoProfile -Command "Get-Printer | Where-Object { $_.PrinterStatus -eq \'Normal\' } | Select-Object -ExpandProperty Name"', (err, stdout) => {
            if (err) return resolve([]);
            const printers = stdout.split('\n').map(l => l.trim()).filter(Boolean);
            resolve(printers);
        });
    });
}

// Obtiene el nombre de la impresora a usar: la configurada manualmente o auto-detecta la primera disponible
function resolveprinterName() {
    return new Promise(async (resolve) => {
        const config = loadPrinterConfig();
        if (config.printerName) {
            return resolve(config.printerName);
        }
        
        // Auto-detectar: primera impresora con estado Normal
        const printers = await listPrinters();
        if (printers.length > 0) {
            // Auto-guardar la primera impresora encontrada para futuras impresiones
            savePrinterConfig({ interface: 'windows', printerName: printers[0] });
            return resolve(printers[0]);
        }

        // Fallback a wmic si PowerShell falla o no hay 'Normal'
        exec('wmic printer where default=true get name /format:list', (err, stdout) => {
            if (!err) {
                const match = stdout.split('\n').find(l => l.startsWith('Name='));
                if (match) {
                    const name = match.replace('Name=', '').trim();
                    if (name) return resolve(name);
                }
            }
            exec('wmic printer get name /format:list', (err2, stdout2) => {
                if (!err2) {
                    const printers = stdout2
                        .split('\n')
                        .filter(l => l.startsWith('Name='))
                        .map(l => l.replace('Name=', '').trim())
                        .filter(Boolean);
                    if (printers.length > 0) return resolve(printers[0]);
                }
                resolve(null);
            });
        });
    });
}

const app = express();
const PORT = process.env.PORT || 4000;

// CORS: solo permite orígenes configurados
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3050,http://localhost:3000,http://localhost:5173').split(',');
app.use(cors({
    origin: (origin, callback) => {
        // Permite requests sin origin (misma máquina / Electron)
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('CORS: origen no permitido'));
        }
    },
    credentials: true
}));

app.use(express.json({ limit: '10mb' }));

// Rate limiting en login: máx 10 intentos por minuto por IP
const loginLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: 'Demasiados intentos. Espere un momento.' }
});

// Helper de error: no exponer detalles internos en producción
function serverError(res, err) {
    console.error(err);
    const isProd = process.env.NODE_ENV === 'production';
    res.status(500).json({ error: isProd ? 'Error interno del servidor' : err.message });
}

// Verifica contraseña soportando migración plaintext → bcrypt
async function verifyPassword(plain, stored) {
    if (stored && stored.startsWith('$2')) {
        return bcrypt.compare(plain, stored);
    }
    return plain === stored;
}

// Inicializar DB
initDB();

// ==================== RUTAS API ====================

// LOGIN (público, con rate limiting)
app.post('/api/auth/login', loginLimiter, async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ success: false, error: 'Credenciales incompletas' });
        }

        // Admin desde variables de entorno
        const adminUser = process.env.ADMIN_USERNAME || 'admin';
        const adminPass = process.env.ADMIN_PASSWORD || 'admin226118';
        if (username === adminUser && password === adminPass) {
            const token = generateToken({ username: adminUser, role: 'admin', fullName: 'Administrador' });
            return res.json({ success: true, role: 'admin', fullName: 'Administrador', username: adminUser, token });
        }

        const user = await User.findOne({ where: { username } });
        // Mensaje genérico para no revelar si el usuario existe
        if (!user) {
            return res.status(401).json({ success: false, error: 'Credenciales incorrectas' });
        }

        // Detectar contraseña predeterminada
        const storedIsPlain = !(user.password || '').startsWith('$2');
        if (storedIsPlain && password === DEFAULT_PASSWORD_PLAIN && user.password === DEFAULT_PASSWORD_PLAIN) {
            const tempToken = generateToken({ username: user.username, role: user.role, fullName: user.fullName });
            return res.json({ success: false, mustChangePassword: true, username: user.username, fullName: user.fullName, role: user.role, token: tempToken });
        }

        const valid = await verifyPassword(password, user.password);
        if (!valid) {
            return res.status(401).json({ success: false, error: 'Credenciales incorrectas' });
        }

        // Migración al vuelo: hashear si estaba en texto plano
        if (storedIsPlain) {
            user.password = await bcrypt.hash(password, SALT_ROUNDS);
            await user.save();
        }

        const token = generateToken({ username: user.username, role: user.role, fullName: user.fullName });
        res.json({ success: true, role: user.role, fullName: user.fullName, username: user.username, token });
    } catch (error) {
        serverError(res, error);
    }
});

// VERIFY TOKEN
app.get('/api/auth/verify', requireAuth, (req, res) => {
    res.json({ valid: true, user: req.user });
});

// USERS

app.get('/api/users', requireKitchenOrAdmin, async (req, res) => {
    try {
        // Nunca devolver passwords
        const users = await User.findAll({ attributes: ['username', 'fullName', 'role'] });
        res.json(users);
    } catch (error) {
        serverError(res, error);
    }
});

app.post('/api/users/import', requireAdmin, async (req, res) => {
    try {
        const { users } = req.body;
        if (!Array.isArray(users)) return res.status(400).json({ error: 'Se esperaba un array de usuarios' });
        const hashedDefault = await bcrypt.hash(DEFAULT_PASSWORD_PLAIN, SALT_ROUNDS);
        for (const u of users) {
            const username = String(u.CEDULA || u.cedula || '');
            const fullName = String(u.NOMBRE || u.nombre || '');
            if (!username) continue;
            const [user, created] = await User.findOrCreate({
                where: { username },
                defaults: { fullName, password: hashedDefault, role: 'user' }
            });
            if (!created) {
                await user.update({ fullName });
            }
        }
        res.json({ success: true, message: 'Usuarios importados correctamente' });
    } catch (error) {
        serverError(res, error);
    }
});

app.put('/api/users/:username', requireAuth, async (req, res) => {
    try {
        const { username } = req.params;
        const { password } = req.body;

        // Solo admin puede modificar cualquier usuario; usuarios solo a sí mismos
        if (req.user.role !== 'admin' && req.user.username !== username) {
            return res.status(403).json({ error: 'Acceso denegado' });
        }

        const user = await User.findOne({ where: { username } });
        if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

        if (password) {
            if (password.length < 6) return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
            user.password = await bcrypt.hash(password, SALT_ROUNDS);
        }
        await user.save();
        res.json({ success: true, message: 'Usuario actualizado correctamente' });
    } catch (error) {
        serverError(res, error);
    }
});

app.post('/api/users', requireAdmin, async (req, res) => {
    try {
        const { username, fullName, password, role } = req.body;
        if (!username || !fullName) return res.status(400).json({ error: 'Username y fullName son requeridos' });

        const existing = await User.findOne({ where: { username } });
        if (existing) return res.status(400).json({ error: 'El usuario ya existe' });

        const plainPass = password || DEFAULT_PASSWORD_PLAIN;
        const hashedPass = await bcrypt.hash(plainPass, SALT_ROUNDS);

        const newUser = await User.create({ username, fullName, password: hashedPass, role: role || 'user' });
        res.json({ success: true, message: 'Usuario creado correctamente', user: { username: newUser.username, fullName: newUser.fullName, role: newUser.role } });
    } catch (error) {
        serverError(res, error);
    }
});

app.delete('/api/users/:username', requireAdmin, async (req, res) => {
    try {
        const { username } = req.params;
        const user = await User.findOne({ where: { username } });
        if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
        await user.destroy();
        res.json({ success: true, message: 'Usuario eliminado correctamente' });
    } catch (error) {
        serverError(res, error);
    }
});

// DISHES

app.get('/api/dishes', requireAuth, async (req, res) => {
    try {
        const dishes = await Dish.findAll();
        res.json(dishes);
    } catch (error) {
        serverError(res, error);
    }
});

app.post('/api/dishes', requireKitchenOrAdmin, async (req, res) => {
    try {
        const items = Array.isArray(req.body) ? req.body : [req.body];
        for (const item of items) {
            const existing = await Dish.findByPk(item.id);
            if (existing) {
                await existing.update({ name: item.name, basePrice: item.basePrice, image: item.image, isActive: item.isActive });
            } else {
                await Dish.create({ id: item.id, name: item.name, basePrice: item.basePrice, image: item.image, isActive: item.isActive });
            }
        }
        res.json({ success: true, message: 'Platos actualizados' });
    } catch (error) {
        serverError(res, error);
    }
});

app.delete('/api/dishes/:id', requireAdmin, async (req, res) => {
    try {
        await Dish.destroy({ where: { id: req.params.id } });
        res.json({ success: true, message: 'Plato eliminado' });
    } catch (error) {
        serverError(res, error);
    }
});

const imagesDir = path.join(__dirname, 'public', 'dish-images');

app.post('/api/dishes/backup-images', requireAdmin, async (req, res) => {
    try {
        if (!fs.existsSync(imagesDir)) {
            fs.mkdirSync(imagesDir, { recursive: true });
        }
        const dishes = await Dish.findAll();
        let backed = 0;
        let skipped = [];
        for (const dish of dishes) {
            if (dish.image && dish.image.includes('base64,')) {
                const ext = dish.image.match(/data:image\/(\w+);/)?.[1] || 'png';
                if (!['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext)) { skipped.push(dish.name); continue; }
                const base64Data = dish.image.split('base64,')[1];
                const buffer = Buffer.from(base64Data, 'base64');
                const filePath = path.join(imagesDir, `${dish.id}.${ext}`);
                fs.writeFileSync(filePath, buffer);
                backed++;
            } else {
                skipped.push(dish.name);
            }
        }
        res.json({ success: true, message: `${backed} imágenes respaldadas correctamente`, count: backed });
    } catch (error) {
        serverError(res, error);
    }
});

// ORDERS

app.get('/api/orders', requireKitchenOrAdmin, async (req, res) => {
    try {
        const orders = await Order.findAll();
        res.json(orders);
    } catch (error) {
        serverError(res, error);
    }
});

app.get('/api/orders/search', requireKitchenOrAdmin, async (req, res) => {
    try {
        const { dateFrom, dateTo, userId } = req.query;
        const where = {};
        if (dateFrom && dateTo) {
            const { Op } = require('sequelize');
            where.dateIso = { [Op.between]: [dateFrom, dateTo] };
        } else if (dateFrom) {
            const { Op } = require('sequelize');
            where.dateIso = { [Op.gte]: dateFrom };
        }
        if (userId) where.userId = userId;
        const orders = await Order.findAll({ where, order: [['id', 'DESC']], limit: 100 });
        res.json(orders);
    } catch (error) {
        serverError(res, error);
    }
});

app.post('/api/orders', requireAuth, async (req, res) => {
    try {
        const { userId, category, dishName, quantity, total, timestamp, dateIso } = req.body;
        if (!userId || !category || total == null) {
            return res.status(400).json({ error: 'Faltan campos requeridos' });
        }
        const totalNum = Number(total);
        if (isNaN(totalNum) || totalNum < 0) {
            return res.status(400).json({ error: 'El total debe ser un número positivo' });
        }
        const order = await Order.create({ userId, category, dishName, quantity: quantity || 1, total: totalNum, timestamp, dateIso, isPrinted: false });
        res.json(order);
    } catch (error) {
        serverError(res, error);
    }
});

app.patch('/api/orders/:id/serve', requireKitchenOrAdmin, async (req, res) => {
    try {
        const order = await Order.findByPk(req.params.id);
        if (!order) return res.status(404).json({ error: 'Pedido no encontrado' });
        order.isServed = !order.isServed;
        await order.save();
        res.json({ success: true, isServed: order.isServed });
    } catch (error) {
        serverError(res, error);
    }
});

app.delete('/api/orders/all', requireAdmin, async (req, res) => {
    try {
        await Order.destroy({ where: {}, truncate: true });
        res.json({ success: true, message: 'Todos los pedidos han sido eliminados' });
    } catch (error) {
        serverError(res, error);
    }
});

// SYNC
app.post('/api/sync', requireAuth, async (req, res) => {
    try {
        const { dishes, orders } = req.body;
        if (dishes && dishes.length) {
            for (const d of dishes) {
                const existing = await Dish.findByPk(d.id);
                if (existing) await existing.update({ name: d.name, basePrice: d.basePrice, image: d.image, isActive: d.isActive });
                else await Dish.create({ id: d.id, name: d.name, basePrice: d.basePrice, image: d.image, isActive: d.isActive });
            }
        }
        if (orders && orders.length) {
            for (const o of orders) {
                const existing = await Order.findOne({ where: { userId: o.userId, timestamp: o.timestamp } });
                if (!existing) {
                    await Order.create({
                        userId: o.userId, category: o.category,
                        dishName: o.dish ? o.dish.name : null,
                        quantity: o.quantity || 1, total: o.total,
                        timestamp: o.timestamp, dateIso: o.dateIso
                    });
                }
            }
        }
        res.json({ success: true, message: 'Sincronización completa' });
    } catch (error) {
        serverError(res, error);
    }
});

// LOGO
const publicDir = path.join(__dirname, 'public');
if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir);
app.use('/public', express.static(publicDir));

app.post('/api/config/logo', requireAdmin, async (req, res) => {
    try {
        const { image } = req.body;
        if (!image) return res.status(400).json({ error: 'No image provided' });
        const typeMatch = image.match(/^data:image\/(\w+);base64,/);
        if (!typeMatch || !['png', 'jpg', 'jpeg', 'webp'].includes(typeMatch[1])) {
            return res.status(400).json({ error: 'Formato de imagen no permitido. Use PNG, JPG o WEBP.' });
        }
        const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');
        const filePath = path.join(publicDir, 'logo.png');
        fs.writeFileSync(filePath, buffer);
        const logoUrl = `http://localhost:${PORT}/public/logo.png?t=${Date.now()}`;
        res.json({ success: true, logoUrl });
    } catch (error) {
        serverError(res, error);
    }
});

// Marcar pedido como impreso
app.patch('/api/orders/:id/print-status', requireAuth, async (req, res) => {
    try {
        const order = await Order.findByPk(req.params.id);
        if (!order) return res.status(404).json({ error: 'Pedido no encontrado' });
        order.isPrinted = req.body.isPrinted === true;
        await order.save();
        res.json({ success: true, isPrinted: order.isPrinted });
    } catch (error) {
        serverError(res, error);
    }
});

// Pedidos no impresos (para reporte admin)
app.get('/api/orders/unprinted', requireAdmin, async (req, res) => {
    try {
        const orders = await Order.findAll({
            where: { isPrinted: false },
            order: [['id', 'DESC']],
            limit: 200
        });
        res.json(orders);
    } catch (error) {
        serverError(res, error);
    }
});

// IMPRESIÓN TÉRMICA

app.get('/api/printer-config', requireAdmin, (req, res) => {
    res.json(loadPrinterConfig());
});

app.post('/api/printer-config', requireAdmin, (req, res) => {
    try {
        const { printerName, interface: iface } = req.body;
        // Validar que el nombre de impresora no contenga caracteres peligrosos para shell
        if (printerName && /[;&|`$<>"']/.test(printerName)) {
            return res.status(400).json({ error: 'Nombre de impresora inválido' });
        }
        const config = { interface: iface || 'windows', printerName: printerName || '' };
        savePrinterConfig(config);
        res.json({ success: true, message: 'Configuración de impresora guardada', config });
    } catch (e) {
        serverError(res, e);
    }
});

app.post('/api/print/ticket', requireAuth, async (req, res) => {
    try {
        const { appTitle, isReprint, timestamp, userId, fullName, category, dishName, quantity, total, orderId } = req.body;

        const printerName = await resolveprinterName();
        if (!printerName) {
            return res.status(400).json({ error: 'No se encontró ninguna impresora conectada.' });
        }

        // Contar pedidos del usuario (todos, no solo hoy)
        const userOrderCount = await Order.count({ where: { userId } });

        // Obtener nombre real desde la base de datos
        const dbUser = await User.findOne({ where: { username: userId }, attributes: ['fullName'] });
        const resolvedFullName = dbUser?.fullName || fullName || 'SOCIO';

        const printer = new ThermalPrinter({
            type: PrinterTypes.EPSON,
            interface: 'raw',
            characterSet: CharacterSet.PC858_EURO,
            removeSpecialCharacters: false,
            lineCharacter: '-',
            width: 30, // 58mm limit
            breakLine: BreakLine.WORD
        });

        const fmtGs = (n) => `Gs. ${Number(n || 0).toLocaleString('es-PY')}`;
        const MARGIN = '   '; // fix margin cropping

        printer.alignCenter();
        printer.bold(true); // enhance text density
        printer.println('============================');
        printer.setTextDoubleWidth();
        printer.setTextDoubleHeight();
        printer.println((appTitle || 'COMEDOR REDUCTO').toUpperCase());
        printer.setTextNormal();
        printer.bold(true);
        printer.println('Cooperativa Reducto Ltda.');
        printer.println('Casa Central');
        printer.println('============================');

        printer.alignCenter();
        printer.setTextSize(1, 1);
        printer.println(`Pedido Nro. #${orderId || 'S/N'}`);
        printer.setTextNormal();
        printer.bold(true);
        printer.println(`Este es tu pedido #${userOrderCount}!`);

        if (isReprint) {
            printer.invert(true);
            printer.println('  REIMPRESION  ');
            printer.invert(false);
        }

        printer.alignLeft();
        printer.println('----------------------------');

        const printField = (label, value) => {
            const row = `${MARGIN}${label}: ${String(value).substring(0, 18)}`;
            printer.println(row);
        };

        printField('FECHA', timestamp || '');
        printField('C.I', userId || '---');
        printField('NOMB.', resolvedFullName.toUpperCase());

        printer.println('----------------------------');

        printer.setTextSize(0, 1);
        printField('TIPO', String(category || '').toUpperCase());
        printField('PLATO', dishName || '---');
        printField('CANT', quantity || 1);
        printer.setTextNormal();

        printer.alignCenter();
        printer.println('============================');
        printer.println('TOTAL A PAGAR');
        printer.setTextSize(2, 4);
        printer.println(fmtGs(total));
        printer.setTextNormal();
        printer.bold(true);
        printer.println('============================');

        printer.alignLeft();
        printer.println('                            ');
        printer.println('                            ');
        printer.alignCenter();
        printer.println('________________________');
        printer.println('Firma del beneficiario');

        printer.println('............................');
        printer.setTextSize(0, 1);
        printer.println('!Buen provecho!');
        printer.setTextNormal();

        printer.setTextSize(0, 0);
        const now = new Date();
        printer.println(`Impreso: ${now.toLocaleString('es-PY')}`);

        if (isReprint) {
            printer.println('!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
            printer.println(' COPIA - SIN VALIDEZ  ');
            printer.println('!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
        }

        printer.newLine();
        printer.newLine();
        printer.newLine();
        printer.newLine(); 
        // Eliminado el corte de papel para compatibilidad con TM-U220 M188D (sin cortador automático)

        // ============================================================
        // FIN DISEÑO DEL TICKET
        // ============================================================

        const buffer = printer.getBuffer();
        const tmpFile = path.join(os.tmpdir(), `ticket_${Date.now()}.bin`);
        fs.writeFileSync(tmpFile, buffer);

        const psScript = path.join(__dirname, 'raw_print.ps1');
        // Escapar argumentos para PowerShell correctamente
        const escapePSArg = (s) => s.replace(/`/g, '``').replace(/"/g, '`"');
        const psCmd = `powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File "${escapePSArg(psScript)}" -FilePath "${escapePSArg(tmpFile)}" -PrinterName "${escapePSArg(printerName)}"`;

        exec(psCmd, (err) => {
            try { fs.unlinkSync(tmpFile); } catch (_) {}
            if (err) {
                console.error('Error PowerShell:', err.message);
                return res.status(500).json({ error: 'Error al enviar a cola de impresión' });
            }
            res.json({ success: true, message: `Ticket listo en "${printerName}"` });
        });

    } catch (e) {
        serverError(res, e);
    }
});

// ENDPOINT: Devuelve buffer ESC/POS en base64 para impresión desde el cliente (QZ Tray)
app.post('/api/print/ticket/buffer', requireAuth, async (req, res) => {
  try {
    const { appTitle, isReprint, timestamp, userId, fullName, category, dishName, quantity, total, orderId } = req.body;

    const userOrderCount = await Order.count({ where: { userId } });
    const dbUser = await User.findOne({ where: { username: userId }, attributes: ['fullName'] });
    const resolvedFullName = dbUser?.fullName || fullName || 'SOCIO';

    const printer = new ThermalPrinter({
      type: PrinterTypes.EPSON,
      interface: 'tcp://127.0.0.1:9090',
      characterSet: CharacterSet.PC858_EURO,
      removeSpecialCharacters: false,
      lineCharacter: '-',
      breakLine: BreakLine.WORD
    });

    const fmtGs = (n) => `Gs. ${Number(n || 0).toLocaleString('es-PY')}`;

    printer.alignCenter();
    printer.bold(true);
    printer.println('================================');
    printer.setTextDoubleWidth();
    printer.setTextDoubleHeight();
    printer.println((appTitle || 'COMEDOR REDUCTO').toUpperCase());
    printer.setTextNormal();
    printer.bold(true);
    printer.println('Cooperativa Reducto Ltda.');
    printer.bold(false);
    printer.println('Casa Central');
    printer.println('================================');
    printer.setTextSize(1, 1);
    printer.bold(true);
    printer.println(`Pedido Nro. #${orderId || 'S/N'}`);
    printer.setTextNormal();
    printer.bold(false);
    printer.println(`Este es tu pedido numero ${userOrderCount}!`);

    if (isReprint) {
      printer.bold(true);
      printer.invert(true);
      printer.println('  REIMPRESION  ');
      printer.invert(false);
      printer.bold(false);
    }

    printer.alignLeft();
    printer.println('--------------------------------');
    printer.println(`> FECHA: ${timestamp || ''}`);
    printer.println(`> CI: ${userId || '---'}`);
    printer.println(`> NOMBRE: ${resolvedFullName.toUpperCase()}`);
    printer.println('--------------------------------');
    printer.setTextSize(0, 1);
    printer.bold(true);
    printer.println(`* TIPO: ${String(category || '').toUpperCase()}`);
    printer.println(`* PLATO: ${dishName || '---'}`);
    printer.println(`* CANT: ${quantity || 1}`);
    printer.bold(false);
    printer.setTextNormal();
    printer.println('================================');
    printer.alignCenter();
    printer.bold(true);
    printer.println('TOTAL A PAGAR');
    printer.setTextSize(2, 4);
    printer.println(fmtGs(total));
    printer.setTextNormal();
    printer.println('--------------------------------');
    printer.newLine();
    printer.newLine();
    printer.newLine();
    printer.println('________________________');
    printer.println('Firma del beneficiario');
    printer.bold(true);
    printer.println('Buen provecho!');
    printer.bold(false);

    if (isReprint) {
      printer.bold(true);
      printer.println('COPIA - SIN VALIDEZ');
      printer.bold(false);
    }

    printer.newLine();
    printer.cut();

    const buffer = printer.getBuffer();
    res.json({ success: true, buffer: buffer.toString('base64') });

  } catch (e) {
    serverError(res, e);
  }
});

// GET: Configuración actual de la impresora
app.get('/api/printer-config', requireAuth, (req, res) => {
    try {
        const config = loadPrinterConfig();
        res.json(config);
    } catch (error) {
        serverError(res, error);
    }
});

app.post('/api/printer-config', requireAdmin, (req, res) => {
    try {
        savePrinterConfig(req.body);
        res.json({ success: true });
    } catch (error) {
        serverError(res, error);
    }
});

// GET: Listar impresoras disponibles en el sistema (solo las que están online/Normal)
app.get('/api/printers', requireAuth, async (req, res) => {
    const printers = await listPrinters();
    // Fallback si PowerShell falla
    if (printers.length === 0) {
        exec('wmic printer get name /format:list', (err, stdout) => {
            if (err) return res.json({ printers: [] });
            const wmicPrinters = stdout
                .split('\n')
                .filter(l => l.startsWith('Name='))
                .map(l => l.replace('Name=', '').trim())
                .filter(Boolean);
            res.json({ printers: wmicPrinters });
        });
    } else {
        res.json({ printers });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});