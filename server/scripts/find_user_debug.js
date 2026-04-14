const { Sequelize, DataTypes } = require('sequelize');
require('dotenv').config();

const findUserOnPort = async (port) => {
    console.log(`Trying port ${port}...`);
    const sequelize = new Sequelize(
        process.env.DB_NAME || 'cantina_reducto',
        process.env.DB_USER || 'root',
        process.env.DB_PASS || '',
        {
            host: process.env.DB_HOST || 'localhost',
            dialect: 'mysql',
            logging: false,
            port: port,
        }
    );

    const User = sequelize.define('User', {
        username: { type: DataTypes.STRING },
        password: { type: DataTypes.STRING },
        fullName: { type: DataTypes.STRING }
    }, { tableName: 'Users' });

    try {
        const user = await User.findOne({ where: { username: '6737517' } });
        if (user) {
            console.log(`User found on port ${port}:`, JSON.stringify(user, null, 2));
            return true;
        } else {
            console.log(`User 6737517 not found on port ${port}.`);
        }
    } catch (error) {
        console.error(`Error on port ${port}:`, error.message);
    } finally {
        await sequelize.close();
    }
    return false;
};

async function main() {
    const success3307 = await findUserOnPort(3307);
    if (!success3307) {
        await findUserOnPort(3306);
    }
    process.exit();
}

main();
