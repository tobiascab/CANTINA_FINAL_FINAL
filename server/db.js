const { Sequelize, DataTypes } = require('sequelize');
require('dotenv').config();

// Configuración de la conexión a la base de datos
// Intenta usar variables de entorno, o valores por defecto de XAMPP
const sequelize = new Sequelize(
  process.env.DB_NAME || 'cantina_reducto',
  process.env.DB_USER || 'root',
  process.env.DB_PASS || '',
  {
    host: process.env.DB_HOST || 'localhost',
    dialect: 'mysql',
    logging: false, // Set to console.log to see SQL queries
    port: process.env.DB_PORT || 3306,
    dialectOptions: {
      charset: 'utf8mb4',
    },
    define: {
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci'
    }
  }
);

const User = sequelize.define('User', {
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  password: {
    type: DataTypes.STRING, // En producción debería ir hasheada
    allowNull: true
  },
  role: {
    type: DataTypes.ENUM('admin', 'kitchen', 'user'),
    defaultValue: 'user'
  },
  fullName: {
    type: DataTypes.STRING
  }
});

const Dish = sequelize.define('Dish', {
  id: {
    type: DataTypes.STRING, // Manteniendo string para compatibilidad con IDs existentes
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  basePrice: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  image: {
    type: DataTypes.TEXT('long') // Base64 can be large
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
});

const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  userId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  category: {
    type: DataTypes.STRING, // 'desayuno' | 'almuerzo' | 'combo'
    allowNull: false
  },
  dishName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  },
  total: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  timestamp: {
    type: DataTypes.STRING
  },
  dateIso: {
    type: DataTypes.STRING // YYYY-MM-DD
  },
  isServed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  isPrinted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
});

// Relaciones (opcional si queremos integridad estricta, pero para migración "suave" a veces es mejor dejarlo suelto)
// Por ahora dejamos Order vinculado a Dish solo por nombre o ID implícito para evitar problemas si borran platos.

// Función de inicialización
const initDB = async () => {
  try {
    // Esto crea la base de datos si no existe (requiere permisos, a veces sequelize no lo hace directo sin conectar a 'mysql' db primero)
    // WORKAROUND: Conectarse sin DB y crearla.
    const mysql = require('mysql2/promise');
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASS || '',
      port: process.env.DB_PORT || 3306,
      charset: 'utf8mb4'
    });

    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME || 'cantina_reducto'}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    await connection.end();

    // Ahora sincronizar modelos
    await sequelize.authenticate();
    console.log('Conexión establecida con MySQL.');

    // sync({ alter: true }) actualiza las columnas si cambian en el modelo sin borrar datos
    await sequelize.sync({ alter: true });
    console.log('Base de datos sincronizada (tablas creadas/actualizadas).');

    // Seed completo desde seed-data.json si las tablas están vacías
    const dishCount = await Dish.count();
    const userCount = await User.count();
    const orderCount = await Order.count();

    if (dishCount === 0 || userCount === 0) {
      const fs = require('fs');
      const path = require('path');
      const seedPath = path.join(__dirname, '..', 'data', 'seed-reducto-2025.json');

      if (fs.existsSync(seedPath)) {
        console.log('📦 Cargando datos desde seed-reducto-2025.json...');
        const seedData = JSON.parse(fs.readFileSync(seedPath, 'utf8'));

        // Cargar usuarios
        if (userCount === 0 && seedData.users && seedData.users.length > 0) {
          // Remove sequelize metadata fields
          const cleanUsers = seedData.users.map(u => ({
            username: u.username,
            password: u.password,
            role: u.role,
            fullName: u.fullName
          }));
          await User.bulkCreate(cleanUsers, { ignoreDuplicates: true });
          console.log(`   ✅ ${cleanUsers.length} usuarios cargados`);
        }

        // Cargar platos
        if (dishCount === 0 && seedData.dishes && seedData.dishes.length > 0) {
          const cleanDishes = seedData.dishes.map(d => ({
            id: d.id,
            name: d.name,
            basePrice: d.basePrice,
            image: d.image,
            isActive: d.isActive
          }));
          await Dish.bulkCreate(cleanDishes, { ignoreDuplicates: true });
          console.log(`   ✅ ${cleanDishes.length} platos cargados (con imágenes)`);
        }

        // Cargar pedidos
        if (orderCount === 0 && seedData.orders && seedData.orders.length > 0) {
          const cleanOrders = seedData.orders.map(o => ({
            userId: o.userId,
            category: o.category,
            dishName: o.dishName,
            quantity: o.quantity,
            total: o.total,
            timestamp: o.timestamp,
            dateIso: o.dateIso
          }));
          await Order.bulkCreate(cleanOrders, { ignoreDuplicates: true });
          console.log(`   ✅ ${cleanOrders.length} pedidos cargados`);
        }

        console.log('📦 Seed completo ✓');
      } else {
        // Fallback: crear platos básicos si no existe el seed
        if (dishCount === 0) {
          await Dish.bulkCreate([
            { id: 'puchero', name: 'Puchero Tradicional', basePrice: 15000, image: '', isActive: true },
            { id: 'asado', name: 'Asado a la Olla', basePrice: 25000, image: '', isActive: true }
          ]);
          console.log('Platos iniciales creados (sin seed-data.json).');
        }
      }
    }

  } catch (error) {
    console.error('No se pudo conectar a la base de datos:', error);
  }
};

module.exports = { sequelize, User, Dish, Order, initDB };
