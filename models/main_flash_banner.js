import mongoose from "mongoose";

const CategoryBannerSchema = new mongoose.Schema({
  category_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'ecom_category_infos',
    required: true 
  },
  category_name: { type: String, required: true },
  category_slug: { type: String, required: true },
  banner_name: { type: String, required: true },
  banner_image: { type: String, required: true },
  redirect_url: { type: String },
  banner_status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
  banner_size: { type: String, default: "410x410" },
  display_order: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Create index for better performance
CategoryBannerSchema.index({ category_id: 1, display_order: 1 });
CategoryBannerSchema.index({ banner_status: 1 });

export default mongoose.models.CategoryBanner ||
  mongoose.model("main_flash_Banner", CategoryBannerSchema);