import mongoose from 'mongoose';

const LeadSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  mobile: { type: String, required: true },
  message: { type: String },
  preferred_time: { type: String },
  lead_title: { type: String },
  lead_type: { type: String },
  product_looking_for: { type: String },
  invoice_id: { type: String },
  store: { type: String },
  store_id: { type: String },
  referrel_url: { type: String },
  lead_source: { type: String },
  lead_campaign: { type: String },
  cookie_id: { type: String },
  ip_address: { type: String },
  adtarbo_crm_id: { type: String },
}, {
  timestamps: true,
  collection: 'leads'
});

export default mongoose.models.Lead || mongoose.model('Lead', LeadSchema);
