const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const DATA_DIR = path.join(__dirname, '..', 'data');
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
const PRODUCTS_FILE = path.join(DATA_DIR, 'products.json');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');

function ensure() {
  [DATA_DIR, UPLOADS_DIR].forEach((d) => {
    if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
  });

  if (!fs.existsSync(PRODUCTS_FILE)) {
    const seed = {
      bases: [
        {
          id: 'basic',
          name: 'Базовая футболка',
          description: 'Классический крой 100% хлопок',
          type: 'basic',
          basePrice: 990,
          printPrice: 500,
          sizes: ['S', 'M', 'L', 'XL', 'XXL'],
          active: true,
          colors: [
            { id: 'white', name: 'Белый', hex: '#ffffff', mockupFront: null, mockupBack: null, printArea: { x: 0.28, y: 0.22, w: 0.44, h: 0.42 } },
            { id: 'black', name: 'Чёрный', hex: '#111111', mockupFront: null, mockupBack: null, printArea: { x: 0.28, y: 0.22, w: 0.44, h: 0.42 } }
          ]
        },
        {
          id: 'oversize',
          name: 'Оверсайз',
          description: 'Свободный крой',
          type: 'oversize',
          basePrice: 1290,
          printPrice: 500,
          sizes: ['S', 'M', 'L', 'XL', 'XXL'],
          active: true,
          colors: [
            { id: 'white', name: 'Белый', hex: '#ffffff', mockupFront: null, mockupBack: null, printArea: { x: 0.26, y: 0.2, w: 0.48, h: 0.45 } }
          ]
        }
      ]
    };
    fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(seed, null, 2));
  }
  if (!fs.existsSync(ORDERS_FILE)) fs.writeFileSync(ORDERS_FILE, '[]');
}
ensure();

const readJson = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
const writeJson = (f, d) => fs.writeFileSync(f, JSON.stringify(d, null, 2));

function getProducts() { return readJson(PRODUCTS_FILE); }
function saveProducts(data) { writeJson(PRODUCTS_FILE, data); }
function getBase(baseId) { return getProducts().bases.find((b) => b.id === baseId); }

function upsertBase(base) {
  const data = getProducts();
  const idx = data.bases.findIndex((b) => b.id === base.id);
  if (idx >= 0) data.bases[idx] = base; else data.bases.push(base);
  saveProducts(data);
  return base;
}

function deleteBase(baseId) {
  const data = getProducts();
  data.bases = data.bases.filter((b) => b.id !== baseId);
  saveProducts(data);
}

function getOrders() { return readJson(ORDERS_FILE); }
function saveOrders(orders) { writeJson(ORDERS_FILE, orders); }

function createOrder(payload) {
  const orders = getOrders();
  const order = {
    id: uuidv4().slice(0, 8).toUpperCase(),
    status: 'new',
    paymentStatus: 'pending',
    paymentId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...payload
  };
  orders.unshift(order);
  saveOrders(orders);
  return order;
}

function updateOrder(id, patch) {
  const orders = getOrders();
  const idx = orders.findIndex((o) => o.id === id);
  if (idx < 0) return null;
  orders[idx] = { ...orders[idx], ...patch, updatedAt: new Date().toISOString() };
  saveOrders(orders);
  return orders[idx];
}

function getOrder(id) { return getOrders().find((o) => o.id === id) || null; }

module.exports = {
  UPLOADS_DIR, getProducts, saveProducts, getBase, upsertBase, deleteBase,
  getOrders, createOrder, updateOrder, getOrder
};
