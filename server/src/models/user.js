const bcrypt = require("bcrypt");

module.exports = (sequelize, type) => {
  var User = sequelize.define("User", {
    username: {
      type: type.STRING,
      allowNull: false,
      unique: true,
    },
    password: {
      type: type.STRING,
      allowNull: false,
    },
    email: {
      type: type.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    admin: {
      type: type.BOOLEAN,
      defaultValue: 0,
      allowNull: false,
    },
  });

  User.associate = (models) => {
    models.User.hasMany(models.Favorite);
  };

  User.createAdmin = async (models) => {
    try {
      var admin = await models.User.findOne({ where: { username: "admin" } });
      if (!admin) {
        await models.User.create({
          username: "admin",
          password: await bcrypt.hash("admin", 10),
          email: "admin@mopsy.com",
          admin: true,
        });
        console.log("admin user created!");
      }
    } catch (err) {
      console.log(err);
    }
  };

  return User;
};
