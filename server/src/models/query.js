module.exports = (sequelize, type) => {
  var Query = sequelize.define("Query", {
    id: {
      type: type.UUID,
      defaultValue: type.UUIDV4,
      primaryKey: true
    },
    query: {
      type: type.STRING,
      allowNull: false,
      unique: true,
    },
    counter: {
      type: type.INTEGER,
      defaultValue: 0,
    },
  });
  return Query;
};
