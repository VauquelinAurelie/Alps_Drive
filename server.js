const express = require("express")
const morgan = require('morgan')
const busboy = require('express-busboy')
const port = process.env.PORT || 3000
const app = express();
const { join } = require("node:path")
const fs = require("node:fs")
const { promises } = require("node:fs")
const { tmpdir } = require("node:os");
const path = require("node:path");
const { log, error } = require("node:console");

const rootProject = join(tmpdir(), 'api', 'drive')
const drivePath = "/api/drive/:name(*)"

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
        res.setHeader("Cache-Control", "no-store")
        next();
    });

    app.use(express.static(rootProject));

    // busboy pour téléchargement de fichier
    busboy.extend(app, {
        upload: true,
        path: "/tmp/busboy"
    });

// Fonction qui liste les dossiers et fichiers à la racine du "drive"
async function getDriveFiles(req, res) {
    const fullPath = join(rootProject, req.params.name)

    try {
        const files = await promises.readdir(fullPath, { withFileTypes: true });
        const fileInfo = files.map(file => ({
            name: file.name,
            isFolder: file.isDirectory()
        }));
        return res.status(200).send(fileInfo);
    } catch (error) {
        console.error("Erreur lors de la récupération des fichiers à la racine du drive :", error);
        res.status(500).send("Une erreur s'est produite lors de la récupération des fichiers");
    }
}
// Route pour récupérer la liste des fichiers et dossiers à la racine du "drive"
app.get(drivePath, getDriveFiles);


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


// fonction pour créer un dossier avec un nom spécifique soit à la racine soit dans le dossier courant

async function createFolder(req, res) {
    const fullPath = join(rootProject, req.params.name, req.query.name)

    try {
        const { name } = req.query; // Récupère le nom du dossier à partir des paramètres de requête
        if (!name || !/^[a-zA-Z0-9_-]+$/.test(name)) {
            return res.status(400).send("Le nom du dossier est requis et ne doit contenir que des caractères alphanumériques, tirets et tirets bas.");
        }
        await promises.mkdir(fullPath, { recursive: true }); // Crée le dossier de manière récursive si nécessaire
        res.sendStatus(201); // Envoie un status indiquant que le dossier a été créé avec succès
    } catch (error) {
        console.error("Erreur lors de la création du dossier :", error);
        res.status(500).send("Une erreur s'est produite lors de la création du dossier.");
    }
}

// Route pour créer un dossier à la racine ou dans un dossier spécifique
app.post(drivePath,createFolder); 


// fonction de suppression d'un dossier ou d'un fichier avec le name et en fonction de son emplacement

async function deleteFileOrFolder(req, res) {
    try {
        const { folder, name } = req.params;
        let filePath = path.join(rootProject, name);
        
        if (folder) {
            filePath = path.join(rootProject, folder, name);
        }
        
        await promises.rm(filePath, { recursive: true }); // Supprime le fichier ou le dossier de manière récursive si nécessaire
        res.sendStatus(200); // Envoie un status indiquant que le fichier ou le dossier a été supprimé avec succès
    } catch (error) {
        console.error("Erreur lors de la suppression :", error);
        res.status(404).send("Le dossier ou le fichier n'existe pas ou n'a pas pu être supprimé.");
    }
}

// Route pour supprimer un fichier ou un dossier selon l'emplacement
app.delete(drivePath, deleteFileOrFolder);


// fonction création d'un fichier à la racine 

async function uploadFile(req, res) {
    // chemin du fichier qui se trouve dans le dossier tmp busboy
    const tmpBusboyFilePath = req.files.file.file
    const filename = req.files.file.filename
    const fullPath = join(rootProject, req.params.name, filename)

    try {
        await promises.rename(tmpBusboyFilePath, fullPath);

        res.sendStatus(201); // Envoie un statut indiquant que le fichier a été créé avec succès
    } catch (error) {
        console.error("Erreur lors de la création du fichier :", error);
        res.status(500).send("Une erreur s'est produite lors de la création du fichier.");
    }
}

// Route pour créer un fichier à la racine du "drive" 
app.put(drivePath, uploadFile);

module.exports = start; // pour exporter la fonction start