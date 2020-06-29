module.exports = (sequelize, type) => {
  var Favorite = sequelize.define(
    "Favorite",
    {
      DocId: {
        type: type.STRING,
        allowNull: false,
      },
    },
    {
      indexes: [
        {
          unique: true,
          fields: ["LoginId", "DocId"],
        },
        {
          unique: false,
          fields: ["LoginId"],
        },
      ],
    }
  );

  Favorite.associate = (models) => {
    models.Favorite.belongsTo(models.Login, {
      onDelete: "CASCADE",
      foreignKey: {
        allowNull: false,
        name: "LoginId",
      },
    });
  };

  return Favorite;
};
