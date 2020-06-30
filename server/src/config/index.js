// ----------- config with config.js --------------
// const _ = require("lodash");
// const config = require("./config.json");
// const defaultConfig = config.development;
// const environment = process.env.NODE_ENV || "development";
// const environmentConfig = config[environment];
// const finalConfig = _.merge(defaultConfig, environmentConfig);

// ----------- config with .env ----------------
const finalConfig = {
  app_name: process.env.CALIBRE_SOLR_APP_NAME || "Calibre - Solr",
  port: process.env.CALIBRE_SOLR_PORT || 4000,
  json_indentation: process.env.CALIBRE_SOLR_JSON_IDENTATION || 4,
  myprivatekey: process.env.CALIBRE_SOLR_MYPRIVATEKEY || "myprivatekey",
  sessionkey: process.env.CALIBRE_SOLR_SESSIONKEY || "myprivatekey",
  salt_rounds: process.env.CALIBRE_SOLR_SALT_ROUNDS || 10,
  hits_per_page: process.env.CALIBRE_SOLR_HITS_PER_PAGE || 10,
  pdf_dummy: process.env.CALIBRE_SOLR_PDF_DUMMY || null,
  solr: {
    host: process.env.CALIBRE_SOLR_SOLR_HOST || "localhost",
    port: process.env.CALIBRE_SOLR_SOLR_PORT || 8983,
    core: process.env.CALIBRE_SOLR_SOLR_CORE,
  },
  mysql: {
    database: process.env.CALIBRE_SOLR_MYSQL_DATABASE,
    host: process.env.CALIBRE_SOLR_MYSQL_HOST || "localhost",
    port: process.env.CALIBRE_SOLR_MYSQL_PORT || 3306,
    username: process.env.CALIBRE_SOLR_MYSQL_USERNAME,
    password: process.env.CALIBRE_SOLR_MYSQL_PASSWORD,
  },
  smtp: {
    host: process.env.CALIBRE_SOLR_SMTP_HOST || "",
    port: process.env.CALIBRE_SOLR_SMTP_PORT || 587,
    username: process.env.CALIBRE_SOLR_SMTP_USERNAME || "",
    password: process.env.CALIBRE_SOLR_SMTP_PASSWORD || "",
    from: process.env.CALIBRE_SOLR_SMTP_FROM || "",
  },
};

module.exports = finalConfig;
