const puppeteer = require("puppeteer");
const fs = require("fs");

const url = "https://www.mercadolivre.com.br/";
const search = "Iphone 13";

const list = [];

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  console.log("Iniciando IphoneBot...");

  await page.goto(url);
  console.log("Entrando no site...");

  await page.waitForSelector("#cb1-edit");

  await page.type(".nav-search-input", search);
  console.log("Escaneando...");

  await Promise.all([page.waitForNavigation(), page.click(".nav-search-btn")]);
  const links = await page.$$eval(".ui-search-result__image > a", (el) =>
    el.map((linkPage) => linkPage.href)
  );

  for (const linkPage of links) {
    await page.goto(linkPage);
    console.log("Entrando no produto...");
    const title = await page.$eval(
      ".ui-pdp-title",
      (element) => element.textContent
    );
    const price = await page.$eval(
      ".andes-money-amount__fraction",
      (element) => element.textContent
    );
    const quantidade = await page.evaluate(() => {
      const el = document.querySelector(".ui-pdp-buybox__quantity__selected");
      if (!el) return null;
      return el.textContent;
    });
    const link = await page.url();

    const product = { title, quantidade, price, link };
    product.title = title;
    product.price = price;
    product.link = link;
    quantidade ? (product.quantidade = quantidade) : "Não informado";

    function verificaProduct(product) {
      return product.title.toLowerCase().includes(search.toLowerCase());
    }

    if (verificaProduct(product)) {
      list.push(product);
      console.log(product);
    }
  }

  salvarDados();
})();

async function salvarDados() {
  fs.writeFile("dados.json", JSON.stringify(list), "utf8", function (err) {
    if (err) {
      return console.log(err);
    }
    console.log("Os dados foram gravados com sucesso. Veja em './dados.json'");
  });
}


const http = require('http');

const server = http.createServer((req, res) => {
  if (req.url === '/dados') {
    const htmlContent = `
      <html>
        <head>
          <title>Dados Coletados</title>
          
        </head>
        <body>
          <h1>Dados Coletados</h1>
          <ul>
            ${list.map((product) => `<li>${product.title} - R$ ${product.price}<button onclick="window.open('${product.link}')">Entrar na página</button></li>`).join("")}
          </ul>
        </body>
      </html>
    `;

    res.setHeader('Content-Type', 'text/html');
    res.write(htmlContent);
    res.end();
  } else {
    res.statusCode = 404;
    res.end();
  }
});

server.listen(3000, () => {
  console.log('Servidor rodando na porta 3000');
});
