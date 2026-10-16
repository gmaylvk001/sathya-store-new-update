import mongoose from "mongoose";

const cartItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  },
  price: {
    type: Number,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  image: {
    type: String
  },
   warranty: { type: Number, default: 0 }, // ✅ Add this
  extendedWarranty: { type: Number, default: 0 }, // ✅ Add this
    warrantyData: {
    item_no: { type: String, default: null },
    name: { type: String, default: null },
    year: { type: Number, default: null },
    price: { type: Number, default: null },
  
  },
  upsells: [
    {
      name: String,
      price: Number,
    },
  ],

}, { _id: false });

const cartSchema = new mongoose.Schema({
  userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: undefined, // ⚡ important: undefined skips index
    },
    guestId: {
      type: String,
      default: undefined,
    },
  items: [cartItemSchema],
  totalItems: { type: Number, default: 0 },
  totalPrice: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// ✅ Unique either on userId OR guestId
//cartSchema.index({ userId: 1 }, { unique: true, sparse: true });
//cartSchema.index({ guestId: 1 }, { unique: true, sparse: true });

// ✅ Unique either on userId OR guestId (with partial filter)
cartSchema.index(
  { userId: 1 },
  { unique: true, partialFilterExpression: { userId: { $exists: true, $ne: null } } }
);
cartSchema.index(
  { guestId: 1 },
  { unique: true, partialFilterExpression: { guestId: { $exists: true, $ne: null } } }
);

/*
const cartSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  items: [cartItemSchema],
  totalItems: {
    type: Number,
    default: 0
  },
  totalPrice: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

*/

// Update totals before saving
cartSchema.pre('save', function(next) {
  this.totalItems = this.items.reduce((sum, item) => sum + item.quantity, 0);
  this.totalPrice = this.items.reduce(
    (sum, item) => sum + (item.price * item.quantity), 0
  );
  this.updatedAt = Date.now();
  next();
});

const Cart = mongoose.models.ecom_cart_info || mongoose.model('ecom_cart_info', cartSchema);
export default Cart;