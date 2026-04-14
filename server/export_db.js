/**
 * Script para exportar TODA la base de datos a un archivo JSON seed
 * Ejecutar: node export_db.js
 */
const { initDB, Dish, Order, User } = require('./db');

async function exportAll() {
    await initDB();

    // Wait a bit for DB to be ready
    await new Promise(r => setTimeout(r, 2000));

    const users = await User.findAll({ raw: true });
    const dishes = await Dish.findAll({ raw: true });
    const orders = await Order.findAll({ raw: true });

    const data = {
        exportDate: new Date().toISOString(),
        users,
        dishes: dishes.map(d => ({
            ...d,
            // Keep image data but trim if needed for display
            image: d.image // Keep full base64
        })),
        orders
    };

    const fs = require('fs');
    const path = require('path');

    const outputPath = path.join(__dirname, '..', 'data', 'seed-reducto-2025.json');
    fs.writeFileSync(outputPath, JSON.stringify(data, null, 2), 'utf8');

    console.log(`\n✅ Exportación completa:`);
    console.log(`   - Usuarios: ${users.length}`);
    console.log(`   - Platos: ${dishes.length}`);
    console.log(`   - Pedidos: ${orders.length}`);
    console.log(`   - Archivo: ${outputPath}`);
    console.log(`   - Tamaño: ${(fs.statSync(outputPath).size / 1024 / 1024).toFixed(2)} MB`);

    process.exit(0);
}

exportAll().catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
