const express = require("express");
const { requireAdmin } = require("../../middleware/auth");
const controller = require("../../controller/admin/users.controller");

const router = express.Router();

router.get("/", requireAdmin, controller.getUsers);
router.post("/", requireAdmin, controller.createUser);
router.put("/:id", requireAdmin, controller.updateUser);
router.delete("/:id", requireAdmin, controller.deleteUser);

module.exports = router;