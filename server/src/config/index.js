const homedir = require('os').homedir();
const finalConfig = {
  app_name: process.env.MOPSY_APP_NAME || "MOPSY Search",
  port: process.env.MOPSY_PORT || 4000,
  production: ((process.env.NODE_ENV || "developement") == "production"),
  json_indentation: process.env.MOPSY_JSON_IDENTATION || 4,
  sessionkey: process.env.MOPSY_SESSIONKEY || "myprivatekey",
  salt_rounds: process.env.MOPSY_SALT_ROUNDS || 10,
  hits_per_page: process.env.MOPSY_HITS_PER_PAGE || 10,
  pdf_dummy: process.env.MOPSY_PDF_DUMMY || null,           // will be displayed if pdf file does not exist
  crawlers: (process.env.MOPSY_CRAWLERS || "").split(","),  // comma seperated list of crawler microservice hostnames
  pdfCache: process.env.MOPSY_PDF_CACHE || homedir,
  rate_limit: process.env.MOPSY_RATE_LIMIT || false,
  rate_limit_window: process.env.MOPSY_RATE_LIMIT_WINDOW || 5 * 60 * 1000, // 5 minutes
  rate_limit_max: process.env.MOPSY_RATE_LIMIT_MAX || 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  solr: {
    host: process.env.MOPSY_SOLR_HOST || "solr",
    port: process.env.MOPSY_SOLR_PORT || 8983,
    core: process.env.MOPSY_SOLR_CORE || "mopsy",
    searchParams: Object.keys(process.env).filter(key => /^MOPSY_SOLR_SEARCHPARAMS_/.test(key)).reduce((result,key) => (
      {...result, [key.replace("MOPSY_SOLR_SEARCHPARAMS_", "").toLowerCase()]: process.env[key]}
    ), {}),                                                 // submits custom solr search params
  },
  db: {
    dialect: process.env.MOPSY_DB_DIALECT || "postgres",
    database: process.env.MOPSY_DB_DATABASE || "mopsy",
    host: process.env.MOPSY_DB_HOST || "db",
    port: process.env.MOPSY_DB_PORT || 5432,
    username: process.env.MOPSY_DB_USERNAME || "mopsy",
    password: process.env.MOPSY_DB_PASSWORD || "myverygoodpassword",
  },
  smtp: {
    host: process.env.MOPSY_SMTP_HOST || "",
    port: process.env.MOPSY_SMTP_PORT || 587,
    username: process.env.MOPSY_SMTP_USERNAME || "",
    password: process.env.MOPSY_SMTP_PASSWORD || "",
    from: process.env.MOPSY_SMTP_FROM || "",
  },
  redis: {
    host: process.env.MOPSY_REDIS_HOST || "redis",
    port: process.env.MOPSY_REDIS_PORT || 6379,
    expire: process.env.MOPSY_REDIS_EXPIRE || 1440              // expiration time for cached documents in minutes
  },
};

module.exports = finalConfig;
