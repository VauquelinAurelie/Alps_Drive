const express = require("express")
const morgan = require('morgan')
const port = process.env.PORT || 3000
const app = express();
const { join } = require("node:path")
const { promises } = require("node:fs")
const { tmpdir } = require("node:os");
const path = require("node:path");
const { log } = require("node:console");


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
app.use(express.static(join(tmpdir(), 'api', 'drive')));

// Fonction qui liste les dossiers et fichiers à la racine du "drive"
async function getDriveFiles(req, res) {
    try {
        const files = await promises.readdir(join(rootProject), { withFileTypes: true });
        const fileInfo = files.map(file => ({
            name: file.name,
            isFolder: file.isDirectory()
        }));
        res.send(fileInfo);
    } catch (error) {
        console.error("Erreur lors de la récupération des fichiers à la racine du drive :", error);
        res.status(404).send("Une erreur s'est produite lors de la récupération des fichiers");
    }
}
// Route pour récupérer la liste des fichiers et dossiers à la racine du "drive"
app.get('/api/drive', getDriveFiles);


// Route pour afficher le contenu d'un fichier
app.get('/api/drive/:filename', async (req, res) => {
    try {
        const { filename } = req.params; // Récupère le nom du dossier à partir des paramètres de URL
        const filePath = join(rootProject, filename);
        const fileContent = await promises.readFile(filePath, 'utf-8');

        // envoie le contenu du fichier en réponse
        res.sendFile(filePath);
    } catch (error) {
        console.error("Erreur lors de la récupération du contenu du fichier :", error);
        res.status(404).send("Une erreur s'est produite lors de la récupération du contenu du fichier");
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

// Middleware pour vérifier l'existence du dossier parent
app.use('/api/drive/:folder', async (req, res, next) => {
    const folder = req.params.folder;
    const folderPath = join(rootProject, folder);
    try {
        await promises.access(folderPath);
        next(); // Le dossier existe, passe à la prochaine étape de requête
    } catch (error) {
        res.status(404).send("Le dossier parent n'existe pas.");
    }
});

// Route pour créer un dossier avec un nom spécifique dans un dossier spécifique
app.post('/api/drive/:folder', async (req, res) => {
    try {
        const { name } = req.query; // Récupère le nom du dossier à partir des paramètres de requête
        const folder = req.params.folder; // Récupère le nom du dossier parent à partir des paramètres de l'URL
        if (!name || !/^[a-zA-Z0-9_-]+$/.test(name)) {
            return res.status(400).send("Le nom du dossier est requis et ne doit contenir que des caractères alphanumériques, tirets et tirets bas.");
        }
        const folderPath = join(rootProject, folder, name); // Crée le chemin complet du dossier avec le nom fourni et le dossier parent
        await promises.mkdir(folderPath, { recursive: true }); // Crée le dossier de manière récursive si nécessaire
        res.sendStatus(201); // Envoie une réponse indiquant que le dossier a été créé avec succès
    } catch (error) {
        console.error("Erreur lors de la création du dossier :", error);
        res.status(500).send("Une erreur s'est produite lors de la création du dossier.");
    }
});


module.exports = start; // pour exporter la fonction start