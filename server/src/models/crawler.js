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
    module: {
      type: type.STRING,
      allowNull: false,
    },
    args: {
      type: type.STRING,
      allowNull: true,
    },
    compareMethod: {
      type: type.STRING,
      allowNull: false,
      defaultValue: "md5",
      validate: {
        isIn: [["md5", "lcd"]],
      },
    },
  });
  return Crawler;
};
