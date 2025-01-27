const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const csv = require('csv-parser');

// Configuração do banco de dados
const pool = new Pool({
  host: 'dpg-cub7al52ng1s73amrd00-a.oregon-postgres.render.com',
  user: 'feed_produtos_user',
  password: 'LUndYbcuwxtLIrJkXnj39LfJtOaqHKlq', // Substitua pela senha real
  database: 'feed_produtos',
  port: 5432,
  ssl: { rejectUnauthorized: false },
});

// Caminho para o diretório de dados
const dadosDir = path.join(__dirname, 'dados');

// Nome do arquivo CSV (atualize conforme necessário)
const csvFile = path.join(dadosDir, 'produtos.csv');

// Função para migrar os dados do CSV para o banco de dados
async function migrarCSVParaDB() {
  try {
    console.log('Iniciando a migração do CSV para o banco de dados...');
    const client = await pool.connect();

    // Abrir o arquivo CSV e processar linha por linha
    const stream = fs.createReadStream(csvFile);
    const produtos = [];

    stream
      .pipe(csv())
      .on('data', (row) => {
        produtos.push(row);
      })
      .on('end', async () => {
        console.log(`${produtos.length} produtos encontrados. Inserindo no banco de dados...`);

        // Inserir os dados na tabela `products`
        for (const produto of produtos) {
          const {
            aw_deep_link,
            product_name,
            merchant_image_url,
            description,
            merchant_category,
            search_price,
          } = produto;

          await client.query(
            `INSERT INTO products (aw_deep_link, product_name, merchant_image_url, description, merchant_category, search_price)
            VALUES ($1, $2, $3, $4, $5, $6)`,
            [aw_deep_link, product_name, merchant_image_url, description, merchant_category, parseFloat(search_price)]
          );
        }

        console.log('Migração concluída com sucesso!');
        client.release();
      })
      .on('error', (err) => {
        console.error('Erro ao processar o arquivo CSV:', err);
        client.release();
      });
  } catch (err) {
    console.error('Erro durante a migração:', err);
  } finally {
    pool.end();
  }
}

// Executar o script
migrarCSVParaDB();
