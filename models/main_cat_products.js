import mongoose from "mongoose";

const categoryBannerSchema = new mongoose.Schema({
  banner_name: {
    type: String,
    required: true,
    trim: true
  },
  banner_image: {
    type: String,
    required: true
  },
  category_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ecom_category_info', // Make sure this matches your actual category model name
    required: true
  },
  category_name: {
    type: String,
    required: true
  },
  category_slug: {
    type: String,
    required: true
  },
  redirect_url: {
    type: String,
    default: ""
  },
  banner_status: {
    type: String,
    enum: ["Active", "Inactive"],
    default: "Active"
  },
  display_order: {
    type: Number,
    default: 0
  },
  banner_type: {
    type: String,
    enum: ["top", "sub"],
    required: true
  }
}, {
  timestamps: true
});

// Index for better query performance
categoryBannerSchema.index({ category_id: 1, banner_type: 1, display_order: 1 });
categoryBannerSchema.index({ banner_status: 1 });

const CategoryBanner = mongoose.models.CategoryBanner || 
                      mongoose.model("CategoryBanner", categoryBannerSchema);

export default CategoryBanner;