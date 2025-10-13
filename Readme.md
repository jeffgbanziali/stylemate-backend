# 🧠 StyleMate Backend — Fashion Intelligence API

StyleMate est une plateforme intelligente qui apprend les préférences des utilisateurs, analyse leurs vêtements et recommande des tenues personnalisées selon la météo, l’occasion, la saison et le contexte.

## ✨ Fonctionnalités principales

- **Gestion des utilisateurs** : création, authentification, préférences, mesures.
- **Gestion des wardrobes** : ajout, modification, suppression de vêtements.
- **Ingestion de datasets** : import automatique des données Zara, Nike, Kaggle.
- **Préparation des données IA** : génération de jeux d’entraînement pour le moteur IA.
- **Assignation intelligente** : distribution automatique des vêtements selon les profils.
- **API REST sécurisée** : endpoints pour toutes les opérations backend.
- **Intégration IA** : communication directe avec le module stylemate-ai via MongoDB.

---

> Backend officiel du projet **StyleMate**, plateforme d’assistance vestimentaire basée sur l’IA.  
> Ce module gère les utilisateurs, les wardrobes, l’ingestion des datasets (Zara, Nike, Kaggle) et la préparation des données d’entraînement IA.

---

## 🚀 Aperçu

Le backend StyleMate est un serveur **Node.js + Express + TypeScript + MongoDB** qui fournit :
- des **APIs REST sécurisées** pour la gestion des utilisateurs et vêtements,
- des **scripts d’ingestion automatique** de données externes,
- un **mécanisme d’assignation intelligente** des vêtements aux utilisateurs,
- une **passerelle vers le module IA (stylemate-ai)**.

---

## ⚙️ Stack technique

| Composant         | Technologie                       |
|-------------------|-----------------------------------|
| Serveur           | Node.js + Express                 |
| Base de données   | MongoDB (Mongoose ODM)            |
| Langage           | TypeScript                        |
| Auth / Provider   | Email, Google, Apple, Phone, Training |
| Sécurité          | Helmet, CORS, Validation Joi      |
| Outils            | Docker Compose, ts-node, dotenv   |
| Datasets          | Kaggle, Zara, Nike                |
| Communication IA  | MongoDB (collections partagées)   |

---

## 🧩 Structure du projet

```
stylemate-backend/
│
├── src/
│   ├── models/           # Schémas MongoDB (User, WardrobeItem, TrainingData)
│   ├── routes/           # Routes Express
│   ├── controllers/      # Logique métier
│   ├── AItraining/
│   │   ├── datasets/     # Datasets importés (CSV, JSON)
│   │   └── scripts/      # Scripts d’ingestion & génération
│   └── server.ts         # Point d’entrée Express
│
├── .env                  # Variables d'environnement
├── docker-compose.yml    # Services MongoDB et Adminer
└── package.json
```

---

## 📚 Schémas principaux

### 👤 UserForTraining

```ts
{
    email: string;
    username: string;
    preferences: { style: string[]; color: string[] };
    measurements: { height: number; weight: number; chest: number; waist: number; hips: number };
    provider: "email" | "google" | "apple" | "phone" | "training";
}
```

### 👗 WardrobeItemForTraining

```ts
{
    user?: ObjectId;
    name: string;
    category: "top" | "bottom" | "shoes" | "accessory" | "bag" | "outerwear";
    subCategory?: string;
    color?: string;
    pattern?: string;
    material?: string;
    brand?: string;
    season?: "summer" | "winter" | "spring" | "autumn" | "all";
    occasion?: string[];
    temperatureRange?: { min?: number; max?: number };
    weatherSuitability?: string[];
    locationTags?: string[];
    source?: string;
}
```

---

## 🔄 Scripts d’ingestion et préparation

- **Kaggle Dataset** : importe les données du dataset Fashion Product Images (Small)  
    `npm run ingest:kaggle`
- **Nike Dataset** : scrape les produits Nike (Air Force, Dunk, etc.)  
    `npm run scrape:nike`
- **Zara Dataset** : scrape les produits Zara et crée des entrées enrichies  
    `npm run scrape:zara`
- **Assignation automatique des wardrobes** : distribue les vêtements non assignés à chaque utilisateur d’entraînement  
    `npm run assign:wardrobe`

---

## 📦 Fonctionnalités

- Distribution équilibrée entre utilisateurs
- Prise en compte du style & des couleurs préférées
- Répartition dynamique via `bulkWrite` MongoDB

---

## 🧩 Commandes utiles

| Commande                | Action                                 |
|-------------------------|----------------------------------------|
| npm run dev             | Démarre le serveur Express             |
| npm run lint            | Vérifie la qualité du code             |
| npm run build           | Compile TypeScript                     |
| npm run scrape:zara     | Import Zara dataset                    |
| npm run scrape:nike     | Import Nike dataset                    |
| npm run ingest:kaggle   | Import Kaggle dataset                  |
| npm run assign:wardrobe | Distribution auto des wardrobes        |

---

## 📦 Collections MongoDB

| Collection                | Description                                 |
|---------------------------|---------------------------------------------|
| userfortrainings          | Utilisateurs simulés pour l'entraînement IA |
| wardrobeitemfortrainings  | Vêtements issus des datasets                |
| trainingdatas             | Combinaisons générées pour le moteur IA     |

---

## 🧩 Lien avec stylemate-ai

Le backend alimente le module IA en :
- Données TrainingData
- Datasets de référence (Zara, Nike, Kaggle)
- Profils utilisateurs et wardrobes simulés

Le module IA peut ensuite s’y connecter directement via MongoDB.

---

## 👨‍💻 Auteur

Jeff Gbanziali  
EFREI Paris – Master Data Engineering & IA  
📧 gbazialij@gmail.com  
[LinkedIn](#) | [GitHub](#)
