function openCartPanel() {
    document.getElementById("cart-panel").classList.add("open");
    document.getElementById("cart-overlay").classList.add("open");
    renderCartPanel();
  }
  
  function closeCartPanel() {
    document.getElementById("cart-panel").classList.remove("open");
    document.getElementById("cart-overlay").classList.remove("open");
  }
  
  function renderCartPanel() {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    const container = document.getElementById("cart-panel-items");
    const totalEl = document.getElementById("cart-panel-total");
  
    container.innerHTML = "";
    let total = 0;
  
    cart.forEach(item => {
      total += item.price * item.qty;
      const div = document.createElement("div");
      div.classList.add("cart-item");
      div.innerHTML = `
        <div style="display:flex; align-items:center;">
          <img src="${item.image}" alt="${item.name}" style="width:50px; height:50px; object-fit:cover; border-radius:6px; margin-right:0.5rem;">
          <div>
            <strong>${item.name}</strong><br>
            ${item.qty} × ${item.price.toFixed(3)} DT
          </div>
        </div>
      `;
      container.appendChild(div);
    });
  
    totalEl.textContent = total.toFixed(3) + " DT";
  }
  
  // Lancer au chargement
  document.addEventListener("DOMContentLoaded", () => {
    const badge = document.querySelector(".cart-custom");
    const closeBtn = document.getElementById("close-cart");
    const overlay = document.getElementById("cart-overlay");
  
    if (badge) badge.addEventListener("click", openCartPanel);
    if (closeBtn) closeBtn.addEventListener("click", closeCartPanel);
    if (overlay) overlay.addEventListener("click", closeCartPanel);
  });
  