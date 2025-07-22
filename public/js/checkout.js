document.addEventListener("DOMContentLoaded", () => {
  const checkoutForm = document.getElementById("checkout-form");
  const cbWrapper = document.getElementById("cb-wrapper");
  const paymentOptionsContainer = document.getElementById("paiement-options");
  const submitButton = checkoutForm.querySelector("button[type='submit']");

  if (!checkoutForm || !cbWrapper || !paymentOptionsContainer || !submitButton) {
    console.error("One or more required checkout elements are missing.");
    return;
  }

  // Restyle the submit button to match the cart button
  Object.assign(submitButton.style, {
    background: "linear-gradient(135deg, #ff8a00, #e52e71)",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    padding: "12px 20px",
    fontSize: "1.1rem",
    fontWeight: "bold",
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(229, 46, 113, 0.3)",
    transition: "all 0.3s ease",
  });

  // Payment options
  const paymentOptions = `
    <div class="form-check">
      <input class="form-check-input" type="radio" name="paymentMethod" id="cod" value="cod" checked>
      <label class="form-check-label" for="cod">
        Cash on Delivery
      </label>
    </div>
    <div class="form-check">
      <input class="form-check-input" type="radio" name="paymentMethod" id="card" value="card">
      <label class="form-check-label" for="card">
        Credit Card
      </label>
    </div>
  `;
  paymentOptionsContainer.innerHTML = paymentOptions;

  // Handle payment method change
  document.querySelectorAll("input[name='paymentMethod']").forEach(radio => {
    radio.addEventListener("change", (e) => {
      if (e.target.value === "card") {
        handleCardPayment();
      } else {
        cbWrapper.innerHTML = "";
      }
    });
  });

  // Handle card payment
  async function handleCardPayment() {
    const cart = JSON.parse(localStorage.getItem("customCart")) || [];
    if (cart.length === 0) {
      alert("Your cart is empty.");
      return;
    }

    try {
      const response = await fetch("/.netlify/functions/create-payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ cart }),
      });

      if (!response.ok) {
        throw new Error("Failed to create payment");
      }

      const { data } = await response.json();
      const iframe = document.createElement("iframe");
      iframe.src = `https://app.paymee.tn/gateway/${data.token}`;
      iframe.style.width = "100%";
      iframe.style.height = "600px";
      iframe.style.border = "none";
      cbWrapper.innerHTML = "";
      cbWrapper.appendChild(iframe);
    } catch (error) {
      console.error("Error creating payment:", error);
      cbWrapper.innerHTML = "<p>Failed to load payment gateway. Please try again later.</p>";
    }
  }

  // Listen for Paymee postMessage
  window.addEventListener("message", (event) => {
    const allowedOrigins = [
      "https://app.paymee.tn",
      "https://sandbox.paymee.tn",
    ];
    if (!allowedOrigins.includes(event.origin)) {
      return;
    }

    if (event.data === "paymee.complete") {
      localStorage.removeItem("customCart");
      window.location.href = "/merci";
    }
  });

  // Handle form submission
  checkoutForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const paymentMethod = document.querySelector("input[name='paymentMethod']:checked").value;

    if (paymentMethod === "cod") {
      const formData = new FormData(checkoutForm);
      const data = Object.fromEntries(formData.entries());
      const cart = JSON.parse(localStorage.getItem("customCart")) || [];

      if (cart.length === 0) {
        alert("Your cart is empty.");
        return;
      }

      try {
        const response = await fetch("/.netlify/functions/create-order", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ ...data, cart }),
        });

        if (!response.ok) {
          throw new Error("Failed to create order");
        }

        localStorage.removeItem("customCart");
        window.location.href = "/merci-livraison";
      } catch (error) {
        console.error("Error creating order:", error);
        alert("Failed to create order. Please try again later.");
      }
    }
  });
});
