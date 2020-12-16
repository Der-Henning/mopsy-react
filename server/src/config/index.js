const finalConfig = {
  app_name: process.env.MOPSY_APP_NAME || "MOPSY Search",
  port: process.env.MOPSY_PORT || 4000,
  json_indentation: process.env.MOPSY_JSON_IDENTATION || 4,
  myprivatekey: process.env.MOPSY_MYPRIVATEKEY || "myprivatekey",
  sessionkey: process.env.MOPSY_SESSIONKEY || "myprivatekey",
  salt_rounds: process.env.MOPSY_SALT_ROUNDS || 10,
  hits_per_page: process.env.MOPSY_HITS_PER_PAGE || 10,
  pdf_dummy: process.env.MOPSY_PDF_DUMMY || null,
  crawlers: (process.env.MOPSY_CRAWLERS || "").split(","),
  solr: {
    host: process.env.MOPSY_SOLR_HOST || "localhost",
    port: process.env.MOPSY_SOLR_PORT || 8983,
    core: process.env.MOPSY_SOLR_CORE,
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
};

module.exports = finalConfig;
