const mongoose = require("mongoose")
const Room = require("./roomModel")
const Tour = require("./tourModel")

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, " a review cannot be empty "],
    },

    rating: {
      type: Number,
      max: 5,
      min: 1,
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },

    // ! each review knows what user it belongs to :
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: [true, "review must belong to a user"],
    },

    // ! each review knows what room it belongs to :
    room: {
      type: mongoose.Schema.ObjectId,
      ref: "Room",
    },

    // ! each review knows what tour it belongs to :
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: "Tour",
    },
  },

  //! when we have a virtual property (fields not stored in the database ) we want them (fields) show up whenever there is an output
  { toJSON: { virtuals: true } },
  { toObject: { virtuals: true } },

  { timestamps: true }
)

// & preventing duplicated reviews
// * each combination of room and user and tour has to be unique

reviewSchema.index({ room: 1, user: 1 }, { unique: true })

// ^ tour populating
reviewSchema.pre(/^find/, function (next) {
  // this.populate({
  //    path: 'tour', //tour inside this model going to be populated based on a tour model
  //    select: 'name'
  // }).populate({
  //    path: 'user',
  //    select: 'name photo',
  // })
  // ^ turn off the populated room on the review because we don't need it
  this.populate({
    path: "user",
    select: "name photo",
  })

  next()
})

// ^ room populating
reviewSchema.pre(/^find/, function (next) {
  // this.populate({
  //    path: 'room', // * the room field is gonna be populated the one from the schema
  //    select: 'name' // * only the selected property will be shown
  // }).populate({
  //    path: 'user',
  //    select: 'name photo',
  // })  //we used the second populate the one next because we wanna only populate the id of the room only //nested populate  // ^ turn off the populated room on the review because we don't need it

  this.populate({
    path: "user",
    select: "name photo",
  })

  next()
})

// ^ calculating the average ratings on a room
// * store the average rating and the number of ratings on each tour so that we don't have to query the reviews and calculate the average each time time we query for all the tours
// we will use middleware to call this function each time tha there is a new review or one is updated or deleted
// & static method:on the model calculating the  average ratings based on the number of ratings  on a room
reviewSchema.statics.calcAverageRatings = async function (roomId) {
  const stats = await this.aggregate([
    {
      $match: { room: roomId },
    },
    {
      $group: {
        _id: "$room",
        nRating: { $sum: 1 },
        avgRating: { $avg: "$rating" },
      },
    },
  ])
  console.log(stats)

  if (stats.length > 0) {
    await Room.findByIdAndUpdate(roomId, {
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: stats[0].avgRating,
    })
  } else {
    await Room.findByIdAndUpdate(roomId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5,
    })
  }
}

// & calculating the average ratings on a tour
reviewSchema.statics.calcAverageRatingsTour = async function (tourId) {
  const stats = await this.aggregate([
    // * points to the current model (Review)

    {
      $match: { tour: tourId }, // * select all the reviews that belong to the current tour that was passed in as an argument (tourId)// select the room that we want to update //that match the tourId
    },

    {
      $group: {
        _id: "$tour", // * grouping the rooms together by room
        numberOfRating: { $sum: 1 }, // * counting the number of ratings
        averageRating: { $avg: "$rating" }, // * from the rating field in this model
      },
    },
  ])

  console.log(stats)
  // & persisting ( saving ) the calcAverageRatings into tour // every tour should now have its new ratings and numbers of ratings : ratingsAverage and ratingQuantity
  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(
      tourId, //(tourId) by id
      {
        // fields to update

        ratingsQuantity: stats[0].numberOfRating, // ! stats is stored in an array  []
        //    [ { _id: 643c3051b0a56e55fccfa117,
        //      numberOfRating: 5,
        // averageRating: 4.84} ]

        ratingsAverage: stats[0].averageRating,
      }
    )
  } else {
    // ! updating the tour stats
    await Tour.findByIdAndUpdate(tourId, {
      // fields to update
      //  * default values
      ratingsQuantity: 0,
      ratingsAverage: 4.5,
    })
  }
}

// & call the calcAverageRatings because these stats will never get called
reviewSchema.post("save", function () {
  // ! post : after the review was saved in the db (was created)

  // * this point to the current review // constructor points to the Model who created that document // this.constructor = Review
  this.constructor.calcAverageRatings(this.room) // room for the schema
  // ! we cannot do Review.calcAverageRatings because Review is not yet defined const Review = mongoose.model('Review', reviewSchema)
})

reviewSchema.post("save", function () {
  // ! post : after the review was saved in the db

  // ! this point to the current review //we will want to call the calcAverageRatings function using this.tour
  // *  constructor points to the Model who created that document // this.constructor = Review
  this.constructor.calcAverageRatingsTour(this.tour) // tour for the schema //tourId that we're gonna pass inside the calcAverageRatings
  // ! we cannot do Review.calcAverageRatings because Review is not yet defined const Review = mongoose.model('Review', reviewSchema)
})

// * a review is updated or deleted using :
// findByIdAndUpdate
// findByIdAndDelete : // !  we do not have a document middleware we only have query middleware and in the query we do not have access to the document
// & pre middleware
reviewSchema.pre(/^findOneAnd/, async function (next) {
  // * we wanna access the current review document
  // !!! we're gonna executed the query and the result is the document that is being processed (r) by using findOne
  this.r = await this.findOne() // * this points to the current query // r stands for review
  // !!!!! we're storing the document inside the this(this.r) : ila hiya a query variable(this) we're storing the document in a query and by doing that we get access to it by the post middleware
  console.log(this.r)

  next()
})

//pre to post

reviewSchema.post(/^findOneAnd/, async function () {
  // * after the review has been updated
  await this.r.constructor.calcAverageRatings(this.r.room) // * getting data from the pre middleware to the post middleware by (this.r)  and with this.r we retrieve the review document from this variable // calcAverageRatings is a static method and we need to call it on the model
})

reviewSchema.post(/^findOneAnd/, async function () {
  // * after the review has been updated
  await this.r.constructor.calcAverageRatingsTour(this.r.tour) // * getting data from the pre middleware to the post middleware by (this.r)  and with this.r we retrieve the review document from this variable // calcAverageRatings is a static method and we need to call it on the model
})

const Review = mongoose.model("Review", reviewSchema)

module.exports = Review
