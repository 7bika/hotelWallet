const mongoose = require('mongoose')
const slugify = require('slugify')
// const validator = require('validator')

const tourSchema = new mongoose.Schema(
   {
      name: {
         type: String,
         required: [true, 'A tour must have a name'],
         unique: true,
         trim: true,
         maxlength: [40, 'A tour name must have less or equal then 40 characters'],
         minlength: [5, 'A tour name must have more or equal then 10 characters']
         // validate: [validator.isAlpha, 'Tour name must only contain characters']
      },

      slug: String,

      duration: {
         type: Number,
         required: [true, 'A tour must have a duration']
      },

      maxGroupSize: {
         type: Number,
         required: [true, 'A tour must have a group size']
      },

      difficulty: {
         type: String,
         required: [true, 'A tour must have a difficulty'],
         enum: {
            values: ['easy', 'medium', 'difficult'],
            message: 'Difficulty is either: easy, medium, difficult'
         }
      },

      ratingsAverage: {
         type: Number,
         default: 4.5,
         min: [1, 'Rating must be above 1.0'],
         max: [5, 'Rating must be below 5.0'],
         set: val => Math.round(val * 10) / 10  //will run each time a new value is set for this field //4.666 , 46.66, 4.7
      },

      ratingsQuantity: {
         type: Number,
         default: 0
      },

      price: {
         type: Number,
         required: [true, 'A tour must have a price']
      },

      priceDiscount: {
         type: Number,
         validate: {
            validator: function (val) {
               // this only points to current doc on NEW document creation
               return val < this.price;
            },
            message: 'Discount price ({VALUE}) should be below regular price'
         }
      },

      summary: {
         type: String,
         trim: true,
         required: [true, 'A tour must have a description']
      },

      description: {
         type: String,
         trim: true
      },

      imageCover: {
         type: String,
         required: [true, 'A tour must have a cover image']
      },

      images: [String],

      createdAt: {
         type: Date,
         default: Date.now(),
         select: false
      },
      startDates: [Date],

      secretTour: {
         type: Boolean,
         default: false
      },

      // ^ embedding the location "resource" into tour : child referencing 1:many (1:few): we want the locations in tour also because we need location on every tour that's why we did not create a resource wahdou lil locations

      startLocation: {
         //  !! GeoJSON in order to be recognized by mongodb as a geospatial field it needs to have an object inside that field (startLocation) with at least two properties (type , coordinates)
         // ^ GeoJSON is a format for storing data about geographical features
         type: {
            type: String,
            default: 'Point',
            enum: ['Point']
         },
         // ^ type and coordinates are subdocuments (field inside of another field)
         coordinates: [Number],
         address: String,
         description: String
      },

      locations: [ // !! create a new document( locations ) and embedded inside another document( tour model ) we use "[]"

         {
            type: {
               type: String,
               default: 'Point',
               enum: ['Point']
            },
            coordinates: [Number],
            address: String,
            description: String,
            day: Number,
         }

      ],
      // * with embedding:
      //guides: Array

      // * with referencing:
      guides: [ // ^ sub-documents : embedded documents
         {
            type: mongoose.Schema.ObjectId,
            ref: 'User'
         }
      ]
   },

   {
      toJSON: { virtuals: true },
      toObject: { virtuals: true }
   },

   { timestamps: true }
)


// & improving read performance with indexes
tourSchema.index({ price: 1, ratingsAverage: -1 }) // 1 ascending , -1 descending
tourSchema.index({ slug: 1 })
tourSchema.index({ startLocation: '2dsphere' })


// & virtual properties
tourSchema.virtual('durationWeeks').get(function (req, res, next) {
   return this.duration / 7
})


// & virtual populate
tourSchema.virtual('reviews', {

   ref: 'Review', // * name of the model
   foreignField: 'tour',// * name of the field in the review model(we have tour field) where the id of the tour is stored 
   // where the reference to current model is stored in order to connect these two models(reviews and tours)
   localField: '_id'// * where that id is actually stored in the Tour model //this is how  _id is called in the local model is called tour in the foreign model(Review model)
   // ^ this is the way to populate the tour model with guides : EMBEDDING

})


// * DOCUMENT MIDDLEWARE: runs before .save() and .create() not save in tourSchema.pre('save') no //save( ) ila hiya new Tour.save() or new Tour.create() // not on insertMany() or findById or findBuIdAndUpdate or findByIdAndDelete 
//each time a document is saved into the database, run a function between the process of saving and the actual saving or also after the saving
tourSchema.pre('save', function (next) {//before a document is saved to the database

   console.log(this)// & the currently being saved document
   this.slug = slugify(this.name, { lower: true }) //slugify is used in the url //the-sea-explorer so we can put it in the url
   next()//to move to the next middleware
})


// & pre save hook document middleware
tourSchema.pre('save', function (next) {
   console.log('saving document ...')

   next()
})


// & post save hook document middleware
tourSchema.post('save', function (doc, next) {//after a document is saved to the database
   console.log(doc)// * the currently finished saving document
   next()
})


// ^ this is the way to populate the tour model with guides : EMBEDDING
// tourSchema.pre('save', async function (next) {

// const guidesPromises = this.guides.map(async id => await User.findById(id)) // ! this.guides is an array of user ids //kol iteration returns an array of promises //asynchronous function that returns a promises // an array of promises //Promise.all
// this.guides = await Promise.all(guidesPromises)

// next()
// })


// & QUERY MIDDLEWARE
tourSchema.pre(/^find/, function (next) { //before a query is executed 
   // ! for every query that starts with find // ! the difference between query and document middleware is the "find" keyword  /// find will point to the current query 
   //! executed before the const tours = await query

   this.find({ secretTour: { $ne: true } })

   this.start = Date.now() // & date before the query 
   next()
})


// & post find hook query middleware
tourSchema.post(/^find/, function (docs, next) {//after the query is executed so it has access to the document that has been returned //query middleware is used with findById,  findByIdAndUpdate, findOne , findByIdAndDelete,  findByIdAndRemove , remove , init  but we only the find ones  

   console.log(`query took ${Date.now() - this.start} milliseconds`)// & date after the query - date before the query

   console.log(docs)
   next()
})


// * populating the tour with the guides from the guides fields in tour model: for every query that starts with find
// * doing it here instead of repeating it every time in the tourController
tourSchema.pre(/^find/, function (next) {

   this.populate({ // this points to the current query(find)
      path: 'guides',
      select: '-__v -passwordChangedAt'
   })

   next()
})


// & AGGREGATION MIDDLEWARE
// tourSchema.pre('aggregate', function (next) { // ! excluded at the model level before it reaches the tourController aggregation pipeline 

//    this.pipeline().unshift({ $match: { secretTour: { $ne: true } } })

//    console.log(this.pipeline())//aggregation object : array // with 2 matches 

//    next()
// })



// & creating a model out of the schema
const Tour = mongoose.model('Tour', tourSchema)


module.exports = Tour

