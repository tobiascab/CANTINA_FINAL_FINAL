require('dotenv').config({ path: __dirname + '/.env' });
const { Dish } = require('./db.js');
const { Order } = require('./db.js');

async function test() {
    const dishes = await Dish.findAll();
    console.log("== DISHES ==");
    console.log(dishes.map(d => `${d.name}: isActive=${d.isActive}`).join('\n'));

    const unprinted = await Order.findAll({ limit: 1, order: [['id', 'DESC']] });
    console.log("== LAST ORDER ==");
    console.log(JSON.stringify(unprinted, null, 2));

    process.exit(0);
}
test();
