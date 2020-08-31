module.exports = (sequelize, type) => {
  var DeletedDoc = sequelize.define(
    "DeletedDoc",
    {
      DocId: {
        type: type.STRING,
        allowNull: false,
      },
      title: {
        type: type.STRING,
        allowNull: true,
      },
      subtitle: {
        type: type.STRING,
        allowNull: true,
      },
      deletedOn: {
        type: type.DATE,
        allowNull: false,
      },
    },
    {
      indexes: [
        {
          unique: true,
          fields: ["DocId"],
        },
      ],
    }
  );

  return DeletedDoc;
};
