import { useEffect, useState } from "react";
import { useAppContext } from "../context/AppContext";
import { assets, dummyAddress } from "../assets/assets";
import toast from "react-hot-toast";

const Cart = () => {
  const {
    products,
    currency,
    cartItems,
    setCartItems,
    removeFromCart,
    getCartCount,
    updateCartItem,
    navigate,
    getCartAmount,
    axios,
    user,
  } = useAppContext();
  const [cartArray, setCartArray] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [showAddress, setShowAddress] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [orderMode, setOrderMode] = useState("room"); // default
  const [paymentOption, setPaymentOption] = useState("COD");

  const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID;

  const [deliveryDetails, setDeliveryDetails] = useState({
    name: "",
    phone: "",
    room: "",
  });

  const getCart = () => {
    let tempArray = [];
    for (const key in cartItems) {
      const product = products.find((item) => item._id === key);
      product.quantity = cartItems[key];
      tempArray.push(product);
    }
    setCartArray(tempArray);
  };

  const getUserAddress = async () => {
    try {
      const { data } = await axios.get("/api/address/get");
      if (data.success) {
        setAddresses(data.addresses);
        if (data.addresses.length > 0) {
          setSelectedAddress(data.addresses[0]);
        }
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  // Razorpay script loader
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const placeOrder = async () => {
    try {
      if (!user) {
        return toast.error("Please login to place an order");
      }

      // COD
      if (paymentOption === "COD") {
        const { data } = await axios.post("/api/order/cod", {
          items: cartArray.map((item) => ({
            product: item._id,
            quantity: item.quantity,
          })),
          address: {
            name: deliveryDetails.name,
            phone: deliveryDetails.phone,
            room: deliveryDetails.room,
          },
          orderMode,
          paymentType: "COD",
        });

        if (data.success) {
          toast.success(data.message);
          setCartItems({});
          navigate("/my-orders");
        } else {
          toast.error(data.message);
        }
      } else {
        // Razorpay Flow
        const scriptLoaded = await loadRazorpayScript();
        if (!scriptLoaded) {
          return toast.error("Failed to load Razorpay SDK");
        }

        const { data } = await axios.post("/api/order/razorpay", {
          items: cartArray.map((item) => ({
            product: item._id,
            quantity: item.quantity,
          })),
          address: {
            name: deliveryDetails.name,
            phone: deliveryDetails.phone,
            room: deliveryDetails.room,
          },
          orderMode,
        });

        if (!data.success) {
          return toast.error(data.message);
        }

        const { razorpayOrder, orderId } = data;

        const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY_ID,
          amount: razorpayOrder.amount,
          currency: "INR",
          name: "HostelBite",
          description: "Order Payment",
          order_id: razorpayOrder.id,
          handler: async function (response) {
            const verification = await axios.post(
              "/api/order/razorpay/verify",
              {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                orderId,
                userId: user._id,
              }
            );

            if (verification.data.success) {
              toast.success("Order Placed Successfully");
              setCartItems({});
              navigate("/my-orders");
            } else {
              toast.error("Payment verification failed.");
            }
          },
          prefill: {
            name: deliveryDetails.name,
            email: user.email,
            contact: deliveryDetails.phone,
          },
          notes: {
            address: `Room No: ${deliveryDetails.room}`,
          },
          theme: {
            color: "#3399cc",
          },

          // 💡 Restrict payment methods
          method: {
            upi: true,
            card: true,
            netbanking: false,
            wallet: false,
            emi: false,
            paylater: false,
          },
        };

        const razor = new window.Razorpay(options);
        razor.open();
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  useEffect(() => {
    if (products.length > 0 && cartItems) {
      getCart();
    }
  }, [products, cartItems]);

  useEffect(() => {
    if (user) {
      getUserAddress();
    }
  }, [user]);

  return products.length > 0 && cartItems ? (
    <div className="flex flex-col md:flex-row mt-10">
      <div className="flex-1 max-w-4xl">
        <h1 className="text-3xl font-medium mb-6">
          Shopping Cart{" "}
          <span className="text-sm text-primary">{getCartCount()} Itmes</span>
        </h1>

        <div className="grid grid-cols-[2fr_1fr_1fr] text-gray-500 text-base font-medium pb-3">
          <p className="text-left">Product Details</p>
          <p className="text-center">Subtotal</p>
          <p className="text-center">Action</p>
        </div>

        {cartArray.map((product, index) => (
          <div
            key={index}
            className="grid grid-cols-[2fr_1fr_1fr] text-gray-500 items-center text-sm md:text-base font-medium pt-3"
          >
            <div className="flex items-center md:gap-6 gap-3">
              <div
                onClick={() => {
                  navigate(
                    `/products/${product.category.toLowerCase()}/${product._id}`
                  );
                  scrollTo(0, 0);
                }}
                className="cursor-pointer w-24 h-24 flex items-center justify-center border border-gray-300 rounded"
              >
                <img
                  className="max-w-full h-full object-cover"
                  src={product.image[0]}
                  alt={product.name}
                />
              </div>
              <div>
                <p className="hidden md:block font-semibold">{product.name}</p>
                <div className="font-normal text-gray-500/70">
                  <p>
                    Weight: <span>{product.weight || "N/A"}</span>
                  </p>
                  <div className="flex items-center">
                    <p>Qty:</p>
                    <select
                      onChange={(e) =>
                        updateCartItem(product._id, Number(e.target.value))
                      }
                      value={cartItems[product._id]}
                      className="outline-none"
                    >
                      {Array(
                        cartItems[product._id] > 9 ? cartItems[product._id] : 9
                      )
                        .fill("")
                        .map((_, index) => (
                          <option key={index} value={index + 1}>
                            {index + 1}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
            <p className="text-center">
              {currency}
              {product.price * product.quantity}
            </p>
            <button
              onClick={() => removeFromCart(product._id)}
              className="cursor-pointer mx-auto"
            >
              <img
                className="inline-block w-6 h-6"
                src={assets.remove_icon}
                alt="remove"
              />
            </button>
          </div>
        ))}

        <button
          onClick={() => {
            navigate("/products");
            scrollTo(0, 0);
          }}
          className="group cursor-pointer flex items-center mt-8 gap-2 text-primary font-medium"
        >
          <img
            className="group-hover:-translate-x-1 transition"
            src={assets.arrow_right_icon_colored}
            alt="arrow"
          />
          Continue Shopping
        </button>
      </div>

      <div className="max-w-[360px] w-full bg-gray-100/40 p-5 max-md:mt-16 border border-gray-300/70">
        <h2 className="text-xl md:text-xl font-medium">Order Summary</h2>
        <hr className="border-gray-300 my-5" />

        {/* Order Mode Selection */}
        <div className="mb-8">
          <label className="block text-sm font-medium uppercase mb-2">
            Order Mode
          </label>
          <select
            value={orderMode}
            onChange={(e) => setOrderMode(e.target.value)}
            className="w-full border border-gray-300 bg-white px-3 py-2 outline-none"
          >
            <option value="room">Deliver to My Room</option>
            <option value="pickup">Self Pickup</option>
          </select>
        </div>

        {/* Address & Payment only if "room" mode */}
        {orderMode === "room" && (
          <div className="mb-6">
            <div className="mb-6">
              <p className="text-sm font-medium uppercase mb-2">
                Delivery Details
              </p>

              <input
                type="text"
                placeholder="Your Name"
                value={deliveryDetails.name}
                onChange={(e) =>
                  setDeliveryDetails({
                    ...deliveryDetails,
                    name: e.target.value,
                  })
                }
                className="w-full border border-gray-300 px-3 py-2 mb-3 outline-none bg-white"
              />

              <div className="flex gap-4 mb-3">
                <input
                  type="text"
                  placeholder="Mobile Number"
                  value={deliveryDetails.phone}
                  onChange={(e) =>
                    setDeliveryDetails({
                      ...deliveryDetails,
                      phone: e.target.value,
                    })
                  }
                  className="w-1/2 border border-gray-300 px-3 py-2 outline-none bg-white"
                />

                <input
                  type="text"
                  placeholder="Room Number"
                  value={deliveryDetails.room}
                  onChange={(e) =>
                    setDeliveryDetails({
                      ...deliveryDetails,
                      room: e.target.value,
                    })
                  }
                  className="w-1/2 border border-gray-300 px-3 py-2 outline-none bg-white"
                />
              </div>

              {/* Payment method */}
              <p className="text-sm font-medium uppercase mt-8">
                Payment Method
              </p>
              <select
                onChange={(e) => setPaymentOption(e.target.value)}
                className="w-full border border-gray-300 bg-white px-3 py-2 mt-2 outline-none"
              >
                <option value="COD">Cash On Delivery</option>
                <option value="Online">Online Payment</option>
              </select>
            </div>
          </div>
        )}

        <hr className="border-gray-300 mt-10" />

        {/* Price Section */}
        <div className="text-gray-500 mt-8 space-y-2">
          <p className="flex justify-between">
            <span>Price</span>
            <span>
              {currency}
              {getCartAmount()}
            </span>
          </p>
          <p className="flex justify-between">
            <span>Delivery Fee</span>
            <span className="text-green-600">
              {orderMode === "room" ? "₹5" : "Free"}
            </span>
          </p>
          <p className="flex justify-between">
            <span>Tax (2%)</span>
            <span>
              {currency}
              {(getCartAmount() * 2) / 100}
            </span>
          </p>
          <p className="flex justify-between text-lg font-medium mt-3">
            <span>Total Amount:</span>
            <span>
              {currency}
              {/* Add ₹10 delivery charge if room delivery */}
              {getCartAmount() +
                (getCartAmount() * 2) / 100 +
                (orderMode === "room" ? 5 : 0)}
            </span>
          </p>
        </div>

        <button
          onClick={placeOrder}
          className="w-full py-3 mt-6 cursor-pointer bg-primary text-white font-medium hover:bg-primary-dull transition"
        >
          {orderMode === "room"
            ? paymentOption === "COD"
              ? "Place Order"
              : "Proceed to UPI Payment"
            : "Place Pickup Order"}
        </button>
      </div>
    </div>
  ) : null;
};

export default Cart;
