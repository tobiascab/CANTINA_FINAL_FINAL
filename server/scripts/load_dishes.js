const { initDB, Dish } = require('./db');

const newDishes = [
    { id: 'picadito_carne_arroz', name: 'Picadito de carne / arroz', basePrice: 17000 },
    { id: 'milanesa_arroz_kesu', name: 'Milanesa de carne c/ arroz kesu / ensalada de arroz', basePrice: 20000 },
    { id: 'marinera_poroto', name: 'Marinera c/ ensalada de poroto', basePrice: 20000 },
    { id: 'tarta_acelga', name: 'Tarta de acelga c/ ensalada', basePrice: 16000 },
    { id: 'tallarin_carne', name: 'Tallarín de carne c/ ensalada', basePrice: 17000 },
    { id: 'noquis_carne', name: 'Ñoquis de carne c/ ensalada', basePrice: 17000 },
    { id: 'albondiga_arroz_fideo', name: 'Albóndiga c/ arroz / fideo', basePrice: 17000 },
    { id: 'guiso_arroz_fideo', name: 'Guiso de arroz / fideo c/ ensalada', basePrice: 17000 },
    { id: 'caldo_chipa_guasu', name: 'Caldo de verdura c/ Chipa Guasu', basePrice: 17000 },
    { id: 'arroz_salsa', name: 'Arroz c/ salsa', basePrice: 16000 },
    { id: 'bife_higado', name: 'Bife de Hígado / arroz / puré de papa', basePrice: 18000 },
    { id: 'bife_caballo', name: 'Bife a caballo c/ arroz kesu', basePrice: 22000 },
    { id: 'puchero_mandioca', name: 'Puchero c/ Mandioca (vori-vori) (poroto)', basePrice: 18000 },
    { id: 'matambre', name: 'Matambre', basePrice: 22000 },
    { id: 'asado_olla', name: 'Asado a la olla', basePrice: 22000 },
    { id: 'pollo_horno', name: 'Pollo al horno', basePrice: 18000 },
    { id: 'lomi_pizza', name: 'Lomi pizza', basePrice: 20000 },
    { id: 'salsa_polenta', name: 'Salsa c/ polenta', basePrice: 16000 },
    { id: 'papa_crema', name: 'Papa a la crema', basePrice: 16000 },
    { id: 'soyo_tortilla', name: 'Soyo c/ tortilla', basePrice: 16000 }
];

async function loadDishes() {
    try {
        console.log('Inicializando base de datos...');
        await initDB();

        console.log('\nCargando nuevos platos del menú...\n');

        for (const dish of newDishes) {
            // Buscar si ya existe
            const existing = await Dish.findByPk(dish.id);

            if (existing) {
                // Actualizar precio si cambió
                await existing.update({
                    name: dish.name,
                    basePrice: dish.basePrice,
                    isActive: true
                });
                console.log(`✓ Actualizado: ${dish.name} - Gs. ${dish.basePrice.toLocaleString()}`);
            } else {
                // Crear nuevo plato
                await Dish.create({
                    id: dish.id,
                    name: dish.name,
                    basePrice: dish.basePrice,
                    image: '', // Sin imagen por ahora, se puede agregar desde el panel
                    isActive: true
                });
                console.log(`✓ Creado: ${dish.name} - Gs. ${dish.basePrice.toLocaleString()}`);
            }
        }

        console.log('\n✅ ¡Todos los platos se cargaron correctamente!');
        console.log(`\nTotal de platos en el sistema: ${await Dish.count()}`);
        console.log('\n📝 Nota: Los precios de combo se calculan automáticamente (+5,000 Gs)');
        console.log('🎨 Puedes agregar imágenes desde el Panel de Cocina > Menú del Día');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error al cargar platos:', error);
        process.exit(1);
    }
}

loadDishes();
