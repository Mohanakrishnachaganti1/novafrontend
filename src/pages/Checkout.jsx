import React, { useEffect, useState, useContext, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./CSS/checkout.css";

import { usePO } from "../context/PurchaseOrderContext.jsx";
import { useGuest } from "../context/GuestContext.jsx";
import { UserContext } from "../context/UserContext.jsx";

const API_URL = import.meta.env.VITE_API_URL;
const TAX_RATE = 0.07;
const SHIPPING_FLAT = 15;
const FREE_SHIPPING_THRESHOLD = 500;

const getQty = (item) => Number(item.qty ?? item.quantity ?? 0);
const getPrice = (item) => Number(item.price ?? item.unitPrice ?? 0);

const Checkout = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const { guest, endGuestSession } = useGuest();
  const { user, loading } = useContext(UserContext);
  const { purchaseOrderId } = usePO();

  const { items = [], form = {} } = location.state || {};
  const [orderData] = useState(items);

  const [shippingInfo, setShippingInfo] = useState({
    firstName: "",
    lastName: "",
    company: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    country: "",
    phone: "",
  });

  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading) {
      if (!user && !guest) navigate("/checkout-guest");
      if (!orderData.length) navigate("/");
    }
  }, [user, guest, loading, navigate, orderData]);

  // =========================
  // CALCULATIONS
  // =========================
  const subtotal = useMemo(
    () => orderData.reduce((acc, item) => acc + getQty(item) * getPrice(item), 0),
    [orderData]
  );

  const shippingCost =
    subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FLAT;

  const estimatedTax = (subtotal + shippingCost) * TAX_RATE;
  const total = subtotal + shippingCost + estimatedTax;

  // =========================
  // FORM VALIDATION
  // =========================
  const validateForm = () => {
    const errors = {};

    if (!shippingInfo.firstName.trim()) {
      errors.firstName = "First name is required";
    }

    if (!shippingInfo.address.trim()) {
      errors.address = "Address is required";
    }

    if (!shippingInfo.city.trim()) {
      errors.city = "City is required";
    }

    if (!shippingInfo.zip.trim()) {
      errors.zip = "ZIP code is required";
    } else if (!/^[0-9A-Za-z\s-]{4,10}$/.test(shippingInfo.zip)) {
      errors.zip = "Invalid ZIP code";
    }

    if (!shippingInfo.country.trim()) {
      errors.country = "Country is required";
    }

    if (shippingInfo.phone && !/^[0-9+\-\s()]{7,20}$/.test(shippingInfo.phone)) {
      errors.phone = "Invalid phone number";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setShippingInfo((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when typing
    setFieldErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  };

  // =========================
  // STRIPE CHECKOUT
  // =========================
  const handleStripeCheckout = async () => {
    setError("");

    if (!validateForm()) {
      setError("Please fix the highlighted fields.");
      return;
    }

    setSubmitting(true);

    try {
      const saveRes = await fetch(`${API_URL}/api/purchase-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          items: orderData,
          shippingInfo,
          subtotal,
          shippingCost,
          estimatedTax,
          totalAmount: total,
          form,
          purchaseOrderId,
          ownerType: guest ? "Guest" : "User",
          ownerId: guest?._id || user?._id,
        }),
      });

      const saved = await saveRes.json();
      if (!saveRes.ok) throw new Error(saved.error || "Failed to save order");

      const orderId = saved?.order?._id;
      if (!orderId) throw new Error("Order ID not returned");

      const sessionRes = await fetch(
        `${API_URL}/api/payment/create-checkout-session`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId }),
        }
      );

      const sessionData = await sessionRes.json();
      if (!sessionRes.ok)
        throw new Error(sessionData.error || "Stripe session creation failed");

      if (guest && endGuestSession) endGuestSession();

      window.location.assign(sessionData.url);
    } catch (err) {
      console.error("Checkout error:", err);
      setError(err.message || "Checkout failed");
      setSubmitting(false);
    }
  };

  if (loading) return null;
  if (!user && !guest) return null;

  return (
    <div className="purchase-order-form">
      <div className="business-log-purchase">
        <img src="/images/logo.png" alt="Company Logo" />
      </div>

      <h2>Checkout</h2>

      <div className="po-container">
        {/* LEFT COLUMN */}
        <div className="po-left po-form-section">
          <h3>Shipping Details</h3>

          <input
            name="firstName"
            placeholder="First Name"
            value={shippingInfo.firstName}
            onChange={handleInputChange}
            className={fieldErrors.firstName ? "error" : ""}
          />
          {fieldErrors.firstName && (
            <span className="field-error">{fieldErrors.firstName}</span>
          )}

          <input
            name="address"
            placeholder="Address"
            value={shippingInfo.address}
            onChange={handleInputChange}
            className={fieldErrors.address ? "error" : ""}
          />
          {fieldErrors.address && (
            <span className="field-error">{fieldErrors.address}</span>
          )}

          <input
            name="city"
            placeholder="City"
            value={shippingInfo.city}
            onChange={handleInputChange}
            className={fieldErrors.city ? "error" : ""}
          />
          {fieldErrors.city && (
            <span className="field-error">{fieldErrors.city}</span>
          )}

          <input
            name="zip"
            placeholder="ZIP Code"
            value={shippingInfo.zip}
            onChange={handleInputChange}
            className={fieldErrors.zip ? "error" : ""}
          />
          {fieldErrors.zip && (
            <span className="field-error">{fieldErrors.zip}</span>
          )}

          <input
            name="country"
            placeholder="Country"
            value={shippingInfo.country}
            onChange={handleInputChange}
            className={fieldErrors.country ? "error" : ""}
          />
          {fieldErrors.country && (
            <span className="field-error">{fieldErrors.country}</span>
          )}

          <input
            name="phone"
            placeholder="Phone"
            value={shippingInfo.phone}
            onChange={handleInputChange}
            className={fieldErrors.phone ? "error" : ""}
          />
          {fieldErrors.phone && (
            <span className="field-error">{fieldErrors.phone}</span>
          )}
        </div>

        {/* RIGHT COLUMN */}
        <div className="po-right po-form-section">
          <h3>Purchase Order Summary</h3>

          {orderData.map((item, idx) => (
            <div className="summary-item" key={idx}>
              <div className="item-thumbnail">
                {(item.images?.[0] || item.image) && (
                  <img
                    src={item.images?.[0] || item.image}
                    alt={item.name || item.description}
                    width={60}
                    height={60}
                  />
                )}
              </div>
              <div className="item-details">
                <span>{item.name || item.description}</span>
                <span>Qty: {getQty(item)}</span>
                <span>Price: ${getPrice(item).toFixed(2)}</span>
              </div>
            </div>
          ))}

          <div className="summary-row">
            <span>Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>

          <div className="summary-row">
            <span>Shipping</span>
            <span>${shippingCost.toFixed(2)}</span>
          </div>

          <div className="summary-row">
            <span>Estimated Tax</span>
            <span>${estimatedTax.toFixed(2)}</span>
          </div>

          <hr />

          <div className="grand-total">
            <strong>Total: ${total.toFixed(2)}</strong>
          </div>

          {error && <p className="po-form-error">{error}</p>}

          <button
            type="button"
            onClick={handleStripeCheckout}
            disabled={submitting}
          >
            {submitting ? "Redirecting..." : "Place Order"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
