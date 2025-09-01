import express from "express";

import { createUser,getUsers,getUserById,deleteUser,updateUser } from "../controllers/userController.js";

const router = express.Router();

router.get("/",getUsers);
router.get("/:id",getUserById);
router.post("/create",createUser);
router.put("/update/:id",updateUser);
router.delete("/delete/:id",deleteUser);

export default router;