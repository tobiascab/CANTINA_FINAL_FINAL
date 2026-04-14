require('dotenv').config({ path: __dirname + '/.env' });
const { User } = require('./db.js');

async function test() {
    const users = await User.findAll();
    users.forEach(u => console.log(`${u.username}: ${u.role} (name: ${u.fullName})`));
    process.exit(0);
}
test();
