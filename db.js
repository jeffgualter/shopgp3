const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('feed_produtos', 'feed_produtos_user', 
'LUndYbcuwxtLIrJkXnj39LfJtOaqHKlq', {
  host: 'dpg-cub7al52ng1s73amrd00-a.oregon-postgres.render.com',
  dialect: 'postgres',
dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: false
        }
    }
});

// Função para testar a conexão
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexão com o banco de dados estabelecida com sucesso.');
  } catch (error) {
    console.error('❌ Erro ao conectar com o banco de dados:', 
error.message);
  }
};

testConnection(); // Testa a conexão ao carregar o arquivo

module.exports = sequelize;

