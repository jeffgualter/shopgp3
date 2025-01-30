// Importando as dependências
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const csvParser = require('csv-parser');
const path = require('path');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

// Habilita CORS e JSON para todas as requisições
app.use(cors());
app.use(express.json());

// Diretório com os arquivos CSV
const DATA_DIR = path.join(__dirname, "data");

// Objeto para rastrear termos de busca e produtos
const searchTracker = {};

// Função para carregar e buscar dados nos arquivos CSV
const searchCSVFiles = (query) => {
    const results = [];
    return new Promise((resolve, reject) => {
        fs.readdir(DATA_DIR, (err, files) => {
            if (err) return reject(err);

            const csvFiles = files.filter((file) => file.endsWith(".csv"));
            let pendingFiles = csvFiles.length;

            if (pendingFiles === 0) resolve(results);

            csvFiles.forEach((file) => {
                fs.createReadStream(path.join(DATA_DIR, file))
                    .pipe(csvParser())
                    .on("data", (row) => {
                        if (row.product_name && row.product_name.toLowerCase().includes(query.toLowerCase())) {
                            results.push({
                                ...row,
                                search_price: parseFloat(row.search_price || "0"),
                            });
                        }
                    })
                    .on("end", () => {
                        pendingFiles -= 1;
                        if (pendingFiles === 0) {
                            results.sort((a, b) => b.search_price - a.search_price); // Ordenar por preço (maior para menor)
                            resolve(results);
                        }
                    })
                    .on("error", (error) => {
                        reject(error);
                    });
            });
        });
    });
};

// Rota para busca no CSV
app.get("/search", async (req, res) => {
    const query = req.query.q;
    if (!query) {
        return res.status(400).json({ error: "A consulta 'q' é obrigatória" });
    }

    try {
        const results = await searchCSVFiles(query);

        // Rastrear buscas e armazenar o produto mais caro
        if (results.length > 0) {
            const topProduct = results[0]; // Produto com maior preço
            searchTracker[query] = searchTracker[query]
                ? topProduct.search_price > searchTracker[query].search_price
                    ? topProduct
                    : searchTracker[query]
                : topProduct;
        }

        res.json(results);
    } catch (error) {
        console.error("Erro ao buscar produtos:", error);
        res.status(500).json({ error: "Erro interno ao buscar produtos" });
    }
});

// Rota para obter os termos mais buscados
app.get("/top-searches", (req, res) => {
    const topSearches = Object.entries(searchTracker)
        .map(([term, product]) => ({
            term,
            product: {
                ...product,
                search_price: parseFloat(product.search_price),
            },
        }))
        .sort((a, b) => b.product.search_price - a.product.search_price) // Ordenar pelos produtos mais caros
        .slice(0, 5); // Limitar aos 5 principais

    res.json(topSearches);
});

// Configuração da conexão com o banco de dados
const pool = new Pool({
    user: 'feed_produtos_user', // Substitua pelo usuário do banco na Render
    host: 'dpg-cub7al52ng1s73amrd00-a.oregon-postgres.render.com', // Host do banco na Render
    database: 'feed_produtos', // Nome do banco
    password: 'LUndYbcuwxtLIrJkXnj39LfJtOaqHKlq', // Substitua pela senha do banco
    port: 5432,
    ssl: { rejectUnauthorized: false }, // Configuração necessária para a Render
});

// Verifica a conexão com o banco de dados
pool.connect()
    .then(() => console.log("Conectado ao banco de dados com sucesso!"))
    .catch(err => console.error("Erro ao conectar ao banco de dados:", err));

// Rota de pesquisa de produtos no banco de dados
app.get('/produtos/pesquisa', async (req, res) => {
    const { q } = req.query; // Obtém o termo de pesquisa como 'q'

    if (!q) {
        return res.status(400).json({ error: 'Por favor, forneça um termo de pesquisa.' });
    }

    try {
        const result = await pool.query(
            "SELECT * FROM products WHERE name ILIKE $1",
            [`%${q}%`]
        );

        res.json(result.rows);
    } catch (error) {
        console.error('Erro ao buscar produtos no banco:', error);
        res.status(500).json({ error: 'Erro ao buscar produtos no banco.' });
    }
});

// Rota para "Top Buscas" (exemplo: produtos mais consultados)
app.get('/produtos/top', async (req, res) => {
    try {
        // Exemplo básico de top buscas: produtos com maior preço
        const result = await pool.query(
            "SELECT * FROM products ORDER BY price DESC LIMIT 10"
        );

        res.json(result.rows);
    } catch (error) {
        console.error('Erro ao buscar top produtos:', error);
        res.status(500).json({ error: 'Erro ao buscar top produtos.' });
    }
});

// Inicializando o servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});

