const mongoose = require('mongoose');
const slugify = require('slugify'); //npm i slugify


const roomSchema = new mongoose.Schema({

   name: {
      type: String,
      required: [true, "a room must have a name"],
      trim: true,
      maxlength: [20, "a name must not surpass 10 characters"],
      unique: true,
      // * validate: validator.isAlpha   //name contains characters between a-z A-Z
   },

   slug: String,

   type: {
      type: String,
      // required: [true, " a room must have a type"],
      required: false,
      unique: false,
      enum: {
         values: ["single", "double", "connecting rooms", "twin", "king", "suite", "presidantal suite", "cabana", "appartement"],
         message: " types are either : single, double, connecting rooms, twin, king, suite, presidantal suite, cabana, appartement "
      }
   },

   price: {
      type: Number,
      required: [true, " a room must have a price"],
      max: 150
   },

   priceDiscount: {
      type: Number,
      // * specifying our own validator : with validate returns either or false
      validate: {
         validator: function (priceDiscount) {
            //! only for creating new document // not gonna work on update
            return priceDiscount < this.price
         },
         message: " the discount price ({VALUE}) is higher than the price"
      }

   },

   summary: {
      type: String,
      trim: true,
      required: [true, " a room must have a summary"],
   },

   description: {
      type: String,
      trim: true,
      required: [true, " a room must have a description"],
   },

   ratingsAverage: {
      type: Number,
      default: 4.5,
      max: [5, " a room must a rating at maximum 5 "],
      min: [1, " a room must a rating at least 1 "],
      // * setter function : will run everytime a new value is set for this field (ratingsAverage)
      set: val => Math.round(val * 10) / 10 // * val : current value //4.666, 46.66, 47, 4.7 everystep of that set 
   },

   ratingsQuantity: {
      type: Number,
      default: 0
   },

   duration: {
      type: Number,
      required: [true, "a room must have a duration"],
      max: 30  // * duration in days max = 30 days
   },

   maxGroupSize: {
      type: Number,
      required: [true, "a room must have a group size"],
      max: 7
   },

   images: [String], //an array of all the images of the room

   startDates: [Date],

   createdAt: {
      type: Date,
      default: new Date(Date.now()).toLocaleString(),
      select: false // the user cannot select this field
   },

   secretRoom: {
      type: Boolean,
      default: false
   },

   startLocation: {
      //GeoJSON in order to specify geospatial data:
      type: {
         type: String,
         default: 'Point', // * we can specify other geometries like polygons or lines ...
         enum: ['Point']
      },
      coordinates: [Number], // * coordinates of the point with the longitude first and second latitude
      address: String,
      description: String, // * description of the location 
   },

   locations: [ // * we want to embed a document into another document so it needs to be an array // create a document inside a document but here location is not a document that why it must be an array that how embedding works // sub document 
      // !  [ ] the array will create a new document inside the parent document in our case room
      {
         type: {
            type: String,
            default: 'Point',
            enum: ['Point']
         },
         coordinates: [Number],
         address: String,
         description: String,
         day: Number, // * day of the room in which people will go to this location // day of the booking
      }
   ],
   // staff: [ // * sub document so embedded documents using referencing:
   //    {  // ! we expect the type of each the elements in the staff array to be a mongodb id 
   //       type: mongoose.Schema.ObjectId,
   //       ref: 'User', // * specifying the reference // parent reference
   //    }
   // ],

   // reviews:  [{ // ! child referencing the room referencing reviews
   //    type: mongoose.Schema.ObjectId,
   //    ref: 'Review'
   // }],

},

   // { timestamps: true } //createdAt : updatedAt :
   { toJSON: { virtuals: true } },
   { toObject: { virtuals: true } }

)

// & improving read performance with indexes
roomSchema.index({ price: 1, ratingsAverage: 1 }) // 1 ascending , -1 descending
roomSchema.index({ slug: 1 })


//^ mongoose middlewares:

