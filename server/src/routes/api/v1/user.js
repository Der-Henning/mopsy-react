const router = require("express").Router();
const bcrypt = require("bcrypt");
const models = require("../../../models");
const config = require("../../../config");
const errors = require("../../../middleware/errors");
const nodemailer = require("nodemailer");
const { smtp } = config;
const transporter = nodemailer.createTransport({
  host: smtp.host,
  port: smtp.port,
  secure: smtp.port === 465 ? true : false, // true for 465, false for other ports
  auth: {
    user: smtp.username,
    pass: smtp.password,
  },
});

// get login / admin status
router.get("/", async (req, res, next) => {
  const { userId } = req.session
  try {
    if (userId) {
      const user = await models.User.findByPk(userId);
      if (user)
        return res.send({ loggedIn: true, admin: user.admin })
    }
    res.send({ loggedIn: false, admin: false })
  } catch (err) {
    next(err);
  }
})

// get user data
router.get("/data", async (req, res, next) => {
  const { userId } = req.session
  try {
    if (!userId) return next(new errors.UnauthorizedError());
    const user = await models.User.findByPk(userId, {attributes: ["username", "email"]});
    if (!user) return next(new errors.ResourceNotFoundError("User"));
    res.send({ email: user.email })
  } catch (err) {
    next(err);
  }
})

// register new user, send new x-auth-token in header
router.post("/register", async (req, res, next) => {
  const { username, password, email } = req.body;
  try {
    if (!password || !username || !email)
      return next(new errors.MissingParameterError());
    const hash = await bcrypt.hash(password, 10);
    var user = await models.User.create({
      username: username,
      email: email,
      password: hash,
    });
    req.session.userId = user.id;
    res.send({ loggedIn: true, admin: user.admin });
  } catch (err) {
    next(err);
  }
});

// login user, send new x-auth-token in header
router.post("/login", async (req, res, next) => {
  const { username, password } = req.body;
  try {
    if (!username || !password) return next(new errors.MissingParameterError());
    const user = await models.User.findOne({ where: { username } });
    if (!user) return next(new errors.ResourceNotFoundError("User"));
    if (!bcrypt.compareSync(password, user.password))
      return next(new errors.AuthenticationError());
    req.session.userId = user.id
    res.send({ loggedIn: true, admin: user.admin });
  } catch (err) {
    next(err);
  }
});

// logout user, send new x-auth-token in header
router.get("/logout", (req, res, next) => {
  try {
    req.session.userId = null
    res.send({ loggedIn: false, admin: false });
  } catch (err) {
    next(err);
  }
});

// update user data
router.put("/data", async (req, res, next) => {
  const { userId } = req.session;
  const { password, email } = req.body;
  try {
    if (!userId) return next(new errors.UnauthorizedError());
    if (!password && !email) return next(new errors.MissingParameterError());
    var user = await models.User.findByPk(userId);
    if (!user) return next(new errors.ResourceNotFoundError("User"));
    if (email) user.email = email;
    if (password) {
      const hash = await bcrypt.hash(password, 10);
      user.password = hash;
    }
    await user.save();
    res.send();
  } catch (err) {
    next(err);
  }
});

router.post("/changepassword", async (req, res, next) => {
  const { userId } = req.session;
  const { password } = req.body;
  try {
    if (!userId) return next(new errors.UnauthorizedError());
    var user = await models.User.findByPk(userId);
    const hash = await bcrypt.hash(password, 10);
    user.password = hash;
    await user.save();
    res.status(200).send();
  } catch (err) {
    next(err);
  }
});

router.post("/forgottusername", async (req, res, next) => {
  const { email } = req.body;
  try {
    const user = await models.User.findOne({ where: { email: email } });
    if (!user) return next(new errors.ResourceNotFoundError("E-Mail"));
    const mailOptions = {
      from: smtp.from,
      to: email,
      subject: "Forgotten Username",
      text: "Benutzername: " + user.username,
    };
    const info = await transporter.sendMail(mailOptions);
    res.status(200).send(info);
  } catch (err) {
    next(err);
  }
});

router.post("/forgottpassword", async (req, res, next) => {
  const { email } = req.body;
  try {
    const user = await models.User.findOne({ where: { email: email } });
    if (!user) return next(new errors.ResourceNotFoundError("E-Mail"));
    const randomPassword = Math.random()
      .toString(36)
      .slice(-8);
    const mailOptions = {
      from: smtp.from,
      to: email,
      subject: "Forgotten Username",
      text: "Benutzername: " + randomPassword,
    };
    const hash = await bcrypt.hash(randomPassword, 10);
    user.password = hash;
    await user.save();
    const info = await transporter.sendMail(mailOptions);
    res.status(200).send(info);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
