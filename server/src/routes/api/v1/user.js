const router = require("express").Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const models = require("../../../models");
const config = require("../../../config");
const auth = require("../../../middleware/auth");
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

// create new user
// create new token, send as x-auth-token in header
// token must be provided via x-access-token or authorization in header in every request
router.get("/newtoken", async (req, res, next) => {
  try {
    const user = await models.User.create();
    const token = jwt.sign({ UserId: user.id }, config.myprivatekey);
    res
      .status(200)
      .header("x-auth-token", token)
      .send();
  } catch (err) {
    next(err);
  }
});

// register new user, send new x-auth-token in header
router.post("/register", auth, async (req, res, next) => {
  const { username, password, email } = req.body;
  try {
    if (!password || !username || !email)
      return next(new errors.MissingParameterError());
    const hash = await bcrypt.hash(password, 10);
    var login = await models.Login.create({
      username: username,
      email: email,
      password: hash,
    });
    const token = jwt.sign(
      { UserId: req.UserId, LoginId: login.id },
      config.myprivatekey
    );
    res
      .status(200)
      .header("x-auth-token", token)
      .send({ loginId: login.id });
  } catch (err) {
    next(err);
  }
});

// login user, send new x-auth-token in header
router.post("/login", auth, async (req, res, next) => {
  const { username, password } = req.body;
  try {
    if (!username || !password) return next(new errors.MissingParameterError());
    const login = await models.Login.findOne({ where: { username } });
    if (!login) return next(new errors.ResourceNotFoundError("Login"));
    if (!bcrypt.compareSync(password, login.password))
      return next(new errors.AuthenticationError());
    const token = jwt.sign(
      { UserId: req.UserId, LoginId: login.id },
      config.myprivatekey
    );
    res
      .status(200)
      .header("x-auth-token", token)
      .send({ loginId: login.id, admin: login.admin });
  } catch (err) {
    next(err);
  }
});

// logout user, send new x-auth-token in header
router.get("/logout", auth, (req, res, next) => {
  try {
    const token = jwt.sign({ UserId: req.UserId }, config.myprivatekey);
    res
      .status(200)
      .header("x-auth-token", token)
      .send();
  } catch (err) {
    next(err);
  }
});

router.get("/loginid", auth, (req, res, next) => {
  try {
    res.status(200).send({ loginId: req.LoginId, admin: req.Admin });
  } catch (err) {
    next(err);
  }
});

// update user information
router.post("/:LoginId/update", auth, async (req, res, next) => {
  const LoginId = req.params.LoginId;
  const { password, email } = req.body;
  try {
    if (!req.LoginId) return next(new errors.UnauthorizedError());
    if (!password && !email) return next(new errors.MissingParameterError());
    var currentLogin = await models.Login.findOne({
      where: { id: req.LoginId },
    });
    if (req.LoginId != LoginId && !currentLogin.admin)
      return next(new errors.UnauthorizedError());
    var login = await models.Login.findOne({ where: { id: LoginId } });
    if (!login) return next(new errors.ResourceNotFoundError("Login"));
    if (email) login.email = email;
    if (password) {
      const hash = await bcrypt.hash(password, 10);
      login.password = hash;
    }
    await login.save();
    res.status(200).send();
  } catch (err) {
    next(err);
  }
});

// return userdata
router.get("/:LoginId", auth, async (req, res, next) => {
  const LoginId = req.params.LoginId;
  try {
    if (!req.LoginId) return next(new errors.UnauthorizedError());
    var currentLogin = await models.Login.findOne({
      where: { id: req.LoginId },
    });
    if (req.LoginId != LoginId && !currentLogin.admin)
      return next(new errors.UnauthorizedError());
    var login = await models.Login.findOne({
      where: { id: LoginId },
      attributes: ["username", "email", "admin"],
    });
    if (!login) return next(new errors.ResourceNotFoundError("Login"));
    res.status(200).send(login);
  } catch (err) {
    next(err);
  }
});

router.post("/changepassword", auth, async (req, res, next) => {
  const { password } = req.body;
  try {
    if (!req.LoginId) return next(new errors.UnauthorizedError());
    var login = await models.Login.findOne({ where: { id: req.LoginId } });
    const hash = await bcrypt.hash(password, 10);
    login.password = hash;
    await login.save();
    res.status(200).send();
  } catch (err) {
    next(err);
  }
});

router.post("/forgottusername", auth, async (req, res, next) => {
  const { email } = req.body;
  try {
    const login = await models.Login.findOne({ where: { email: email } });
    if (!login) return next(new errors.ResourceNotFoundError("E-Mail"));
    const mailOptions = {
      from: smtp.from,
      to: email,
      subject: "Forgotten Username",
      text: "Benutzername: " + login.username,
    };
    const info = await transporter.sendMail(mailOptions);
    res.status(200).send(info);
  } catch (err) {
    next(err);
  }
});

router.post("/forgottpassword", auth, async (req, res, next) => {
  const { email } = req.body;
  try {
    const login = await models.Login.findOne({ where: { email: email } });
    if (!login) return next(new errors.ResourceNotFoundError("E-Mail"));
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
    login.password = hash;
    await login.save();
    const info = await transporter.sendMail(mailOptions);
    res.status(200).send(info);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
