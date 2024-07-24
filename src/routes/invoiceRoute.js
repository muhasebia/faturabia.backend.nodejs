import express from "express";
import verifyToken from '../middlewares/authMiddleware.js'
import checkUser from "../middlewares/checkUser.js";
import { createInvoice, getInvoice, getInvoices } from "../controllers/invoice.js";

const router = express.Router();

router.post("/", verifyToken, checkUser, createInvoice);
router.get("/", verifyToken, checkUser, getInvoices);
router.get("/:invoiceId", verifyToken, checkUser, getInvoice);

export default router;