module.exports = (sequelize, type) => {
  var Log = sequelize.define(
    "Log",
    {
      id: {
        type: type.UUID,
        defaultValue: type.UUIDV4,
        primaryKey: true
      },
      remoteAddress: {
        type: type.STRING,
        allowNull: false,
      },
      query: {
        type: type.STRING,
        allowNull: false,
      },
      sessionID: {
        type: type.STRING,
        allowNull: false
      }
    },
    {
      indexes: [
        {
          unique: false,
          fields: ["remoteAddress"],
        },
        {
          unique: false,
          fields: ["sessionID"]
        },
        {
          unique: false,
          fields: ["query"],
        }
      ],
    }
  );

  return Log;
};
