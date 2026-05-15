import mongoose from "mongoose";

const semanticCacheSchema = new mongoose.Schema(
  {
    resumeHash: {
      type: String,
      required: true,
      index: true,
    },
    jdHash: {
      type: String,
      required: true,
      index: true,
    },
    similarity: {
      type: Number,
      required: true,
    },
    score: {
      type: Number,
      required: true,
    },
    summary: {
      type: String,
      required: true,
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    meta: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for fast lookup of a specific pair
semanticCacheSchema.index({ resumeHash: 1, jdHash: 1 }, { unique: true });

// TTL index to expire cache after 7 days
semanticCacheSchema.index({ createdAt: 1 }, { expireAfterSeconds: 604800 });

const SemanticCache = mongoose.model("SemanticCache", semanticCacheSchema);

export default SemanticCache;
