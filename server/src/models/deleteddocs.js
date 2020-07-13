module.exports = (sequelize, type) => {
  var DeletedDocs = sequelize.define(
    "DeletedDocs",
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

  return DeletedDocs;
};
