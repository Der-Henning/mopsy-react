const models = require("../models");
const mysql = require('mysql');
import "regenerator-runtime/runtime";

const migrate = () => {
    const old_db = mysql.createConnection({
        host: process.env.MIGRATE_OLD_MYSQL_HOST,
        user: process.env.MIGRATE_OLD_MYSQL_USERNAME,
        password: process.env.MIGRATE_OLD_MYSQL_PASSWORD,
        database: process.env.MIGRATE_OLD_MYSQL_DATABASE
    });

    models.sequelize.sync().then(() => {
        old_db.connect().then(async () => {

            const users_old = await old_db.query("SELECT * FROM login");
            for (user in users_old) {
                var hash = "$2b$10$" + user.password.slice(7);
                var login = await models.Login.create({
                    username: user.display,
                    email: user.email,
                    password: hash
                });
                console.log(`created ${login}`)
            }

        })
            .catch(err => { throw err })
    })
        .catch(err => { throw err })
}

export default migrate