const fs = require('fs');
const { sequelize, User, Dish, Order } = require('./db.js');
async function run() {
    await sequelize.authenticate();
    const seed = JSON.parse(fs.readFileSync('../data/seed-reducto-2025.json'));
    let u=0;
    for (const user of seed.users) {
        await User.upsert(user);
        u++;
    }
    console.log(`Usuarios cargados: ${u}`);
    let d=0;
    for (const dish of seed.dishes) {
        await Dish.upsert(dish);
        d++;
    }
    console.log(`Platos cargados: ${d}`);
    process.exit(0);
}
run();