const bcrypt = require('bcrypt');

module.exports = (sequelize, type) => {
    var Login = sequelize.define('Login', {
        username: {
            type: type.STRING,
            allowNull: false,
            unique: true
        },
        password: {
            type: type.STRING,
            allowNull: false
        },
        email: {
            type: type.STRING,
            allowNull: false,
            unique: true,
            validate: {
                isEmail: true
            }
        },
        admin: {
            type: type.BOOLEAN,
            defaultValue: 0,
            allowNull: false
        }
    });

    Login.associate = (models) => {
        models.Login.hasMany(models.User);
        models.Login.hasMany(models.Favorite);
    };

    Login.createAdmin = async models => {
        try {
            var admin = await models.Login.findOne({ where: { username: "admin" } });
            if (!admin) {
                await models.Login.create({
                    username: "admin",
                    password: await bcrypt.hash("admin", 10),
                    email: "admin@mopsy.com",
                    admin: true
                });
                console.log("admin user created!");
            }
        } catch(err) {
            console.log(err);
        }
      };

    return Login;
}