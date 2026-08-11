# Soccer-duty

-----------------------------------------------------------------------------------------------
POUR MIEUX LIRE LE DOCUMENT, CLIQUE DROIT SUR LE FICHIER README.MD ET CLIQUE SUR "OPEN PREVIEW"
-----------------------------------------------------------------------------------------------

## Serveur local backend

cd backend

.\venv\Scripts\activate

uvicorn main:app --reload

## Serveur local frontend

cd frontend

npm run dev

## Plugins 

SQLite Viewer : pour visu BDD

## DB browser for SQLite 

https://sqlitebrowser.org/dl/

64bit for windows


-------------- POUR NOAH -----------------

## 0. Récuperer le travail d'Enzo

Avant même de commencer a travailler, récupère le travail pour éviter de futurs conflits. ATTENTION : soit bien sur ta branche.

```bash
  git pull origin preprod
  ```

  Généralement la branche la plus à jour sera preprod, si ce n'est pas le cas, demande à Enzo.

## 1. Créer une nouvelle branche (pour travailler en sécurité)
Ne code jamais directement sur la branche principale (`main` ou `master`). Crée une branche à ton nom ou pour ta fonctionnalité.

* **Via VS Code :** 
  1. Clique sur le nom de ta branche actuelle en bas à gauche de la fenêtre VS Code (ou fais `Ctrl+Shift+P` / `Cmd+Shift+P` et tape **Git: Checkout to...**).
  2. Sélectionne **Create new branch...**.
  3. Donne-lui un nom (ex: `dev/aiden`) et appuie sur Entrée.
* **Via le terminal :** 
  ```bash
  git checkout -b dev/aiden
  ```

---

## 2. Sauvegarder son travail au fur et à mesure (Le Commit)
Quand tu as fini une petite partie de ton code et qu'elle fonctionne :

* **Via VS Code :**
  1. Va dans l'onglet **Source Control** (l'icône de branches sur le menu de gauche, ou `Ctrl+Shift+G` / `Cmd+Shift+G`).
  2. Sur les fichiers modifiés, clique sur le bouton **`+`** (Staged Changes) pour les préparer.
  3. Écris un court message dans la case en haut (ex: *"Ajout du menu de navigation"*).
  4. Clique sur le bouton bleu **Commit**.
* **Via le terminal :**
  ```bash
  git add .
  git commit -m "Ajout du menu de navigation"
  ```

---

## 3. Envoyer son travail sur le serveur (Le Push)
Pour sauvegarder ton travail en ligne (sur GitHub, GitLab, etc.) et le partager :

* **Via VS Code :**
  1. Va toujours dans l'onglet **Source Control**.
  2. Clique sur le bouton **Publish Branch** (si c'est la première fois) ou **Sync Changes** / l'icône de flèche vers le haut.
* **Via le terminal :**
  ```bash
  git push origin nom-de-ta-branche
  ```

---

## 4. Récupérer le travail des autres (Le Pull)
Pour mettre ton projet à jour avec les derniers changements de tes collègues :

* **Via VS Code :**
  1. Ouvre la palette de commandes (`Ctrl+Shift+P` ou `Cmd+Shift+P`).
  2. Tape **Git: Pull** et valide.
* **Via le terminal :**
  ```bash
  git pull
  ```