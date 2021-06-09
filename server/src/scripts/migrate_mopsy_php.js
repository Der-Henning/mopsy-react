const models = require("../models");
const mysql = require('mysql');
import "regenerator-runtime/runtime";

const start = () => {
    const old_db = mysql.createConnection({
        host: process.env.MIGRATE_OLD_MYSQL_HOST,
        user: process.env.MIGRATE_OLD_MYSQL_USERNAME,
        password: process.env.MIGRATE_OLD_MYSQL_PASSWORD,
        database: process.env.MIGRATE_OLD_MYSQL_DATABASE
    });

    models.sequelize.sync()
        .then(() => {
            console.log(`Connected to new Database on host '${process.env.MOPSY_MYSQL_HOST}'`)
            old_db.connect(err => {
                if (err) { throw err }
                console.log(`Connected to old Database on host '${process.env.MIGRATE_OLD_MYSQL_HOST}'`)
                migrate(old_db)
                console.log("Migraction complete")
            })
        })
        .catch(err => { throw err })
}

const migrate = (old_db) => {
    old_db.query("SELECT * FROM login", (err, result, fields) => {
        if (err) throw err;
        Object.keys(result).forEach((key) => {
            const row = result[key];
            const hash = "$2b$10$" + row.password.slice(7);
            models.Login.create({
                username: row.display,
                email: row.email,
                password: hash
            }).then(login => {
                console.log(`created ${login}`)
                // const login_favs_old = await old_db.query(`SELECT * FROM favs WHERE username='${login_old.username}'`);    
            })
                .catch(err => { throw err })
        });
    });

}

start()