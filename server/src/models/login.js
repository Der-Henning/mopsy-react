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

    return Login;
}