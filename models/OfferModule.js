import mongoose from "mongoose";

const OfferModuleSchema = new mongoose.Schema(
  {
    offerName: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    description: { type: String, default: "" },
    banner: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
    products: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ],
  },
  { timestamps: true }
);

// If model was previously compiled without new fields in hot-reload runtime, extend schema
if (mongoose.models.OfferModule) {
  const existingSchema = mongoose.models.OfferModule.schema;
  if (!existingSchema.path("description")) existingSchema.add({ description: { type: String, default: "" } });
  if (!existingSchema.path("banner")) existingSchema.add({ banner: { type: String, default: "" } });
  if (!existingSchema.path("isActive")) existingSchema.add({ isActive: { type: Boolean, default: true } });
  if (!existingSchema.path("products")) {
    existingSchema.add({
      products: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
        },
      ],
    });
  }
}

export default mongoose.models.OfferModule || mongoose.model("OfferModule", OfferModuleSchema);
