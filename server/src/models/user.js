module.exports = (sequelize, type) => {
    var User = sequelize.define('User', {});

    User.associate = (models) => {
        models.User.belongsTo(models.Login, {
            foreignKey: {
                allowNull: true
            }
        });
    };

    return User;
}