import { chromium } from "playwright";
import mongoose from "mongoose";
import WardrobeItemForTraining from "../models/WardrobeItemForTraining";

const MONGO_URI = "mongodb://root:example@localhost:27017/stylemate_training?authSource=admin";

const SHEINCATEGORIES = [
  { url: "https://fr.shein.com/Men-Tops-c-1860.html", category: "top" },
  { url: "https://fr.shein.com/Men-Pants-c-1864.html", category: "bottom" },
  { url: "https://fr.shein.com/Men-Jackets-Coats-c-1866.html", category: "outerwear" },
  { url: "https://fr.shein.com/Men-Shoes-c-1868.html", category: "shoes" },
  { url: "https://fr.shein.com/Men-Accessories-c-1870.html", category: "accessory" },
];

async function scrapeShein() {
  await mongoose.connect(MONGO_URI);
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  for (const { url, category } of SHEINCATEGORIES) {
    console.log(`👕 Scraping Shein: ${category}`);
    await page.goto(url, { waitUntil: "domcontentloaded" });

    const products = await page.$$eval(".S-product-item", (items, category) =>
      items.slice(0, 50).map((el) => {
        const name = el.querySelector(".S-product-item__name")?.textContent?.trim();
        const imageUrl = el.querySelector("img")?.src;
        return {
          name,
          category,
          color: "unspecified",
          imageUrl,
          styleTags: ["trendy", "modern"],
          material: "unknown",
          season: "all",
          occasion: ["daily"],
          source: "shein",
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
  console.log("🏁 Scraping Shein terminé.");
}

scrapeShein();
