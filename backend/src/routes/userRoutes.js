const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");

router.get("/", userController.getUsers);
router.post("/", userController.insertUser);
router.delete("/:id", userController.deleteUser);
router.put("/:id", userController.updateUser);
router.post("/payment_account", userController.createPaymentAccount);

module.exports = router;
