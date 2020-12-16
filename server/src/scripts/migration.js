const request = require("request");
const url = require("url");
const config = require("../config");
const axios = require("axios");
const qs = require("qs")
// const module = require("md5-file");

const solrCore = (args) => (url.format({
  protocol: "http",
  hostname: args.host,
  port: args.port,
  pathname: "solr/" + args.core,
}));

const searchBody = (offset, rows, fieldList) => {
  return {
    q: "*",
    rows: rows,
    start: offset,
    fl: fieldList
  };
};

const solrGetData = (solrCore, requestHandler, body) => {
  return new Promise(async (resolve, reject) => {
    try {
      const { data } = await axios.post(
        solrCore + requestHandler,
        qs.stringify(body)
      );
      if (data?.responseHeader && data.responseHeader.status == 0)
        resolve(data);
      reject(new errors.SolrBackendError());
    } catch (err) {
      reject(err);
    }
  });
};

const solrPostData = (data) => {
  const solr = solrCore({ host: config.solr.host, port: config.solr.port, core: config.solr.core });
  return new Promise((resolve, reject) => {
    request.post(
      {
        url: solr + "/update/json/docs?commit=true",
        body: data,
        json: true,
      },
      (error, res, body) => {
        console.log(body);
        if (error) reject(error);
        if (res.statusCode == 200) resolve(body);
        reject(body);
      }
    );
  });
};

const migrate_dvcore = () => {
  const source = { host: "solr", port: 8983, core: "dvcore" };

  const fl = "id,document,md5,title,page*,ScanDate,keywords,zusatz,link,meta_*,data_*";

  const fieldMap = {
    id: doc => { return `zrms_${doc.id}` },
    document: doc => { return doc.document },
    md5: doc => { return doc.md5 },
    title_txt_de: doc => { return doc.title },
    subtitle_txt_de: doc => { return doc.zusatz },
    link: doc => { return doc.link },
    source: doc => { return "zrms" },
    language: doc => { return "de" },
    scanDate: doc => { return doc.ScanDate },
    creationDate: doc => {return doc.ScanDate},
    tags: doc => { return doc.keywords },
    authors: doc => { return [doc.meta_Author] },
    pages: doc => {
      let pages = {};
      Object.keys(doc).forEach(key => {
        if (key.match("page_.*")) {
          let num = key.replace("page_", "");
          let page = { [`p_${num}_page_txt_de`]: doc[key] };
          pages = { ...pages, ...page }
        }
      })
      return pages;
    },
    // metas: doc => {
    //   let metas = {};
    //   Object.keys(doc).forEach(key => {
    //     if (key.match("meta_.*")) {
    //       metas = { ...metas, [key]: doc[key] }
    //     }
    //   })
    //   return metas;
    // },
    data: doc => {
      let data = [];
      Object.keys(doc).forEach(key => {
        if (key.match("data_.*")) {
          data.push(doc[key]);
        }
      })
      return data;
    }
  };
  migrate(source, "/select", fieldMap, fl);
}

const migrate = async (source, requestHandler = "/select", fieldMap = {}, fl) => {
  var numDocs = 10;
  var offset = 0;
  const rows = 10;

  while (offset < numDocs) {
    const data = await solrGetData(solrCore(source), requestHandler, searchBody(offset, rows, fl));
    const documents = data.response.docs;
    for (let i = 0; i < documents.length; i++) {
    // data.response.docs.forEach((doc) => {
      const doc = documents[i];
      console.log(doc.document);
      let newDoc = {};
      Object.keys(fieldMap).forEach(key => {
        let val = fieldMap[key](doc);
        if (val) {
          if (typeof val === "object" && !Array.isArray(val)) {
            newDoc = { ...newDoc, ...val };
          } else {
            newDoc = { ...newDoc, [key]: val }
          }
        }
      })
      // console.log(newDoc);
      try {
        await solrPostData(newDoc);
      } catch(err) {
        console.log(err);
      }
      
    }

    offset += rows;
    numDocs = data.response.numFound;
    // break;
  }
}

migrate_dvcore();