import { createInvoice, getInvoice, getInvoices } from "../controllers/invoice";
import verifyToken from "../middlewares/authMiddleware";
import checkUser from "../middlewares/checkUser";
import express from "express";

const router = express.Router();

router.post("/", verifyToken, checkUser, createInvoice);
router.get("/", verifyToken, checkUser, getInvoices);
router.get("/:invoiceId", verifyToken, checkUser, getInvoice);