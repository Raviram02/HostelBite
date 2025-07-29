import express from "express";
import authUser from "../middlewares/authUser.js";
import {
  getAllOrders,
  getUserOrders,
  markOrderPaid,
  placeOrderCOD,
  placeOrderRazorpay,
  placeOrderStripe,
  updateOrderStatus,
  verifyRazorpayPayment,
} from "../controllers/orderController.js";
import authSeller from "../middlewares/authSeller.js";

const orderRouter = express.Router();

orderRouter.post("/cod", authUser, placeOrderCOD);
orderRouter.get("/user", authUser, getUserOrders);
orderRouter.get("/seller", authSeller, getAllOrders);
// orderRouter.post("/stripe", authUser, placeOrderStripe);
orderRouter.post("/razorpay", authUser, placeOrderRazorpay);
orderRouter.post("/razorpay/verify", authUser, verifyRazorpayPayment);
orderRouter.put("/status/:orderId", authSeller, updateOrderStatus);
orderRouter.put("/mark-paid/:orderId", authSeller, markOrderPaid);

export default orderRouter;
