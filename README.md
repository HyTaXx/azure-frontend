# BayrouMeter — Documentation

## **Architecture**
- **Frontend statique**: `index.html`, `style.css`, `app.js` hébergés sur Azure Static Web Apps.
- **Backend**: Azure Functions exposant des endpoints REST publics (protégés par une clé `code`).
- **Secret client**: la clé d’API (Azure Function key) est injectée dans `key.js` au build via GitHub Actions.
- **Appel réseau**: le frontend appelle l’API Functions en HTTPS via `fetch`.

```mermaid
flowchart LR
  U[Utilisateur] -->|Navigateur| FE[Azure Static Web Apps\n(index.html, app.js, style.css, key.js)]
  FE -->|HTTPS fetch| API[Azure Functions\nhttps://bayroumeter-func-arm.azurewebsites.net/api]
```

Explications rapides:
- Le site est purement statique; aucun serveur applicatif à maintenir côté frontend.
- Les actions (création d’utilisateur, vote, récupération des résultats) transitent par l’API Azure Functions.
- En CI/CD, le workflow GitHub crée un fichier `key.js` contenant `window.API_KEY='…'` depuis le secret `AZURE_FUNCTION_KEY` afin que le frontend puisse appeler les endpoints protégés par `?code=`.

## **Endpoints (API REST)**
Base: `https://bayroumeter-func-arm.azurewebsites.net/api`

- **Créer un utilisateur**: POST `/user?code={FUNCTION_KEY}`
  - Corps JSON: `{ "pseudo": string, "email": string }`
  - Réponse 200: `{ "id": string, ... }` (le champ `id` est utilisé par le frontend)
  - Ex. curl:
    ```bash
    curl -X POST \
      -H "Content-Type: application/json" \
      -d '{"pseudo":"alice","email":"alice@example.com"}' \
      "https://bayroumeter-func-arm.azurewebsites.net/api/user?code=YOUR_KEY"
    ```

- **Voter**: POST `/vote?code={FUNCTION_KEY}`
  - Corps JSON: `{ "userId": string, "choice": "Oui" | "Non" }`
  - Réponse 200: corps vide ou JSON de confirmation.
  - Ex. curl:
    ```bash
    curl -X POST \
      -H "Content-Type: application/json" \
      -d '{"userId":"<id_utilisateur>","choice":"Oui"}' \
      "https://bayroumeter-func-arm.azurewebsites.net/api/vote?code=YOUR_KEY"
    ```

- **Lister résultats**: GET `/votes?code={FUNCTION_KEY}`
  - Réponse 200 (exemple attendu par le frontend):
    ```json
    {
      "total": number,
      "yes": number,
      "no": number,
      "pctYes": number,
      "items": [ { "userId": string, "choice": "Oui" | "Non" } ]
    }
    ```
  - Ex. curl:
    ```bash
    curl "https://bayroumeter-func-arm.azurewebsites.net/api/votes?code=YOUR_KEY"
    ```

Notes:
- Tous les endpoints nécessitent le paramètre de requête `?code=` (Azure Function key).
- Le frontend récupère cette clé via `window.API_KEY` défini dans `key.js`.

## **Exécution et tests en local**
Prérequis: un navigateur moderne. Pour servir les fichiers localement, vous pouvez utiliser Python ou Node (au choix).

1) Cloner le dépôt
```bash
git clone <repo_url>
cd frontend-azure
```

2) Créer le fichier `key.js` à la racine du projet
```js
// key.js
window.API_KEY = "VOTRE_CLE_FONCTION_AZURE";
```
- En CI, ce fichier est généré par le workflow GitHub à partir du secret `AZURE_FUNCTION_KEY` (voir `.github/workflows/*.yml`).

3) Lancer un petit serveur statique (option A ou B)
- Option A (Python 3):
  ```bash
  python3 -m http.server 5173
  # Ouvrir http://localhost:5173/
  ```
- Option B (Node, via npx serve):
  ```bash
  npx serve -l 5173 .
  # Ouvrir http://localhost:5173/
  ```

4) Tester manuellement
- Saisir un pseudo et un email, cliquer « Enregistrer ».
- Voter « Oui » ou « Non » puis « Voter ».
- Cliquer « Rafraîchir » pour voir les stats et la liste des votes.

Dépannage:
- Si les appels API échouent pour cause de CORS, ajoutez l’origine `http://localhost:5173` (ou votre port) dans la configuration CORS de votre Azure Functions App.
- Assurez-vous que `key.js` est bien chargé par `index.html` et que la valeur `window.API_KEY` est correcte.

## **CI/CD**
- Workflow: `.github/workflows/azure-static-web-apps-*.yml`
  - Injecte `key.js` depuis `AZURE_FUNCTION_KEY`.
  - Déploie le contenu statique sur Azure Static Web Apps (`app_location: /`, `output_location: .`).

## **Structure du projet**
- `index.html`: page et structure de l’UI.
- `style.css`: styles de base.
- `app.js`: logique d’appel à l’API et rendu des résultats.
- `key.js`: exposé au navigateur; doit définir `window.API_KEY`.
