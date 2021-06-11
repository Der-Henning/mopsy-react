module.exports = (sequelize, type) => {
  var Favorite = sequelize.define(
    "Favorite",
    {
      id: {
        type: type.UUID,
        defaultValue: type.UUIDV4,
        primaryKey: true
      },
      DocId: {
        type: type.STRING,
        allowNull: false,
      },
    },
    {
      indexes: [
        {
          unique: true,
          fields: ["UserId", "DocId"],
        },
        {
          unique: false,
          fields: ["UserId"],
        },
      ],
    }
  );

  Favorite.associate = (models) => {
    models.Favorite.belongsTo(models.User, {
      onDelete: "CASCADE",
      foreignKey: {
        allowNull: false,
        name: "UserId",
      },
    });
  };

  return Favorite;
};
