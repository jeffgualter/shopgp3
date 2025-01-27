document.addEventListener("DOMContentLoaded", function () {
    const BACKEND_URL = "https://shopgp3.onrender.com"; // Substitua pelo 
domínio do backend hospedado no Render

    const searchInput = document.getElementById("search-input");
    const searchButton = document.getElementById("search-button");
    const resultsContainer = document.getElementById("results-container");
    const topSearchesContainer = 
document.getElementById("top-searches-container");

    // Função para buscar produtos no backend
    const searchProducts = async (query) => {
        try {
            resultsContainer.innerHTML = `
                <div class="loading-indicator">
                    <div class="spinner"></div>
                    <p>🔄 Buscando as melhores ofertas para você...</p>
                </div>
            `;

            const response = await 
fetch(`${BACKEND_URL}/search?q=${encodeURIComponent(query)}`);
            if (!response.ok) throw new Error("Erro ao buscar produtos no 
servidor");

            const products = await response.json();
            displayResults(query, products);
        } catch (error) {
            resultsContainer.innerHTML = `
                <p>❌ Ocorreu um erro ao buscar os produtos. Por favor, 
tente novamente mais tarde.</p>
            `;
            console.error("Erro ao buscar os produtos:", error);
        }
    };

    // Função para exibir os resultados
    const displayResults = (query, products) => {
        if (!products || products.length === 0) {
            resultsContainer.innerHTML = `
                <p>❌ Nenhuma oferta encontrada para 
"<strong>${query}</strong>".</p>
            `;
            return;
        }

        const resultsHTML = products
            .map(
                (product) => `
                <div class="result-item">
                    <a href="${product.aw_deep_link}" target="_blank">
                        <img src="${product.merchant_image_url}" 
alt="${product.product_name}" class="product-thumb">
                    </a>
                    <div class="product-info">
                        <a href="${product.aw_deep_link}" target="_blank">
                            <h3>${truncateText(product.product_name, 
50)}</h3>
                        </a>
                        <p class="price">💰 R$ 
${product.search_price.toFixed(2)}</p>
                    </div>
                </div>
            `
            )
            .join("");

        resultsContainer.innerHTML = `
            <p>🔎 Essas são as melhores opções disponíveis para 
"<strong>${query}</strong>":</p>
            ${resultsHTML}
        `;
    };

    // Função para exibir os Top Termos de Busca
    const fetchTopSearches = async () => {
        try {
            const response = await fetch(`${BACKEND_URL}/top-searches`);
            if (!response.ok) throw new Error("Erro ao buscar os top 
termos de busca");

            const topSearches = await response.json();

            if (!topSearches || topSearches.length === 0) {
                topSearchesContainer.innerHTML = `
                    <p>Nenhum termo popular encontrado no momento.</p>
                `;
                return;
            }

            const topSearchesHTML = topSearches
                .slice(0, 4) // Limita a exibição aos primeiros 4 itens
                .map(
                    (item) => `
                    <div class="product top-search-item" 
data-term="${item.term}">
                        <img src="${item.product.merchant_image_url}" 
alt="${item.product.product_name}">
                        <h3>${truncateText(item.product.product_name, 
30)}</h3>
                        <p>R$ ${item.product.search_price.toFixed(2)}</p>
                    </div>
                `
                )
                .join("");

            topSearchesContainer.innerHTML = `
                <section class="featured-products">
                    <h2>🔝 Mais Buscados</h2>
                    <div class="products-grid">
                        ${topSearchesHTML}
                    </div>
                </section>
            `;

            // Adicionar eventos de clique para realizar busca com rolagem 
suave para o topo
            const topSearchItems = 
document.querySelectorAll(".top-search-item");
            topSearchItems.forEach((item) => {
                item.addEventListener("click", () => {
                    const term = item.getAttribute("data-term");
                    if (term) {
                        searchProducts(term);
                        
document.getElementById("search-input").scrollIntoView({
                            behavior: "smooth",
                            block: "center",
                        });
                    }
                });
            });
        } catch (error) {
            topSearchesContainer.innerHTML = `
                <p>❌ Ocorreu um erro ao carregar os termos mais 
buscados.</p>
            `;
            console.error("Erro ao buscar os top termos de busca:", 
error);
        }
    };

    // Função utilitária para truncar textos longos
    const truncateText = (text, maxLength) => (text.length > maxLength ? 
text.substring(0, maxLength) + "..." : text);

    // Eventos
    searchButton.addEventListener("click", () => {
        const query = searchInput.value.trim();
        if (query) searchProducts(query);
    });

    searchInput.addEventListener("keypress", (event) => {
        if (event.key === "Enter") {
            event.preventDefault();
            const query = searchInput.value.trim();
            if (query) searchProducts(query);
        }
    });

    // Inicializar carregamento dos Top Termos de Busca ao carregar a 
página
    fetchTopSearches();
});

