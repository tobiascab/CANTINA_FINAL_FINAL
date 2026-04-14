const { User } = require('./db');

async function findUser() {
    try {
        const user = await User.findOne({ where: { username: '6737517' } });
        if (user) {
            console.log('User found:', JSON.stringify(user, null, 2));
        } else {
            console.log('User 6737517 not found.');
        }
    } catch (error) {
        console.error('Error finding user:', error);
    } finally {
        process.exit();
    }
}

findUser();
