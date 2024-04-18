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

//demarrer le server
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

app.use(express.static(rootProject));

// Fonction qui liste les dossiers et fichiers à la racine du "drive"
async function getDriveFiles(req, res) {
    try {
        const files = await promises.readdir(rootProject, { withFileTypes: true });
        const fileInfo = files.map(file => ({
            name: file.name,
            isFolder: file.isDirectory()
        }));
        res.status(200).send(fileInfo);
    } catch (error) {
        console.error("Erreur lors de la récupération des fichiers à la racine du drive :", error);
        res.status(404).send("Une erreur s'est produite lors de la récupération des fichiers");
    }
}
// Route pour récupérer la liste des fichiers et dossiers à la racine du "drive"
app.get('/api/drive', getDriveFiles);


// Route pour afficher le contenu d'un fichier
app.get('/api/drive/:filename', async (req, res) => {
    const { filename } = req.params;

    try {
        const filePath = path.join(rootProject, filename);

        // Vérifier si le chemin correspond à un dossier
        const stats = await promises.stat(filePath);
        if (stats.isDirectory()) {
            // Si c'est un dossier, lister son contenu
            const files = await promises.readdir(filePath, { withFileTypes: true });
            const fileInfo = files.map(file => ({
                name: file.name,
                isFolder: file.isDirectory()
            }));
            res.send(fileInfo);
        } else {
            // Si c'est un fichier, afficher son contenu
            const fileContent = await promises.readFile(filePath, 'utf-8');
            res.sendFile(filePath);
        }
    } catch (error) {
        console.error("Erreur lors de la récupération du contenu du fichier ou du dossier :", error);
        res.status(404).send("Une erreur s'est produite lors de la récupération du contenu du fichier ou du dossier");
    }
});


// fonction avec la route pour créer un dossier avec un nom spécifique
async function createFolder(req, res) {
    try {
        const { name } = req.query; // Récupère le nom du dossier à partir des paramètres de requête
        if (!name || !/^[a-zA-Z0-9_-]+$/.test(name)) {
            return res.status(400).send("Le nom du dossier est requis et ne doit contenir que des caractères alphanumériques, tirets et tirets bas.");
        }
        let folderPath = rootProject;

        if (req.params.folder) { // S'il y a un dossier spécifique, créez le dossier à l'intérieur
            folderPath = join(rootProject, req.params.folder, name);
        } else { // Sinon, créez le dossier à la racine
            folderPath = join(rootProject, name);
        }
        await promises.mkdir(folderPath, { recursive: true }); // Crée le dossier de manière récursive si nécessaire
        res.sendStatus(201); // Envoie un status indiquant que le dossier a été créé avec succès
    } catch (error) {
        console.error("Erreur lors de la création du dossier :", error);
        res.status(500).send("Une erreur s'est produite lors de la création du dossier.");
    }
}

// Route pour créer un dossier à la racine ou dans un dossier spécifique
app.post('/api/drive/:folder?',createFolder); 


module.exports = start; // pour exporter la fonction start