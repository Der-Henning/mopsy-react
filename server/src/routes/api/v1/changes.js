const router = require("express").Router();
const models = require("../../../models");
const solr = require("../../../middleware/solr");

const apiVersion = "v1";

const requestBody = () => {
    return {
        query: "*:*",
        sort: "scanDate desc",
        limit: 100,
        fields: "id,document,title_*,subtitle_*,scanDate,link,language,deleted,externallink",
    };
};

// get favorites of logged in user as Array
router.get("/", async (req, res, next) => {
    const { userId } = req.session;
    try {
        const data = await solr.post("/select", requestBody());
        var docs = data.response.docs.map((doc) => ({
            DocId: doc.id,
            document: doc.document,
            title: doc[`title_txt_${doc.language}`],
            subtitle: doc[`subtitle_txt_${doc.language}`],
            date: doc.scanDate?.split("T")[0],
            // link: doc.link || `/api/${apiVersion}/pdf/${doc.id}`,
            link: `/api/${apiVersion}/pdf/${doc.id}`,
            deleted: doc.deleted,
            externallink: doc.externallink
        }));
        if (userId) {
            docs = await Promise.all(
                docs.map(async (doc) => ({
                    ...doc,
                    isFavorite: (await models.Favorite.findOne({
                        where: {
                            UserId: userId,
                            DocId: doc.DocId,
                        },
                    }))
                        ? true
                        : false,
                }))
            );
        }
        res.status(200).send(docs);
    } catch (err) {
        console.log(err);
        next(err);
    }
})

module.exports = router;