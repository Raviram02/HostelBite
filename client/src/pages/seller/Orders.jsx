import React, { use, useEffect, useState } from "react";
import { useAppContext } from "../../context/AppContext";
import { assets, dummyOrders } from "../../assets/assets";
import toast from "react-hot-toast";

const Orders = () => {
  const { currency, axios } = useAppContext();
  const [orders, setOrders] = useState([]);
  const [paidMap, setPaidMap] = useState({});
  const [statusMap, setStatusMap] = useState({});

  const fetchOrders = async () => {
    try {
      const { data } = await axios.get("/api/order/seller");
      if (data.success) {
        setOrders(data.orders);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleStatusUpdate = (orderId, newStatus) => {
    console.log("Update status for:", orderId, "to:", newStatus);
    // 🔜 Later: call your API endpoint to update status
  };

  const handleTogglePaid = (orderId) => {
    console.log("Toggle paid for:", orderId);
    // 🔜 Later: call your API to toggle isPaid
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  return (
    <div className="no-scrollbar flex-1 h-[95vh] overflow-y-scroll">
      <div className="md:p-10 p-4 space-y-10">
        <h2 className="text-lg font-medium">Orders List</h2>

        {orders.map((order, index) => (
          <div
            key={index}
            className="flex flex-col md:items-center md:flex-row gap-5 justify-between p-8 max-w-7xl rounded-md border border-gray-300 mb-15"
          >
            {/* Product List */}
            <div className="flex gap-5 max-w-80">
              <img
                className="w-12 h-12 object-cover"
                src={assets.box_icon}
                alt="boxIcon"
              />
              <div>
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex flex-col">
                    <p className="font-medium">
                      {item.product.name}{" "}
                      <span className="text-primary">x {item.quantity}</span>
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Delivery Details */}
            <div className="text-sm md:text-base text-black/60">
              <p className="text-black/80 font-medium">Delivery Details:</p>
              {order.orderMode === "room" ? (
                <>
                  <p>{order.address?.name}</p>
                  <p>Room No: {order.address?.room}</p>
                  <p>Phone: {order.address?.phone}</p>
                </>
              ) : (
                <p>N/A</p>
              )}
            </div>

            {/* Order Info */}
            <div className="flex flex-col text-sm md:text-base text-black/60">
              <p className="text-black/80 font-medium">Order Info:</p>
              <p>
                Mode:{" "}
                {order.orderMode === "room" ? "Room Delivery" : "Self Pickup"}
              </p>
              <p>
                Payment:{" "}
                {order.orderMode === "pickup"
                  ? "On Counter"
                  : order.paymentType}
              </p>

              {/* <p>Status: {order.status}</p> */}
              <p>Date: {new Date(order.createdAt).toLocaleDateString()}</p>
              {/* <p>Paid: {order.isPaid ? "Yes" : "No"}</p> */}
            </div>

            {/* Total Amount */}
            <div className="text-center my-auto">
              <p className="text-black/80 font-medium mb-1">Total Amount</p>
              <p className="font-semibold text-xl text-primary">
                {currency}
                {order.amount}
              </p>
            </div>

            {/* Status & Paid Toggle */}
            <div className="flex flex-col gap-3 bg-gray-50 p-2 rounded-md border border-gray-200 w-full md:w-80">
              {/* Status & Paid in row on md+, stacked on small */}
              <div className="flex flex-col md:flex-row justify-between items-stretch gap-3">
                {/* Order Status */}
                <div className="flex flex-col flex-1">
                  <label className="text-sm font-medium text-black/80 mb-1">
                    Status
                  </label>
                  <select
                    value={order.status}
                    onChange={(e) =>
                      handleStatusChange(order._id, e.target.value)
                    }
                    className="border border-gray-300 px-2 py-1 rounded text-sm"
                  >
                    <option value="Order Placed">Order Placed</option>
                    <option value="Ready for Pickup">Ready for Pickup</option>
                    <option value="Out for Delivery">Out for Delivery</option>
                    <option value="Delivered">Picked Up</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>

                {/* Paid Status */}
                <div className="flex flex-col flex-1">
                  <label className="text-sm font-medium text-black/80 mb-1">
                    Paid
                  </label>
                  <select
                    value={paidMap[order._id] ?? (order.isPaid ? "Yes" : "No")}
                    onChange={(e) =>
                      setPaidMap((prev) => ({
                        ...prev,
                        [order._id]: e.target.value,
                      }))
                    }
                    className="border border-gray-300 px-2 py-1 rounded text-sm"
                    disabled={order.isPaid || paidMap[order._id] === "Yes"} // Disable if already paid
                  >
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
              </div>

              {/* Update Button */}
              <div className="flex justify-end">
                <button
                  onClick={() => handleStatusUpdate(order._id, updatedStatus)}
                  className="text-white bg-primary hover:bg-primary-dull px-4 py-2 rounded text-sm transition"
                >
                  Update
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Orders;
