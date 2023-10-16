import aiohttp
import asyncio
import json
import time


# Set your Shopify API key and password.
shopify_api_key = "YOUR_KEY"
shopify_api_password = "YOUR_PASSWORD"
store_url = "YOUR_STORE_URL"
start_time = time.time()

async def fetch_shopify_products():
    limit_per_page = 10
    next_page = f"{store_url}/admin/api/2023-07/products.json?limit={limit_per_page}"
    products = []

    async with aiohttp.ClientSession(auth=aiohttp.BasicAuth(shopify_api_key, shopify_api_password)) as session:
        async def get_products(next_url):
            async with session.get(next_url) as response_products:
                data = await response_products.text()
                products_data = json.loads(data)
                products.extend(products_data["products"])
                link_header = response_products.headers.get("link")

                if link_header:
                    links = link_header.split(",")
                    next_link = next((link.strip() for link in links if 'rel="next"' in link), None)

                    if next_link:
                        next_page = next_link.split("<")[1].split(">")[0]
                        await get_products(next_page)
                    else:
                        process_and_save_products(products)
                else:
                    process_and_save_products(products)

        await get_products(next_page)

def process_and_save_products(products):
    print("Total products fetched:", len(products))

    processed_products = []
    for product in products:
        processed_products.append({
            "id": product["id"],
            "name": product["title"],
            "description": product["body_html"],
            "language": product["published_scope"]
        })

    with open("shopify-products2.json", "w") as file:
        json.dump(processed_products, file, indent=2)

    end_time = time.time()
    elapsed_time = end_time - start_time

    print("Processed products have been saved to shopify-products.json")
    print(f"Elapsed time: {elapsed_time} seconds")

asyncio.run(fetch_shopify_products())