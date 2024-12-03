const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const axios = require('axios');

async function scrapeShopee() {
  const browser = await puppeteer.launch({
    headless: true, 
    args: ['--no-sandbox', '--disable-setuid-sandbox'] // Untuk GitHub Actions
  });
  const page = await browser.newPage();

  // 1. Mengambil data kategori
  await page.goto('https://shopee.co.id/');
  const categories = await page.evaluate(() => {
    const categoryElements = document.querySelectorAll('.home-category-list__category-grid a');
    return Array.from(categoryElements).map(el => ({
      name: el.querySelector('.vvKCN3').innerText,
      url: el.href
    }));
  });

  // 2. Mengambil data produk terlaris dan penjualan per kategori
  const productsData = [];
  for (const category of categories) {
    await page.goto(category.url);
    await page.waitForSelector('.shopee-search-item-result__item'); 

    const $ = cheerio.load(await page.content());
    $('.shopee-search-item-result__item').each((i, el) => {
      const productName = $(el).find('div.ie3A+n b').text();
      const productUrl = $(el).find('a').attr('href');
      const soldCount = $(el).find('div.r6HknA+ div:nth-child(2)').text(); // Perlu penyesuaian selector

      productsData.push({
        category: category.name,
        name: productName,
        url: `https://shopee.co.id${productUrl}`,
        sold: soldCount,
      });
    });
  }

  await browser.close();
  return { categories, products: productsData };
}

scrapeShopee()
  .then(data => {
    console.log(JSON.stringify(data, null, 2));
  })
  .catch(error => {
    console.error('Terjadi kesalahan:', error);
  });
