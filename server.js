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



module.exports = start; // pour exporter la fonction start