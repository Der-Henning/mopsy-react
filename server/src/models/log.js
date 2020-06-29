module.exports = (sequelize, type) => {
  var Log = sequelize.define(
    "Log",
    {
      remoteAddress: {
        type: type.STRING,
        allowNull: false,
      },
      query: {
        type: type.STRING,
        allowNull: false,
      },
    },
    {
      indexes: [
        {
          unique: false,
          fields: ["remoteAddress"],
        },
        {
          unique: false,
          fields: ["query"],
        },
        {
          unique: false,
          fields: ["UserId"],
        },
      ],
    }
  );

  Log.associate = (models) => {
    models.Log.belongsTo(models.User, {
      onDelete: "CASCADE",
      foreignKey: {
        name: "UserId",
        allowNull: false,
      },
    });
  };

  return Log;
};
