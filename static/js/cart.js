const CART_KEY = "customCart";

export function getCart() {
  return JSON.parse(localStorage.getItem(CART_KEY) || "[]");
}

export function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

export function addToCart(product) {
  const cart = getCart();
  const index = cart.findIndex(item => item.id === product.id);

  if (index !== -1) {
    cart[index].quantity += 1;
  } else {
    cart.push({ ...product, quantity: 1 });
  }

  saveCart(cart);
}

export function removeFromCart(productId) {
  let cart = getCart();
  cart = cart.filter(item => item.id !== productId);
  saveCart(cart);
}

export function updateQuantity(productId, quantity) {
  const cart = getCart();
  const item = cart.find(p => p.id === productId);
  if (item) {
    item.quantity = quantity;
    saveCart(cart);
  }
}

export function clearCart() {
  localStorage.removeItem(CART_KEY);
}