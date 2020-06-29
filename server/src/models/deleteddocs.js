module.exports = (sequelize, type) => {
  var DeletedDocs = sequelize.define(
    "DeletedDocs",
    {
      DocId: {
        type: type.STRING,
        allowNull: false,
      },
      document: {
        type: type.STRING,
        allowNull: true,
      },
      title: {
        type: type.STRING,
        allowNull: true,
      },
      zusatz: {
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

  return DeletedDocs;
};
