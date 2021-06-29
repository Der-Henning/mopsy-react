const bcrypt = require("bcrypt");
const config = require("../config");

module.exports = (sequelize, type) => {
  var User = sequelize.define("User", {
    id: {
      type: type.UUID,
      defaultValue: type.UUIDV4,
      primaryKey: true
    },
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

  User.hashPassword = async (password) => {
    return await bcrypt.hash(password, parseInt(config.salt_rounds))
  }

  User.validate = async (password, hash) => {
    return await bcrypt.compare(password, hash);
  }

  User.createAdmin = async (models) => {
    try {
      var admin = await models.User.findOne({ where: { username: "admin" } });
      if (!admin) {
        await models.User.create({
          username: "admin",
          password: await models.User.hashPassword("admin"),
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
