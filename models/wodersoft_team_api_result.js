import mongoose from "mongoose";

const WodersoftTeamApiResultSchema = new mongoose.Schema({
  order_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "orders_new",
    required: false,
    default: null,
  },
  json_text: { type: String, required: false, default: null },
  response_data: { type: String, required: false, default: null },
  created_at: { type: Date, required: false, default: null },
  updated_at: { type: Date, required: false, default: null },
}, {
  timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  collection: "wodersoft_team_api_result",
  strict: true,
});

WodersoftTeamApiResultSchema.index({ order_id: 1 }, { name: "order_id_relation" });

if (mongoose.models.wodersoft_team_api_result) {
  delete mongoose.models.wodersoft_team_api_result;
}

export default mongoose.model("wodersoft_team_api_result", WodersoftTeamApiResultSchema);
