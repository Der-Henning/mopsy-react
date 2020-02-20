module.exports = (sequelize, type) => {
    var Query = sequelize.define('Query', {
        query: {
            type: type.STRING,
            allowNull: false,
            unique: true
        },
        counter: {
            type: type.INTEGER,
            defaultValue: 0
        }
    });
    return Query;
}