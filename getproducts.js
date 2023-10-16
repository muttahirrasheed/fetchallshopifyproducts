const https = require('https');
const fs = require('fs');

// Set your Shopify API key and password.
const shopifyApiKey = "YOUR_KEY";
const shopifyApiPassword = "YOUR_PASSWORD";
const storeUrl = "YOUR_STORE_URL";
const start_time = performance.now();

async function fetchShopifyProducts() {
    const limitPerPage = 10;
    let nextPage = `${storeUrl}/admin/api/2023-07/products.json?limit=${limitPerPage}`;
    const products = [];

    async function fetchPage(pageUrl) {
        return new Promise((resolve, reject) => {
            https.get(pageUrl, { auth: `${shopifyApiKey}:${shopifyApiPassword}` }, (responseProducts) => {
                let data = '';

                responseProducts.on('data', (chunk) => {
                    data += chunk;
                });

                responseProducts.on('end', () => {
                    products.push(...JSON.parse(data).products);
                    const linkHeader = responseProducts.headers.link;

                    if (linkHeader) {
                        const links = linkHeader.split(',');
                        const nextLink = links.find(link => link.includes('rel="next"'));
                        if (nextLink) {
                            const nextPage = nextLink.match(/<(.+?)>/)[1];
                            resolve(fetchPage(nextPage));
                        } else {
                            resolve();
                        }
                    } else {
                        resolve();
                    }
                });
            });
        });
    }

    await fetchPage(nextPage);
    processAndSaveProducts(products);
}

function processAndSaveProducts(products) {
    console.log("Total products fetched:", products.length);

    const processedProducts = products.map(product => ({
        id: product.id,
        name: product.title,
        description: product.body_html,
        language: product.published_scope,
    }));

    fs.writeFileSync('shopify-products.json', JSON.stringify(processedProducts, null, 2), 'utf-8');
    console.log('Processed products have been saved to shopify-products.json');
    const end_time = performance.now();
    const elapsed_time = end_time - start_time;
    console.log(`Elapsed time: ${elapsed_time} milliseconds`);
}

fetchShopifyProducts();
