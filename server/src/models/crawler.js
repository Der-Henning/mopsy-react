module.exports = (sequelize, type) => {
  var Crawler = sequelize.define("Crawler", {
    name: {
      type: type.STRING,
      allowNull: false,
      unique: true,
    },
    cron: {
      type: type.STRING,
      allowNull: true,
    },
    iterator: {
      type: type.TEXT,
      allowNull: true,
    },
    compareMethod: {
      type: type.STRING,
      allowNull: false,
      defaultValue: "md5",
      validate: {
        isIn: [["md5", "last change date"]],
      },
    },
  });
  return Crawler;
};
