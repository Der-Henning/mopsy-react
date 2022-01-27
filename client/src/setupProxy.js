const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function (app) {
    app.use(
        '/api',
        createProxyMiddleware({
            target: 'http://localhost:4000',
            changeOrigin: true,
        })
    );
    app.use(
        '/cache',
        createProxyMiddleware({
            target: 'http://localhost',
            changeOrigin: true,
        })
    );
};