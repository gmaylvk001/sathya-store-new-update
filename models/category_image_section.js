import mongoose from "mongoose";

const imageItemSchema = new mongoose.Schema({
  name: { type: String },
  image: { type: String },
  url: { type: String },
  status: { type: String, default: "active" },
});

const categoryImageSectionSchema = new mongoose.Schema(
  {
    category_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ecom_category_infos",
      required: true,
    },
    section_title: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      default: "active",
    },
    images: [imageItemSchema],
  },
  { timestamps: true }
);

export default mongoose.models.category_image_section ||
  mongoose.model("category_image_section", categoryImageSectionSchema);