import mongoose from "mongoose";

const OfferModuleSchema = new mongoose.Schema(
  {
    offerName: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
  },
  { timestamps: true }
);

export default mongoose.models.OfferModule || mongoose.model("OfferModule", OfferModuleSchema);
