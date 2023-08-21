const Tour = require('./../models/tourModel')
const catchAsync = require('./../utils/catchAsync')
const AppError = require('./../utils/appError')
const multer = require('multer')
const sharp = require('sharp')

// & saving multer in the memory
const multerStorage = multer.memoryStorage()


// & multer filter : testing the uploaded file is an image
const multerFilter = (req, file, cb) => {
   if (file.mimetype.startsWith('image')) { // ^ mimetype: 'image/jpeg' starts with image
      cb(null, true)
   } else {
      cb(new AppError('Not an image! Please upload only images.', 400), false)
   }
}

// // & multer upload : for uploading images
// upload = multer({ dest: 'public/img/users' })// * dest : destination //where we save all the images that are being uploaded

// & multer upload : uploading the image
const upload = multer({
   storage: multerStorage,
   fileFilter: multerFilter
})


exports.uploadTourImages = upload.fields([
  // * only one field with the name image cover can be uploaded
  {name : "imageCover" , maxCount : 1 },
  // * only three field with the name images  can be uploaded
  {name : "images" , maxCount : 3 }

])

exports.resizeTourImages =  async (req,res,next) => {
  console.log(req.files)
  
  if (!req.files.imageCover || !req.files.images) return next()

  // 1) Cover image : 
  req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`
                        // * req.params.id = contains the id of the tour 
  await sharp(req.files.imageCover[0].buffer)
    .resize(2000, 1333)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/tours/${req.body.imageCover}`)

  // 2) Images
  req.body.images = []

  await Promise.all(
    req.files.images.map(async (file, i) => {
      const filename = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpeg`

      await sharp(file.buffer) // * stored in a buffer
      // * sharp librairy  
        .resize(2000, 1333)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`public/img/tours/${filename}`)

      req.body.images.push(filename);
    })
  )

 
  next()
}

exports.tourCheap = async (req, res, next) => {

   req.query.limit = '5',
      req.query.sort = '-ratingsAverage,price',
      req.query.fields = 'name,price,ratingsAverage,summary,difficulty,imageCover'

   next()
}


exports.createTour = catchAsync(async (req, res, next) => {

   //const tour = new Tour({}).save() //calling the method ( save ) on the document itself after it gets saved in te db
   const tour = await Tour.create(req.body) // calling the method( create ) on the model

   res.status(201).json({
      status: 'success',
      data: {
         tour: tour
      }
   })
})


exports.getAllTours = catchAsync(async (req, res, next) => {

   // ^ BUILD QUERY

   // *  1) Filtering

   const queryObj = { ...req.query }

   const excludedFields = ['page', 'limit', 'sort', 'fields']

   excludedFields.forEach((el) => delete queryObj[el])

   console.log(req.query, queryObj)

   //we're not executing anything just = equal

   // *  2) Advanced filtering : gte , lte , gt , lt , not only = equal

   console.log(req.query)

   // {difficulty : "easy", price: { $gte: 5 }} : filter options field
   // {difficulty : "easy", price: { gte: '5' }}  : req.query

   let queryStr = JSON.stringify(queryObj)
   queryStr = queryStr.replace(/\b(gte|lte|lt|gt)\b/g, match => `$${match}`)

   console.log(JSON.parse(queryStr))

   let query = Tour.find(JSON.parse(queryStr))

   // *  3) Sorting : group by field 

   if (req.query.sort) {
      // { sort :'price' } EX
      const sortBy = req.query.sort.split(',').join(' ') //n9ousouhoum by coma and nlas9ouhoum by space
      // in mongoose : sort('price ""space"" ratingsAverage') 
      console.log(sortBy) //
      query = query.sort(sortBy) //sort will hold the value // sort = price
      // in mongoose : sort('price ""space"" ratingsAverage') 
      //replace this comma with a space : api/tours?sort=-price,ratingsAverage

   } else {
      query = query.sort('-createdAt')
   }

   // *  4) Field limiting : name of the field that we want to receive, want to get
   //api/tours?fields=name,duration,difficulty,price

   if (req.query.fields) {
      let fields = req.query.fields
      //mongoose request a string with the field name separated by spaces
      fields = fields.split(',').join(' ')
      query = query.select(fields) //.select('name duration difficulty price') all separated by spaces
   } else {
      query = query.select('-__v') // - means exclude not including everything except the v field
   }

   // *  5) Pagination : skip the first 10 results and show the next 10 results
   // api/tours/page=2,limit=50

   const page = req.query.page * 1 || 1 // * 1 to convert it to a number // from the req.query.page in the url 
   const limit = req.query.limit * 1 || 100 // * 1 to convert it to a number // from the req.query.page in the url
   const skip = (page - 1) * limit
   // page=2&limit=10, 1-10 page 1, 11-20 page 2, 21-30 page 3

   query = query.skip(skip).limit(limit) //skip(2).limit(10)
   //skip : the amount of results that should be skipped before querying the data
   //limit : the amount of results that should be returned, we want

   if (req.query.page) {

      const numTours = await Tour.countDocuments() // number of documents
      console.log(numTours)
      if (skip >= numTours) throw new Error('this page does not exist')

   }

   // ^ EXECUTE THE QUERY

   const tours = await query
   //query.sort().select().skip().limit() chaining on the previous result so next to the next method

   res.status(200).json({
      status: 'success',
      results: tours.length,
      data: {
         tours: tours
      }
   })

})


exports.getTour = catchAsync(async (req, res, next) => {

   const tour = await Tour.findById(req.params.id).populate('reviews')
   // ! doing it for every findById query in the tour model : with query middleware
   // .populate({ // * populate and the name of the field that we wanna populate in tour
   // path: 'guides', // * name of the field that we wanna replace(populate)
   // select: '-__v -passwordChangedAt' // * exclude the passwordChangedAt and the __v field
   // })

   if (!tour) {
      return next(new AppError('no tour found with that id', 404))
   }

   res.status(200).json({
      status: 'success',
      data: {
         tour: tour
      }
   })

})


exports.updateTour = catchAsync(async (req, res, next) => {

   const updatedTour = await Tour.findByIdAndUpdate(req.params.id, (req.body), {
      new: true,
      runValidators: true
   })

   if (!updatedTour) {
      return next(new AppError('no tour found with that id', 404))
   }

   res.status(200).json({
      status: 'success',
      data: {
         tour: updatedTour
      }
   })
})


exports.deleteTour = catchAsync(async (req, res, next) => {

   const deletedTour = await Tour.findByIdAndDelete(req.params.id)

   if (!deletedTour) {
      return next(new AppError('no tour found with that id', 404))
   }

   res.status(200).json({
      message: 'success',
      data: null
   })
})


exports.tourStats = catchAsync(async (req, res, next) => {

   const stats = await Tour.aggregate([ //an array of stages
      {
         $match: { ratingsAverage: { $gte: 4.5 } }
      },

      {
         $group: {
            _id: { $toUpper: '$difficulty' },// or we can do _id : null to get all documents without group by difficulty
            numberOfTours: { $sum: 1 },//for each documents that goes through this pipeline 1 will be added
            numberOfRatings: { $sum: '$ratingsQuantity' },
            avgRating: { $avg: '$ratingsAverage' },
            avgPrice: { $avg: '$price' },
            minPrice: { $min: '$price' },
            maxPrice: { $max: '$price' }
         }
      },

      {
         $sort: { averagePrice: 1 } // * 1 for ascending from the result of the previous stage
      },
   ])

   res.status(200).json({
      status: 'success',
      data: {
         stats: stats
      }
   })
})


exports.monthlyPlan = catchAsync(async (req, res, next) => {

   const year = req.params.year * 1

   const plan = await Tour.aggregate([

      {
         $unwind: '$startDates' //deconstruct an array from the documents and then output one document for each element of the array// one tour for each of these dates in the array// kol tour ta5ou a start date
         //EX : the forest hiker : 
         //startDates : [
         //"2021-04-25t09"
         //"2021-05-25t09"
         //"2021-08-25t09"
         //]  // ! tet9asem 3ala 3 // 3times twali 3ana the forest hiker // one document for each date
         //THE FOREST HIKER : 
         // startDates : "2021-04-25t09"
         //THE FOREST HIKER : 
         //startDates : "2021-05-25t09"
         //THE FOREST HIKER : 
         //startDates : "2021-08-25t09"
      },

      {
         $match: { // na5ou the documents that are in the year : in our case 2021
            startDates: {
               $gte: new Date(`${year}-01-01`),
               $lte: new Date(`${year}-12-31`)
            }
         }
      },

      {
         $group:
         {
            _id: { $month: '$startDates' }, //group by month
            numberOfToursStarts: { $sum: 1 }, //hpw many tours start in that month
            tours: { $push: '$name' } //push the name of the tour //which tours
         }
      },

      {
         $addFields: { month: '$_id' } // ! add field with the name month that takes the field _id 
         // ! changing the _id field to month as another field
      },

      {
         $project: {
            _id: 0 //this field won't be shown // 0 to hide 1 to show
         }
      },

      {
         $sort: { numberOfToursStarts: -1 } //highest number
      },

      {
         $limit: 12  //limit the number of outputs
      }

   ])

   res.status(200).json({
      message: 'success',
      data: {
         plan: plan
      }
   })

})


// & get tours within a certain radius
exports.getToursWithin = catchAsync(async (req, res, next) => {

  const { distance, latlng, unit } = req.params
  const [lat, lng] = latlng.split(',')

   // * converting miles or km
  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1

  if (!lat || !lng) {
    next(new AppError('Please provide latitude and longitude in the format lat,lng.',400))
  }

  const tours = await Tour.find({ // * filter options : startLocation field
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } }
  })              // * geoWithin : finds documents within a certain geometry

  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      data: tours
    }
  })
})


// & get distance to a certain point from all the tours
// & get distance to all the tours from a certain point 
exports.getDistances = catchAsync(async (req, res, next) => {

   const { latlng, unit } = req.params

   const [lat, lng] = latlng.split(',')

   const multiplier = unit === 'mi' ? 0.000621371 : 0.001 // * 0.000621371 = miles // * 0.001 = kilometers

   if (!lat || !lng) {
      next(new AppError('Please provide latitude and longitude in the format lat,lng', 400))
   }

   const distances = await Tour.aggregate([ 
      {
         $geoNear: { // * one single stage geoNear and needs to be the first stage
            near: {
               type: 'Point',
               coordinates: [lng *1, lat*1]
            },
            key: 'startLocation',
            distanceField: 'distance', // * distanceField = the name of the field that will contain the distance // * distance = the name of the field that will contain the distance
            distanceMultiplier: multiplier, // * distanceMultiplier = the factor to multiply all distances returned by the query by in order to convert from meters to the desired units // * multiplier = the factor to multiply all distances returned by the query by in order to convert from meters to the desired units
         }
      },
      {
         $project: { // * name of the fields that we want to keep
            distance: 1,
            name: 1
         }
      }
   ])

   res.status(200).json({
      status: 'success',
      data: {
         data: distances
      }
   })
})


