const express = require("express")

const router = express.Router()

router.get("/first", (req, res) => {
    return res.status(200).json({
        "response": "success"
    });
});

module.exports = router

