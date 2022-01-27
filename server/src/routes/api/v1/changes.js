const router = require("express").Router();
const models = require("../../../models");
const solr = require("../../../middleware/solr");

// get favorites of logged in user as Array
router.get("/", async (req, res, next) => {
    const { userId } = req.session;
    try {
        const data = await solr.select_docs("*:*", { sort: "scanDate desc", limit: 100 });
        if (userId) {
            await Promise.all(
                data.response.docs.map(async (doc) => {
                    doc["isFavorite"] = (await models.Favorite.findOne({
                        where: {
                            UserId: userId,
                            DocId: doc.id,
                        },
                    }))
                })
            )
        }
        res.status(200).send(data.response.docs);
    } catch (err) {
        console.log(err);
        next(err);
    }
})

module.exports = router;