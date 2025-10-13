import { chromium } from "playwright";
import mongoose from "mongoose";
import WardrobeItemForTraining from "../models/WardrobeItemForTraining";

const MONGO_URI = "mongodb://root:example@localhost:27017/stylemate_training?authSource=admin";

const HMCATEGORIES = [
  { url: "https://www2.hm.com/fr_fr/homme/produits/t-shirts.html", category: "top" },
  { url: "https://www2.hm.com/fr_fr/homme/produits/pantalons.html", category: "bottom" },
  { url: "https://www2.hm.com/fr_fr/homme/produits/vestes-et-manteaux.html", category: "outerwear" },
  { url: "https://www2.hm.com/fr_fr/homme/produits/chaussures.html", category: "shoes" },
  { url: "https://www2.hm.com/fr_fr/homme/produits/accessoires.html", category: "accessory" },
];

async function scrapeHM() {
  await mongoose.connect(MONGO_URI);
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  for (const { url, category } of HMCATEGORIES) {
    console.log(`👕 Scraping H&M: ${category}`);
    await page.goto(url, { waitUntil: "domcontentloaded" });

    const products = await page.$$eval(".hm-product-item", (items, category) =>
      items.map((el) => {
        const name = el.querySelector(".link")?.textContent?.trim();
        const imageUrl = el.querySelector("img")?.src;
        return {
          name,
          category,
          color: "unspecified",
          imageUrl,
          styleTags: ["modern", "casual"],
          material: "unknown",
          season: "all",
          occasion: ["daily"],
          source: "hm",
        };
      }),
      category
    );

    if (products.length) {
      await WardrobeItemForTraining.insertMany(products);
      console.log(`✅ ${products.length} ${category} ajoutés`);
    }
  }

  await browser.close();
  await mongoose.disconnect();
  console.log("🏁 Scraping H&M terminé.");
}

scrapeHM();
