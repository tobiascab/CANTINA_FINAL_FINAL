const { initDB, Dish, Order, User, sequelize } = require('../db');
const fs = require('fs');
const path = require('path');

async function runSeed() {
    try {
        console.log('🚀 Iniciando proceso de seed forzado...');
        await initDB();

        // Esperar un momento para asegurar la conexión
        await new Promise(r => setTimeout(r, 1000));

        const seedPath = path.join(__dirname, '..', '..', 'data', 'seed-reducto-2025.json');

        if (!fs.existsSync(seedPath)) {
            console.error(`❌ Error: El archivo seed no existe en: ${seedPath}`);
            process.exit(1);
        }

        console.log(`📦 Leyendo datos desde ${seedPath}...`);
        const seedData = JSON.parse(fs.readFileSync(seedPath, 'utf8'));

        // LIMPIAR TABLAS (OPCIONAL - Pero recomendado para un seed "fresco")
        console.log('⚠️ Limpiando tablas existentes para evitar duplicados...');
        await Order.destroy({ where: {}, truncate: { cascade: true } });
        await Dish.destroy({ where: {}, truncate: { cascade: true } });
        await User.destroy({ where: {}, truncate: { cascade: true } });

        // CARGAR USUARIOS
        if (seedData.users && seedData.users.length > 0) {
            const cleanUsers = seedData.users.map(u => ({
                username: u.username,
                password: u.password,
                role: u.role,
                fullName: u.fullName
            }));
            await User.bulkCreate(cleanUsers);
            console.log(`   ✅ ${cleanUsers.length} usuarios cargados`);
        }

        // CARGAR PLATOS
        if (seedData.dishes && seedData.dishes.length > 0) {
            const cleanDishes = seedData.dishes.map(d => ({
                id: d.id,
                name: d.name,
                basePrice: d.basePrice,
                image: d.image,
                isActive: d.isActive
            }));
            await Dish.bulkCreate(cleanDishes);
            console.log(`   ✅ ${cleanDishes.length} platos cargados (con imágenes)`);
        }

        // CARGAR PEDIDOS
        if (seedData.orders && seedData.orders.length > 0) {
            const cleanOrders = seedData.orders.map(o => ({
                userId: o.userId,
                category: o.category,
                dishName: o.dishName,
                quantity: o.quantity || 1,
                total: o.total,
                timestamp: o.timestamp,
                dateIso: o.dateIso
            }));
            await Order.bulkCreate(cleanOrders);
            console.log(`   ✅ ${cleanOrders.length} pedidos cargados`);
        }

        console.log('\n✨ Proceso de seed completado exitosamente.');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error durante el seed:', error);
        process.exit(1);
    }
}

runSeed();
