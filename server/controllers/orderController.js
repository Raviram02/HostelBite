import Order from "../models/Order.js";
import Product from "../models/Product.js";
import stripe from "stripe";
import User from "../models/User.js";
import razorpay from "../configs/razorpay.js";
import crypto from "crypto";

// Place Order COD : /api/order/cod
export const placeOrderCOD = async (req, res) => {
  try {
    const userId = req.user.id;
    const { items, address, orderMode } = req.body;

    if (!items || items.length === 0) {
      return res.json({ success: false, message: "Cart is empty" });
    }

    if (!orderMode) {
      return res.json({ success: false, message: "Order mode is required" });
    }

    if (orderMode === "room") {
      if (!address || !address.name || !address.phone || !address.room) {
        return res.json({
          success: false,
          message: "Incomplete delivery details",
        });
      }
    }

    // Calculate amount
    let amount = await items.reduce(async (acc, item) => {
      const product = await Product.findById(item.product);
      return (await acc) + product.price * item.quantity;
    }, 0);

    amount += Math.floor(amount * 0.02); // Add 2% tax
    if (orderMode === "room") amount += 10; // Add ₹10 delivery fee if room delivery

    // Save order
    await Order.create({
      userId,
      items,
      amount,
      address,
      orderMode,
      paymentType: orderMode === "room" ? "COD" : "OC",
      isPaid: false,
    });

    return res.json({ success: true, message: "Order Placed Successfully" });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};

// Place Order RazorPay : /api/order/razorpay
export const placeOrderRazorpay = async (req, res) => {
  try {
    const userId = req.user.id; // Authenticated user
    const { items, address, orderMode } = req.body;
    const { origin } = req.headers;

    // Validations
    if (!items || items.length === 0) {
      return res.json({ success: false, message: "Cart is empty" });
    }

    if (!orderMode) {
      return res.json({
        success: false,
        message: "Incomplete delivery details",
      });
    }

    if (orderMode === "room") {
      if (!address?.name || !address?.room || !address?.phone) {
        return res.json({
          success: false,
          message: "Incomplete delivery details",
        });
      }
    }

    // Calculate total amount
    let productData = [];
    let amount = await items.reduce(async (acc, item) => {
      const product = await Product.findById(item.product);
      productData.push({
        name: product.name,
        price: product.price,
        quantity: item.quantity,
      });
      return (await acc) + product.price * item.quantity;
    }, 0);

    // Add Tax (2%)
    amount += Math.floor(amount * 0.02);

    // Razorpay requires minimum ₹1 = 100 paise
    const finalAmount = amount * 100;

    // Create internal order

    console.log("Creating Razorpay Order with amount:", finalAmount);
    console.log("UserId:", userId);

    const order = await Order.create({
      userId,
      items,
      amount,
      address,
      orderMode,
      paymentType: "Online",
      isPaid: false,
    });

    // Create Razorpay Order
    const options = {
      amount: finalAmount, // in paise
      currency: "INR",
      receipt: order._id.toString(),
      notes: {
        userId,
        orderId: order._id.toString(),
      },
    };

    const razorpayOrder = await razorpay.orders.create(options);

    return res.json({
      success: true,
      orderId: order._id,
      razorpayOrder,
    });
  } catch (error) {
    console.error("Razorpay Order Error:", error.message);
    return res.json({ success: false, message: error.message });
  }
};

// Verify Razorpay Payment : /api/order/razorpay/verify
export const verifyRazorpayPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderId,
      userId,
    } = req.body;

    // Step 1: Create expected signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_SECRET_KEY)
      .update(body.toString())
      .digest("hex");

    // Step 2: Match signatures
    const isValid = expectedSignature === razorpay_signature;

    if (isValid) {
      // Step 3: Mark order as paid
      await Order.findByIdAndUpdate(orderId, { isPaid: true });
      await User.findByIdAndUpdate(userId, { cartItems: {} });

      return res.json({
        success: true,
        message: "Payment verified successfully",
      });
    } else {
      return res
        .status(400)
        .json({ success: false, message: "Invalid payment signature" });
    }
  } catch (error) {
    console.error("Payment verification error:", error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Place Order Stripe : /api/order/stripe
export const placeOrderStripe = async (req, res) => {
  try {
    const userId = req.user.id; // ✅ Secure source of userId
    const { items, address, orderMode } = req.body;
    const { origin } = req.headers;

    if (!items || items.length === 0) {
      return res.json({ success: false, message: "Cart is empty" });
    }

    if (!orderMode) {
      return res.json({
        success: false,
        message: "Incomplete delivery details",
      });
    }

    if (orderMode === "room") {
      if (!address?.name || !address?.room || !address?.phone) {
        return res.json({
          success: false,
          message: "Incomplete delivery details",
        });
      }
    }

    let productData = [];
    let amount = await items.reduce(async (acc, item) => {
      const product = await Product.findById(item.product);
      productData.push({
        name: product.name,
        price: product.price,
        quantity: item.quantity,
      });
      return (await acc) + product.price * item.quantity;
    }, 0);

    // Add Tax Charge (2%)
    amount += Math.floor(amount * 0.02);

    // Create Order (initially unpaid)
    const order = await Order.create({
      userId,
      items,
      amount,
      address,
      orderMode,
      paymentType: "Online",
      isPaid: false,
    });

    // Stripe Gateway Initialize
    const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY);

    // Prepare Stripe line items
    const line_items = productData.map((item) => {
      return {
        price_data: {
          currency: "inr",
          product_data: {
            name: item.name,
          },
          unit_amount: Math.floor(item.price + item.price * 0.02) * 100, // includes tax
        },
        quantity: item.quantity,
      };
    });

    // Create Stripe checkout session
    const session = await stripeInstance.checkout.sessions.create({
      line_items,
      mode: "payment",
      success_url: `${origin}/loader?next=my-orders`,
      cancel_url: `${origin}/cart`,
      metadata: {
        orderId: order._id.toString(),
        userId,
      },
    });

    return res.json({ success: true, url: session.url });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};

// Stripe Webhooks to Verify Payments Action : /stripe
export const stripeWebhooks = async (request, response) => {
  // Stripe Gateway Initialize
  const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY);

  const sig = request.headers["stripe-signature"];
  let event;

  try {
    event = stripeInstance.webhooks.constructEvent(
      request.body,
      sig,
      process.env.STRIPE_SECRET_KEY
    );
  } catch (error) {
    response.status(400).sendl(`Webhook Error: ${error.message}`);
  }

  // Handle the event
  switch (event.type) {
    case "payment_intent.succeeded": {
      const paymentIntent = event.data.object;
      const paymentIntentId = paymentIntent.id;

      // Getting Session Metadata
      const session = await stripeInstance.checkout.sessions.list({
        payment_intent: paymentIntentId,
      });

      const { orderId, userId } = session.data[0].metadata;
      // Mark Payment as Paid
      await Order.findByIdAndUpdate(orderId, { isPaid: true });
      // Clear user cart
      await User.findByIdAndUpdate(userId, { cartItems: {} });
      break;
    }
    case "payment_intent.payment_failed": {
      const paymentIntent = event.data.object;
      const paymentIntentId = paymentIntent.id;

      // Getting Session Metadata
      const session = await stripeInstance.checkout.sessions.list({
        payment_intent: paymentIntentId,
      });

      const { orderId } = session.data[0].metadata;
      await Order.findByIdAndDelete(orderId);
      break;
    }

    default:
      console.error(`Unhandled event type ${event.type}`);
      break;
  }
  response.json({ received: true });
};

// Get Orders by User ID : /api/order/user
export const getUserOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const orders = await Order.find({ userId })
      .populate("items.product address")
      .sort({ createdAt: -1 });

    return res.json({ success: true, orders });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};


// Get All Orders ( for seller / admin ) : /api/order/seller
export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find({})
      .populate("items.product address")
      .sort({ createdAt: -1 });

    return res.json({ success: true, orders });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};



// Update Order Status : /api/order/status/:orderId
export const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    order.status = status;
    await order.save();

    res.status(200).json({ message: "Order status updated", order });
  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update paid Status : /api/order/mark-paid/:orderId
export const markOrderPaid = async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    order.isPaid = true;
    await order.save();

    res.status(200).json({ success: true, message: "Order marked as paid" });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

