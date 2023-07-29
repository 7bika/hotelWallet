const mongoose = require("mongoose")
const slugify = require("slugify")
// const validator = require('validator')

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "A product must have a name"],
      unique: true,

      maxlength: [
        20,
        "A product name must have less or equal than 40 characters",
      ],
      minlength: [
        1,
        "A product name must have more or equal than 10 characters",
      ],
      // validate: [validator.isAlpha, 'product name must only contain characters']
    },

    slug: String,

    categories: {
      type: String,
      required: [true, "A product must have a category"],
      enum: {
        values: [
          "entertainment",
          "Technology",
          "Personal Care Items",
          "clothes",
          "Souvenirs",
        ],
        message:
          " categories are either : entertainment, Technology , Personal Care Items, Souvenirs ",
      },
    },

    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, "Rating must be above 1.0"],
      max: [5, "Rating must be below 5.0"],
      set: (val) => Math.round(val * 10) / 10, //will run each time a new value is set for this field //4.666 , 46.66, 4.7
    },

    ratingsQuantity: {
      type: Number,
      default: 0,
    },

    price: {
      type: Number,
      required: [true, "A product must have a price"],
    },

    priceDiscount: {
      type: Number,
      validate: {
        validator: function (val) {
          // this only points to current doc on NEW document creation
          return val < this.price
        },
        message: "Discount price ({VALUE}) should be below regular price",
      },
    },

    summary: {
      type: String,
      trim: true,
      required: [true, "A product must have a description"],
    },

    description: {
      type: String,
      trim: true,
    },

    imageCover: {
      type: String,
      required: [true, "A product must have a cover image"],
    },

    images: [String],
  },

  { toJSON: { virtuals: true } },
  { toObject: { virtuals: true } },

  { timestamps: true }
)

// & improving read performance with indexes
productSchema.index({ price: 1, ratingsAverage: -1 }) // 1 ascending , -1 descending

// & virtual populate
// productSchema.virtual("reviews", {
//   ref: "Review", // * name of the model
//   foreignField: "product", // * name of the field in the review model(we have tour field) where the id of the tour is stored
//   // where the reference to current model is stored in order to connect these two models(reviews and tours)
//   localField: "_id", // * where that id is actually stored in the Tour model //this is how  _id is called in the local model is called tour in the foreign model(Review model)
//   // ^ this is the way to populate the tour model with guides : EMBEDDING
// })

// * DOCUMENT MIDDLEWARE: runs before .save() and .create() not save in tourSchema.pre('save') no //save( ) ila hiya new Tour.save() or new Tour.create() // not on insertMany() or findById or findBuIdAndUpdate or findByIdAndDelete
//each time a document is saved into the database, run a function between the process of saving and the actual saving or also after the saving
productSchema.pre("save", function (next) {
  //before a document is saved to the database

  console.log(this) // & the currently being saved document
  this.slug = slugify(this.name, { lower: true }) //slugify is used in the url //the-sea-explorer so we can put it in the url
  next() //to move to the next middleware
})

// & pre save hook document middleware
productSchema.pre("save", function (next) {
  console.log("saving document ...")

  next()
})

// & post save hook document middleware
productSchema.post("save", function (doc, next) {
  //after a document is saved to the database
  console.log(doc) // * the currently finished saving document
  next()
})

// & QUERY MIDDLEWARE

productSchema.pre(/^find/, function (next) {
  this.start = Date.now()

  next()
})

// & post find hook query middleware
productSchema.post(/^find/, function (docs, next) {
  //after the query is executed so it has access to the document that has been returned //query middleware is used with findById,  findByIdAndUpdate, findOne , findByIdAndDelete,  findByIdAndRemove , remove , init  but we only the find ones

  console.log(`query took ${Date.now() - this.start} milliseconds`) // & date after the query - date before the query

  console.log(docs)
  next()
})

// & creating a model out of the schema
const Product = mongoose.model("Product", productSchema)

module.exports = Product
