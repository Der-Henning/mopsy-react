const homedir = require('os').homedir();
const finalConfig = {
  app_name: process.env.MOPSY_APP_NAME || "MOPSY Search",
  port: process.env.MOPSY_PORT || 4000,
  json_indentation: process.env.MOPSY_JSON_IDENTATION || 4,
  myprivatekey: process.env.MOPSY_MYPRIVATEKEY || "myprivatekey",
  sessionkey: process.env.MOPSY_SESSIONKEY || "myprivatekey",
  salt_rounds: process.env.MOPSY_SALT_ROUNDS || 10,
  hits_per_page: process.env.MOPSY_HITS_PER_PAGE || 10,
  pdf_dummy: process.env.MOPSY_PDF_DUMMY || null,           // will be displayed if pdf file does not exist
  crawlers: (process.env.MOPSY_CRAWLERS || "").split(","),  // comma seperated list of crawler microservice hostnames
  pdfCache: process.env.MOPSY_PDF_CACHE || homedir,
  solr: {
    host: process.env.MOPSY_SOLR_HOST || "localhost",
    port: process.env.MOPSY_SOLR_PORT || 8983,
    core: process.env.MOPSY_SOLR_CORE,
    searchParams: Object.keys(process.env).filter(key => /^MOPSY_SOLR_SEARCHPARAMS_/.test(key)).reduce((result,key) => (
      {...result, [key.replace("MOPSY_SOLR_SEARCHPARAMS_", "").toLowerCase()]: process.env[key]}
    ), {}),                                                 // submits custom solr search params
  },
  mysql: {
    database: process.env.MOPSY_MYSQL_DATABASE,
    host: process.env.MOPSY_MYSQL_HOST || "localhost",
    port: process.env.MOPSY_MYSQL_PORT || 3306,
    username: process.env.MOPSY_MYSQL_USERNAME,
    password: process.env.MOPSY_MYSQL_PASSWORD,
  },
  smtp: {
    host: process.env.MOPSY_SMTP_HOST || "",
    port: process.env.MOPSY_SMTP_PORT || 587,
    username: process.env.MOPSY_SMTP_USERNAME || "",
    password: process.env.MOPSY_SMTP_PASSWORD || "",
    from: process.env.MOPSY_SMTP_FROM || "",
  },
  redis: {
    host: process.env.REDIS_HOST || "localhost",
    port: process.env.REDIS_PORT || 6379,
    expire: process.env.REDIS_EXPIRE || 1440              // expiration time for cached documents in minutes
  },
};

module.exports = finalConfig;
