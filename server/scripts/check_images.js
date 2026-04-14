const { initDB, Dish } = require('./db');

(async () => {
    await initDB();
    await new Promise(r => setTimeout(r, 2000));

    const dish = await Dish.findByPk('guiso_arroz_fideo', { raw: true });
    if (dish) {
        console.log('ID:', dish.id);
        console.log('Name:', dish.name);
        console.log('Image length:', dish.image ? dish.image.length : 0);
        console.log('Image starts with:', dish.image ? dish.image.substring(0, 80) : 'EMPTY');
        console.log('Has base64 comma:', dish.image ? dish.image.includes('base64,') : false);
        console.log('Starts with data:image:', dish.image ? dish.image.startsWith('data:image') : false);
    } else {
        console.log('Dish not found');
    }

    process.exit(0);
})();
