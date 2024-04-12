//demarer le server
function start () {
    const express = require ("express")
    const port = process.env.PORT || 3000
    
    const app = express();
    
    app.get("/", (req, res) => { //req = requête et res = réponse
        res.send("Got it !")
    })
    
    app.listen(port, () => {
        console.log("serveur est en ligne !");
    })
    // chemin pour users
    const users =require ("./routes/users")
    app.use ("/users", users)

    // pour récuperer les tweets d'un users
    app.use( function (req, res, next) {
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader('Access-Control-Allow-Methods', '*');
        res.setHeader("Access-Control-Allow-Headers", "*");
        next();
    });

         

}

module.exports = start; // pour exporter la fonction start