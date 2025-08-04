const mongoose = require("mongoose");

const locationSchema = new mongoose.Schema(
  {
    city: {
      type: String,
      required: true,
      trim: true,
    },
    state: {
      type: String,
      trim: true,
    },
    country: {
      type: String,
      required: true,
      trim: true,
    },
    countryCode: {
      type: String,
      required: true,
      uppercase: true,
      length: 2,
    },
    latitude: {
      type: Number,
      min: -90,
      max: 90,
    },
    longitude: {
      type: Number,
      min: -180,
      max: 180,
    },
    timeZone: {
      type: String,
      required: true,
    },
    utcOffset: {
      type: Number,
      required: true,
    },
    streetAddress: {
      type: String,
      trim: true,
    },
    postalCode: {
      type: String,
      trim: true,
    },
    barangay: {
      type: String,
      trim: true,
    },
    data: {
      type: mongoose.Schema.Types.Mixed, // For storing additional geocoding data
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for searching
locationSchema.index({ city: 1, country: 1 });
locationSchema.index({ countryCode: 1 });

// Virtual for frontend compatibility
locationSchema.virtual("street").get(function () {
  return this.streetAddress;
});

locationSchema.virtual("province").get(function () {
  return this.state;
});

locationSchema.virtual("postal_code").get(function () {
  return this.postalCode;
});

// Ensure virtuals are included when converting to JSON
locationSchema.set("toJSON", { virtuals: true });
locationSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Location", locationSchema);
