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

app.get('/api/drive', async (req, res) => {
    try {
        await getFilesRoot(res)
    } catch (e) {
        res.status(404)
    }
})

async function getFilesRoot  (res){
const files = await promises.readdir(join(rootProject), {withFileTypes: true})
const fileInfo = files.map(file =>({
    name : file.name,
    isFolder : file.isDirectory()
}))
res.send(fileInfo)
}



module.exports = start; // pour exporter la fonction start