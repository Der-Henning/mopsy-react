const router = require('express').Router();
const bcrypt = require('bcrypt');
const jwt    = require('jsonwebtoken');
const models = require('../models');
const config = require('../config');
const auth   = require('../middleware/auth');

// register new user, send new x-auth-token in header
router.post('/register', auth, async (req, res, next) => {
    const { username, password, email } = req.body;
    if (!password) {
        return res.status(400).send("Login.password cannot be null");
    }
    const hash = await bcrypt.hash(password, 10);
    models.Login.create({
        username: username,
        email: email,
        password: hash
    }).then(login => {
        const token = jwt.sign({ UserId: req.UserId, LoginId: login.id}, config.myprivatekey);
        res.status(200).header("x-auth-token", token).send({loginId: login.id});
    }).catch(error => {
        res.status(400).send(error.errors[0].message);
    });
});

// login user, send new x-auth-token in header
router.post('/login', auth, async (req, res, next) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).send(
          'missing username or password'
        );
    }
    const login = await models.Login.findOne({ where: { username } });
    if (!login) return res.status(400).send("invalid username");
    if (bcrypt.compareSync(password, login.password)) {
        const token = jwt.sign({ UserId: req.UserId, LoginId: login.id}, config.myprivatekey);
        res.status(200).header("x-auth-token", token).send({loginId: login.id});
    } else {
        res.status(400).send("invalid password");
    }
});

// logout user, send new x-auth-token in header
router.post('/logout', auth, (req, res, next) => {
    const token = jwt.sign({ UserId: req.UserId}, config.myprivatekey);
    res.status(200).header("x-auth-token", token).send();
});

router.post('/getlogin', auth, (req, res, next) => {
    if (!req.LoginId) return res.status(200).send("not loged in");
    res.status(200).send({loginId: req.LoginId});
});

// return userdata
router.post('/user/:LoginId', auth, async (req, res, next) => {
    const LoginId = req.params.LoginId;
    if (!req.LoginId) return res.status(400).send("not loged in");
    var currentLogin = await models.Login.findOne({where: {id: req.LoginId}});
    if (currentLogin.id == LoginId || currentLogin.admin) {
        var login = await models.Login.findOne({where: {id: LoginId}});
        if (!login) return res.status(400).send("username doesn't exist");
        res.status(200).send(login);
    } else {
        res.status(400).send("permission denied");
    }
});

module.exports = router;