//~ document middleware :
roomSchema.pre('save', function (next) { //! run before an actual event //save event just like in js 
   //! a callback function that is gonna run before a document is saved to the database 
   //!!! ONLY  before .save() and create() 

   // console.log(this) // * this refers to the currently processed document
   this.slug = slugify(this.name, { lower: true }) //a string that we wanna make a slug of a simple string of name
   next()
})

// ^ embedding user document (staff) into room document : creating user document inside of rooms : staff : [...]
// * each time a new room is saved: pre save middleware
// roomSchema.pre('save', async function (next) { //create a room with two staff // we put how many staff we want in postman //we will retrieve the two user documents corresponding to these two ids // we will create a staff array in which we have these two ids that we put in postman rooms fi westha staff staff : [{role: ..., "_id:"zdhao", "email":test@gmail.com .....}]

//    const staffPromises = this.staff.map(async id => await User.findById(id)) //an array of all the user ids 
//    this.staff = await Promise.all(staffPromises)
//    next()
// }) // ! this will only work when creating new documents not for updating or anything else


//  ?  post event middleware: post
// roomSchema.post('save', function (doc, next) {//! run after the save event //doc that was saved to the database
//    console.log(doc) // * we have access to the finished document
//    next()
// })


//~ Query middleware :
roomSchema.pre(/^find/, function (next) {
   //!!! ONLY  before .find() and findOne() findOneAndDelete()
   //! the this keyword will now point the current query and not the current document
   // ! wont be displayed to the public // in the result output : utility : secret room only for VIP
   //! getting a secret room by id should not work that's why we added the /^find/ which means get all the queries that start with find

   this.find({ secretRoom: { $ne: true } }) // * selecting all the documents where secretRoom is not true// we want to output only the rooms where secretRoom is false

   this.start = Date.now()

   next()

})

//  ?  post event middleware: post
roomSchema.post(/^find/, function (docs, next) { //! we have access to all the document that were returned from the query //query already finished

   console.log(`Query took ${Date.now() - this.start} milliseconds`)
   console.log(docs)

   next()

})

// ! populating the queries : the guides fields with the referenced user
// roomSchema.pre(/^find/, function (next) {

//    this.populate({ // ! this always points the current query 
// ! all of the queries (starts with find) will automatically populate the guides fields (staff) with the referenced user instead of repeating the same code every time
//       path: 'staff',  //.populate and name of the field that we want to populate
//       select: '-__v -passwordChangedAt' // we can also select the fields we want to get back //not in the output
//    })

//    next()
// })

//~ aggregation middleware : // we want to exclude the secret room from the aggregation:
roomSchema.pre('aggregate', function (next) {

   //! the this keyword will now point the current aggregation object and not the current document
   this.pipeline().unshift({ $match: { secretRoom: { $ne: true } } })
   console.log(this.pipeline())

   next()

})


//^ virtual properties: 
roomSchema.virtual('durationWeeks').get(function () { //*not gonna be persisted in the database // *each time we get our data from the data base gonna be called //each time we get data from tha database we need to recall this virtual property so that it can be with the schema in the real life

   return this.duration / 7 //convert this.duration from the object to weeks

})


// & indexing the price
roomSchema.index({ price: 1, ratingsAverage: 1 }) // * object with the name of the field // which field are required the most : performance related // 1 ,-1 sorting in ascending order or descending
roomSchema.index({ slug: 1 })
roomSchema.index({ startLocation: '2dsphere' })


//^ virtual populate :
roomSchema.virtual('reviews', { // * we want to populate the reviews field with the reviews that are referencing this room
   ref: 'Review', // * name of the mode lwe wanna reference 
   foreignField: 'room', // * name if the field in the other model (Review model) where the reference to the current model is stored // * from the reviewModel we have a field called room
   localField: '_id' // * this _id is called room in the foreign model (Review model)

})


const Room = mongoose.model('Room', roomSchema)


module.exports = Room