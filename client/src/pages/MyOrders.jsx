import React, { useEffect, useState } from "react";
import { useAppContext } from "../context/AppContext";
import { dummyAddress, dummyOrders } from "../assets/assets";

function MyOrders() {
  const [myOrders, setMyOrders] = useState([]);
  const { currency, axios, user } = useAppContext();

  const fetchMyOrders = async () => {
    try {
      const { data } = await axios.get("/api/order/user");
      if (data.success) {
        setMyOrders(data.orders);
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchMyOrders();
    }
  }, [user]);

  return (
    <div className="mt-16 pb-16">
      <div className="flex flex-col items-end w-max mb-8">
        <p className="text-2xl font-medium uppercase">My Orders</p>
        <div className="w-16 h-0.5 bg-primary rounded-full"></div>
      </div>
      {myOrders.map((order, index) => (
        <div
          key={index}
          className="border border-gray-300 rounded-lg mb-10 p-4 py-5 max-w-4xl"
        >
          <p className="flex justify-between md:items-center text-gray-400 md:font-medium max-md:flex-col">
            <span>OrderId : {order._id}</span>

            <p>Date: {new Date(order.createdAt).toLocaleDateString()}</p>

            {/* Show status once here */}
            <p className="text-gray-400 font-medium mt-2 flex items-center gap-2">
              Order Status:
              <span
                className={`px-2 py-1 rounded-full text-sm font-semibold border
      ${
        order.status === "Order Placed"
          ? "bg-yellow-50 text-yellow-800 border-yellow-300"
          : order.status === "Preparing"
          ? "bg-orange-50 text-orange-700 border-orange-300"
          : order.status === "Ready for Pickup"
          ? "bg-sky-50 text-sky-800 border-sky-300"
          : order.status === "Picked Up"
          ? "bg-green-50 text-green-700 border-green-300"
          : order.status === "Out for Delivery"
          ? "bg-indigo-50 text-indigo-700 border-indigo-300"
          : order.status === "Delivered"
          ? "bg-emerald-50 text-emerald-700 border-emerald-300"
          : order.status === "Cancelled"
          ? "bg-rose-50 text-rose-700 border-rose-300"
          : "bg-gray-100 text-gray-700 border-gray-300"
      }`}
              >
                {order.status}
              </span>
            </p>
          </p>

          {order.items.map((item, index) => (
            <div
              key={index}
              className={`relative bg-white text-gray-500/70 border-b
             border-gray-300 flex flex-col md:flex-row md:items-center justify-between p-4 py-5 md:gap-16 w-full max-w-4xl`}
            >
              <div className="flex items-center mb-4 md:mb-0">
                <div className="bg-primary/10 p-4 rounded-lg">
                  <img
                    src={item.product.image[0]}
                    alt=""
                    className="w-16 h-16"
                  />
                </div>
                <div className="ml-4">
                  <h2 className="text-xl font-medium text-gray-800">
                    {item.product.name}
                  </h2>
                  <p>Category: {item.product.category}</p>
                </div>
              </div>

              <div className="flex flex-col justify-center md:ml-8 mb-4 md:mb-0"></div>
              <p className="font-medium">
                <p>Quantity: {item.quantity || "1"}</p>
                Amount: {currency}
                {item.product.price * item.quantity}
              </p>
            </div>
          ))}

          <p className="flex justify-between md:items-center text-gray-400 md:font-medium max-md:flex-col mt-5 gap-2">
            <span className="text-primary text-lg font-semibold">
              Order Mode :{" "}
              {order.orderMode === "room" ? "Room Delivery" : "Self Pickup"}
            </span>

            <span className="text-primary text-lg font-semibold">
              Payment :{" "}
              {order.paymentType === "OC" ? "On Counter" : order.paymentType}
            </span>

            <span className="text-primary text-lg font-semibold">
              Total Amount : {currency}
              {order.amount}
            </span>
          </p>
        </div>
      ))}
    </div>
  );
}

export default MyOrders;
