import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "user",
    },
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
          ref: "product",
        },
        quantity: {
          type: Number,
          required: true,
        },
      },
    ],
    amount: {
      type: Number,
      required: true,
    },
    address: {
      name: {
        type: String,
        required: function () {
          return this.orderMode === "room";
        },
      },
      phone: {
        type: String,
        required: function () {
          return this.orderMode === "room";
        },
      },
      room: {
        type: String,
        required: function () {
          return this.orderMode === "room";
        },
      },
    },
    orderMode: {
      type: String,
      enum: ["room", "pickup"],
      required: true,
    },

    paymentType: {
      type: String,
      enum: ["COD", "Online"],
      required: true,
    },
    isPaid: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      default: "Order Placed",
    },
  },
  { timestamps: true }
);

const Order = mongoose.models.order || mongoose.model("order", orderSchema);

export default Order;
