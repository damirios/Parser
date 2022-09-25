const puppeteer = require('puppeteer');
const fs = require('fs');

const city = 2; // 1 - Москва, 2 - СПБ, 3 - Адыгейская респ. и тд 
const URL = process.argv[2];

if (!URL) {
    throw new Error('You must specify the URL!');
} else {
    async function getProductInfoAndSaveScreenshot() {
        const browser = await puppeteer.launch({
            headless: true,
            defaultViewport: null,
        });
        
        const page = await browser.newPage();
        await page.goto(URL, {waitUntil: 'load'});
        await page.setViewport({width: 1920, height: 1080});
        
        await page.waitForSelector(".FirstHeader_region__lHCGj");
        const change = await page.$('.FirstHeader_region__lHCGj');
        change.click();

        await page.waitForSelector(".Modal_modal__MjGYn").then(elem => console.log('modal loaded'));
        const newCity = await page.$(`.RegionModal_isBold__grgLZ:nth-child(${city})`);
        newCity.click();

        await page.waitForSelector(".FirstHeader_region__lHCGj").then(elem => console.log('page reloaded'));
        await page.reload();
        
        // getting product info
        const result = await page.evaluate( () => {
            let price = document.querySelector('[itemprop="price"]').content;
            
            let oldPrice = '';
            if ( document.querySelector('.Price_role_old__qW2bx') ) {
                oldPrice = document.querySelector('.Price_role_old__qW2bx').textContent.split(' ')[0];

                if ( oldPrice.includes(',') ) {
                    oldPrice = oldPrice.split(',')[0] + '.' + oldPrice.split(',')[1];
                }
            }

            let rating = document.querySelector('[itemprop="ratingValue"]').textContent;

            let reviewCount = document.querySelector('.Summary_reviewsCountContainer__4GijP div .Summary_title__Uie8u')
            .textContent.split('о')[0];

            return {
                price,
                oldPrice,
                rating,
                reviewCount
            }
        });

        fs.open(`./output/product.txt`, 'w', (err) => {
            if (err) {
                throw new Error('File creation error');
            }
        });

        fs.appendFileSync(`./output/product.txt`, `price = ${result.price}\n`, (err) => {
            if (err) {
                throw new Error('Price adding error');
            }
        });

        if (result.oldPrice != '') {
            fs.appendFileSync(`./output/product.txt`, `priceOld = ${result.oldPrice}\n`, (err) => {
                if (err) {
                    throw new Error('Old price adding error');
                }
            });
        }

        fs.appendFileSync(`./output/product.txt`, `rating = ${result.rating}\n`, (err) => {
            if (err) {
                throw new Error('Rating adding error');
            }
        });

        fs.appendFileSync(`./output/product.txt`, `reviewCount = ${result.reviewCount}\n`, (err) => {
            if (err) {
                throw new Error('Review count adding error');
            }
        });

        await saveScreenshot(page, result.title);
        await browser.close();
        console.log(result);
    };

    async function saveScreenshot(page, savePath) {
        await page.setViewport({width: 1920, height: 1080});
        await page.screenshot({path: `./output/screenshot.jpg`});
    };

    getProductInfoAndSaveScreenshot();
}