const express = require("express");
const fs = require("fs");
const path = require("path");
const csvParser = require("csv-parser");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000; // Porta configurável via variável de ambiente

// Habilita CORS para todas as requisições
app.use(cors());

// Diretório com os arquivos CSV
const DATA_DIR = path.join(__dirname, "data");

// Verifica se o diretório de dados existe
if (!fs.existsSync(DATA_DIR)) {
    console.error(`Erro: Diretório de dados '${DATA_DIR}' não encontrado.`);
    process.exit(1);
}

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
                        const price = parseFloat(row.search_price);
                        if (
                            row.product_name &&
                            !isNaN(price) &&
                            row.product_name.toLowerCase().includes(query.toLowerCase())
                        ) {
                            results.push({ ...row, search_price: price });
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
                        console.error(`Erro ao processar o arquivo ${file}:`, error);
                        reject(error);
                    });
            });
        });
    });
};

// Rota para busca
app.get("/search", async (req, res) => {
    const query = req.query.q;
    if (!query) {
        return res.status(400).json({ error: "A consulta 'q' é obrigatória" });
    }

    try {
        console.log(`Consulta recebida: ${query}`);
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

// Inicia o servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});
