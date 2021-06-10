const models = require("../models");
const mysql = require('mysql');
const solr = require('../middleware/solr');
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
            })
        })
        .catch(err => { throw err })
}

const migrate = (old_db) => {
    old_db.query("SELECT * FROM login", (err, result, fields) => {
        if (err) throw err;
        Object.keys(result).forEach((key) => {
            const login_old = result[key];
            const hash = "$2b$10$" + login_old.password.slice(7);
            models.User.create({
                username: login_old.display,
                email: login_old.email,
                password: hash
            })
                .then(user => {
                    old_db.query(`SELECT * FROM favs WHERE username='${login_old.username}'`, (err, result, fields) => {
                        if (err) throw err;
                        Object.keys(result).forEach(async (key) => {
                            const favorite_old = result[key];
                            const data = await solr.post("/select", {
                                query: "id:zrms_" + favorite_old.docID,
                                fields: "id",
                            });
                            if (data.response.numFound > 0) {
                                models.Favorite.create({
                                    DocId: data.response.docs[0].id,
                                    UserId: user.id
                                });
                            }
                        })

                    });
                })
                .catch(err => { throw err })
        });
    });

}

start()