const express = require("express")
const morgan = require('morgan')
const port = process.env.PORT || 3000
const app = express();
const {join} = require("node:path")
const {promises} = require("node:fs")
const {tmpdir} = require("node:os");

const rootProject = join(tmpdir(), 'api', 'drive')
//demarer le server
function start() {
  

    app.get("/", (req, res) => { //req = requête et res = réponse
        res.send("Got it !")
    })

    app.listen(port, () => {
        console.log("serveur est en ligne !");
    })
}
// Middleware pour autoriser les requêtes CORS
app.use(function (req, res, next) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader('Access-Control-Allow-Methods', '*');
    res.setHeader("Access-Control-Allow-Headers", "*");
    next();
});

// liste les dossiers et fichiers à la racine du "drive"
app.get('/api/drive', async (req, res) => { // défini la route
    try {
        const files = await promises.readdir(join(rootProject), { withFileTypes: true }); // Lire le contenu du répertoire racine
        const fileInfo = files.map(file => ({  // Créer un tableau d'objets des infos sur chaque fichier
            name: file.name,
            isFolder: file.isDirectory()
        }));
        res.send(fileInfo); // Retourne la liste des infos fichiers au client
    } catch (e) { // Si échec, retourne l'erreur
        res.status(404).send("Une erreur s'est produite lors de la récupération des fichiers");
    }
});

// Route pour créer un dossier avec un nom spécifique
app.post('/api/drive', async (req, res) => {
    try {
        const { name } = req.query; // Récupère le nom du dossier à partir des paramètres de requête
        if (!name || !/^[a-zA-Z0-9_-]+$/.test(name)) {
            return res.status(400).send("Le nom du dossier est requis et ne doit contenir que des caractères alphanumériques, tirets et tirets bas.");
        }
        const folderPath = join(rootProject, name); // Crée le chemin complet du dossier avec le nom fourni
        await promises.mkdir(folderPath, { recursive: true }); // Crée le dossier de manière récursive si nécessaire
        res.sendStatus(201); // Envoie une réponse indiquant que le dossier a été créé avec succès
    } catch (error) {
        console.error("Erreur lors de la création du dossier :", error);
        res.status(500).send("Une erreur s'est produite lors de la création du dossier.");
    }
});


module.exports = start; // pour exporter la fonction start