/* global require, module */

const express = require("express");
const router = express.Router();

const {
  requestOtp,
  verifyOtp,
  resetPassword,
} = require("../controllers/passwordResetController");

router.post("/request", requestOtp);
router.post("/verify", verifyOtp);
router.post("/reset", resetPassword);

module.exports = router;