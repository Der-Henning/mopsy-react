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

    models.sequelize.sync().then(() => {
        console.log(`Connected to new Database on host '${process.env.MOPSY_MYSQL_HOST}'`)
        old_db.connect().then(() => {
            console.log(`Connected to old Database on host '${process.env.MIGRATE_OLD_MYSQL_HOST}'`)
            migrate()
            console.log("Migraction complete")
        })
            .catch(err => { throw err })
    })
        .catch(err => { throw err })
}

const migrate = () => {
    old_db.query("SELECT * FROM login", (err, logins_old, fields) => {
        if (err) throw err;
        print(logins_old)
        for (login_old in logins_old) {
            var hash = "$2b$10$" + login_old.password.slice(7);
            models.Login.create({
                username: login_old.display,
                email: login_old.email,
                password: hash
            }).then(login => {
                console.log(`created ${login}`)
                // const login_favs_old = await old_db.query(`SELECT * FROM favs WHERE username='${login_old.username}'`);    
            })
            .catch(err => {throw err})
        }
    });

}

export default start