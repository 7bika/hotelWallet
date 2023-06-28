//handlers: controllers :
const Room = require('./../models/roomModel')
const catchAsync = require('../utils/catchAsync')
const AppError = require('../utils/appError')
const factory = require('./handlerFactory')
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

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter
});



// & multer upload : uploading the image
exports.uploadRoomImages = upload.fields([
  { name: 'imageCover', maxCount: 1 },
  { name: 'images', maxCount: 3 }
]);


// & resizing room images
exports.resizeRoomImages = catchAsync(async (req, res, next) => {
  console.log(req.files)
  
  if (!req.files.imageCover || !req.files.images) return next()

  // * 1) Cover image
  req.body.imageCover = `room-${req.params.id}-${Date.now()}-cover.jpeg`
  await sharp(req.files.imageCover[0].buffer)
    .resize(2000, 1333)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/rooms/${req.body.imageCover}`)

  // * 2) Images
  req.body.images = []

  await Promise.all(
    req.files.images.map(async (file, i) => {
      const filename = `room-${req.params.id}-${Date.now()}-${i + 1}.jpeg`

      await sharp(file.buffer)
        .resize(2000, 1333)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`public/img/rooms/${filename}`)

      req.body.images.push(filename)
    })
  )

  
 next()
});


//~
//  * checkID :
//  * exports.checkID = (req, res, next, value) => {
//  * console.log('your id is' + value)
//  * }

//& middleware aliasTopRooms : executed before the getAllRooms request so by default
exports.aliasTopRooms = (req, res, next) => {

   req.query.limit = '5'  // in a string format cuz the query is a string
   req.query.sort = '-ratingsAverage,-price' // -ratingsAverage cuz we want the highest rating first
   req.query.fields = 'name,price,ratingsAverage,summary,type'

   next()
}


// ! ! the query is prefilled even if the user didn't put any of these parameters in the query string
// & get all rooms: 
// exports.getAllRooms = factory.getAll(Room)
exports.getAllRooms = catchAsync(async (req, res, next) => {

   // * BUILD THE QUERY:
   //^  1) filtering:
   //getting the query string from the request:
   // console.log(req.query)

   //making a copy of the req.query object:
   const queryObj = { ...req.query }
   // ! queryObj = req.query cuz if we delete something it will forever be deleted

   const excludedFields = ['page', 'sort', 'limit', 'fields'] // ~ in postman in the query string
   // fields we wanna execute paginating, sorting , limiting, selecting only some specific fields
   excludedFields.forEach((el) => delete queryObj[el])
   console.log(req.query, queryObj)

   // ~ {difficulty : 'easy', duration : {$gte : 5 }} //inside mongo compass or atlas in the filter 
   // ~ http://localhost:3000/api/rooms?price [gte] =100&type=king&page=2&sort=1&limit=10
   // ~ output of the last req : {difficulty : 'easy', duration: {$gte : 5 } } the query object is the same as the filter object that we wrote manually

   //filtering the rooms: 
   // ? let rooms = await Room.find()
   //first method:
   //filter object :
   // ? let rooms = await Room.find({
   // ?  price: 100,
   // ?  type: "king"
   // ? })

   //^  2) Advanced filtering:
   let queryObjString = JSON.stringify(queryObj)
   queryObjString = queryObjString.replace(/\b(gte|lte|gt|lt)\b/g, match => `$${match}`) //match these exact same words
   console.log(JSON.parse(queryObjString))
   //bech ne5dmou beha directement //take it from req.query and make conditions with it

   //second method:
   //? let rooms = await Room.find({
   //?  price: {$gte : 100},
   //?  type: "king"
   //? })

   let query = Room.find(JSON.parse(queryObjString)) //!queryObj :was2 (req.query) was:the query string in the request in the url // was : let rooms because if we want to add features we need to await later cuz if we await first we cannot chain on it inside the query

   //third method:
   // ? let rooms = await Room.find().where('price').equals(100).where('type').equals('king')

   //^  3) Sorting:
   if (req.query.sort) {  // {sort : 1} //by price in postman
      const sortBy = req.query.sort.split(',').join(' ') //removes the comma and join by space
      // ? query = query.sort(req.query.sort)
      query = query.sort(sortBy) //with mongoose
      //~ sort('price ratingsAverage') //with mongoose //first by price then by ratingsAverage//but in postman we put a comma like this : api/rooms?sort=-price,ratingsAverage 
   } // * we start with the lowest price to the highest
   else { //default :
      query = query.sort('-createdAt') //with mongoose //descending order
   }

   //^  4) Field limiting: client choose which field they want to get back in the response such as name , price , type , duration ...
   if (req.query.fields) {
      const fieldSort = req.query.fields.split(',').join(' ')
      //~ select('price ratingsAverage type') //what mongoose can understand //select only these three // api/rooms?fields=name,duration,price,type
      query = query.select(fieldSort)
   } else { //default :
      query = query.select('-__v')// - means exclude
   }

   //^  5) Pagination: // page number and limit is the number of results per page:
   //~ api/rooms?page=2&limit=10 //results 1-10 on page 1 , results 11-20 on page 2 , results 21-30 on page 3 ... 
   //  ? query = query.skip(10).limit(10)
   // ~ api/rooms?page=3&limit=10 
   // ? query = query.skip(20).limit(10) // skip 20 results (each page has 10 results cuz the limit is 10) to get to page number 3 
   // * get the page and the limit from the query string : 
   const page = req.query.page * 1 || 1 // * 1 to convert it to a number // from the req.query.page in the url 
   const limit = req.query.limit * 1 || 100 // * 1 to convert it to a number // from the req.query.page in the url
   const skip = (page - 1) * limit
   // page=2&limit=10, 1-10 page 1, 11-20 page 2, 21-30 page 3

   query = query.skip(skip).limit(limit) //skip(2).limit(10)
   //skip : the amount of results that should be skipped before querying the data
   //limit : the amount of results that should be returned, we want

   if (req.query.page) {

      const numRooms = await Room.countDocuments() // number of documents
      console.log(numRooms)
      if (skip >= numRooms) throw new Error('this page does not exist')
   }

   // ! await Room.find() will return the document that matches our query// if we await Room.find(queryObj) we cannot later add pagination or sorting 
   // * EXECUTE THE QUERY:
   const rooms = await query // because there is no way of later implementing sorting or limiting in the end we await 
   //& the same as = query.sort().select().skip().limit() that's why we await later after chaining


   // * SEND RESPONSE: 
   res.status(200).json({
      status: 'success',
      results: rooms.length,
      data: {
         rooms: rooms
      }
   })

})

// ! in order to get rid of our try catch bloc we simply wrapped our async functions inside of catchAsync fun that we just created // this function will then return a new anonymous function which is return (req, res, next) => {fn(req, res, next).catch(next)} which will then be assigned to createRoom will be called first 

// const catchAsync = fn => {
//    return (req, res, next) => {
//       fn(req, res, next).catch(next) // * getting the function and catching the promise 
//    }
// }


// & create room:
exports.createRoom = factory.createOne(Room)
// exports.createRoom = catchAsync(async (req, res, next) => {

//    const newRoom = await Room.create(req.body)
//    res.status(200).json({
//       status: ' success',
//       data: {
//          room: newRoom
//       }
//    })

//    try {
//       const newRoom = await Room.create(req.body)
//       res.status(200).json({
//          status: ' success',
//          data: {
//             room: newRoom
//          }
//       })
//    } catch (err) {
//       res.status(404).json({
//          status: 'fail',
//          message: err
//       })
//    }
// })


// & get room :
exports.getRoom = factory.getOne(Room, { path: 'reviews' })// * path : is the field wa wanna populate
// exports.getRoom = catchAsync(async (req, res, next) => {

// // ? same as : findOne({_id:req.params.id })
//    const room = await Room.findById(req.params.id).populate('reviews') // we wanna populate on get one room : to get reviews on one room
// // * .populate({  // getting rid of it here after the query middleware function
// // *     path: 'staff',  //.populate and name of the field that we want to populate
// // *     select: '-__v -passwordChangedAt' // we can also select the fields we want to get back //not in the output
// // * })

//    if (!room) {
//       return next(new AppError('No room found with that ID', 404))
//    }

//    res.status(200).json({
//       status: 'success',
//       data: {
//          room: room
//       }
//    })
// })


// & update room:
exports.updateRoom = factory.updateOne(Room)
// exports.updateRoom = catchAsync(async (req, res, next) => {

//    const updatedRoom = await Room.findOneAndUpdate({ _id: req.params.id }, req.body, {
//       new: true, runValidators: true                                     // ! data we want to change
// ! the new updated document is gonna be returned
//    })

//    if (!updatedRoom) {
//       return next(new AppError('No room found with that ID', 404))
//    }

//    res.status(200).json({
//       status: 'success',
//       data: {
//          room: updatedRoom
//       }
//    })
// })


// & delete room:
exports.deleteRoom = factory.deleteOne(Room)
// ^ instead of this :
// exports.deleteRoom = catchAsync(async (req, res, next) => {

//    const deletedRoom = await Room.findByIdAndDelete(req.params.id)

//    if (!deletedRoom) {
//       return next(new AppError('No room found with that ID', 404))
//    }

//    res.status(204).json({
//       status: 'success',
//       data: null
//    })
// })


//helpers functions :
//later we're gonna define a new route and use that function for that

// & function about statistics: 
exports.getRoomStats = catchAsync(async (req, res, next) => {

   const stats = await Room.aggregate([
      //! aggregation method that ta3ti barcha operations in order to manipulate data // array of stages //the document pass through these stages one by one perform certain actions on the specific data  //Using it, we can filter and refine the data before presenting it to the application. It makes it simpler to process and analyze the data, and also reduces the workload on the database.

      //& stages: each of the stages is an object :
      { // ? selecting documents where ratingsAverage is greater or equal to 4.5 
         $match: { ratingsAverage: { $gte: 4 } }
      },
      {  // ? calculating if the rating average of rooms in one group
         $group: {
            _id: { $toUpper: '$type' }, //* $toUpper = toupperCase  
            numberOfRooms: { $sum: 1 }, // * for every document that goes through this pipeline 1 is added to the num counter //1 for each document //for each document that will go through the pipeline 1 is added  //*   $sum = total
            numberOfRatings: { $sum: '$ratingsQuantity' },  //calculating the average of ratings
            averageRating: { $avg: '$ratingsAverage' }, // * $avg = average
            averagePrice: { $avg: '$price' },
            minPrice: { $min: '$price' }, //*  $min = minimum
            maxPrice: { $max: '$price' } //*   $max = maximum
         }
      },
      // ! every time we get the result of the previous stage : ne5dmo taw 3al result mta3 $group
      // ! so we cannot use the same fields names and we have to use the same fields names 
      {
         $sort: { averagePrice: 1 } //1 for ascending order //we use averagePrice from the previous $group
      },
      //! we also can repeat stages
      // {
      //    $match: { _id: { $ne: 'SUITE' } } // * ne = not equal 
      // }
   ])

   res.status(200).json({
      status: 'success',
      data: {
         stats: stats
      }
   })


})

//calculate the busiest month of the year :
exports.getMonthlyPlan = catchAsync(async (req, res, next) => {

   const year = req.params.year * 1 //2023
   const plan = await Room.aggregate([
      {
         $unwind: '$startDates' // * unwind = deconstruct an array field from the input document and then output one document for each element of the array //splits the array of startDates into multiple documents
      },
      {
         $match: {
            startDates: { // ? in the start dates from the schema
               $gte: new Date(`${year}-01-01`), //*greater or equal to january 1st 2021 // 2021 is the year that we put in req.params.year = year
               $lte: new Date(`${year}-12-31`)  //* less than 31 december of the same year //2021 
            }
         }
      },
      {
         $group: { // ? group them by month
            _id: { $month: '$startDates' }, // * $month = month //month 12 , 1 ,9 ...
            numberOfRoomsStarts: { $sum: 1 }, // * $sum = add 1 for each document //how many rooms start in that month
            rooms: { $push: '$name' } // * $push = push the name of the room in the array //array of all the rooms that start in that month // which room // $push = creating an array and we're gonna push into that array is each document that goes through this pipeline with name field
         }
      },
      {
         $addFields: { month: '$_id' } // * add a new field to the document // * _id = the field that we have our month in it // * month = '$id' //month : 5 the same as id will be desplayed in month field 
      },
      {
         $project: { // ! project the fields that we want to display //we give each of the field names  0 or 1 
            _id: 0 // * _id = 0 or 1  // 0 means that we don't want to display it //1 means to display it
         }
      },
      {
         $sort: {
            numberOfRoomsStarts: -1 // * -1 = descending order // * 1 = ascending order
         }
      },
      {
         $limit: 12 // * limit = limit the number of documents that we want to display // * 12 = 12 months cuz we work with months
      }
   ])

   //! fil le5er kolhoum les stages bech ijiw fi pipeline
   // console.log(this.pipeline())

   res.status(200).json({
      status: 'success',
      data: {
         plan: plan
      }//* plan = array of documents
   })
})


// & router.route('/whereWeAre/:distance/center/:latlng/unit/:unit').get(roomController.getOurHotel)
// center : where user live , 
// & /whereWeAre/233/center/34.111745,-118.113491/unit/mi
exports.getOurHotel = catchAsync(async (req, res, next) => {

   const { distance, latlng, unit } = req.params

   const [lat, lng] = latlng.split(',')

   const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1 // * 3963.2 = miles // * 6378.1 = kilometers

   if (!lat || !lng) {
      next(new AppError('Please provide latitude and longitude in the format lat,lng', 400))
   }

   console.log(distance, lat, lng, unit)

   const hotel = await Room.find({ startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } } }) // * finds documents within a certain geometry

   res.status(200).json({
      status: 'success',
      results: hotel.length,
      data: {
         data: hotel
      }
   })
})


exports.getDistancesBetween = catchAsync(async (req, res, next) => {


   const { latlng, unit } = req.params

   const [lat, lng] = latlng.split(',')

   const multiplier = unit === 'mi' ? 0.000621371 : 0.001 // * 0.000621371 = miles // * 0.001 = kilometers

   if (!lat || !lng) {
      next(new AppError('Please provide latitude and longitude in the format lat,lng', 400))
   }

   const distances = await Room.aggregate([ // * one single stage geoNear
      {
         $geoNear: {
            near: {
               type: 'Point',
               coordinates: [lng * 1, lat * 1]
            },
            distanceField: 'distance', // * distanceField = the name of the field that will contain the distance // * distance = the name of the field that will contain the distance
            distanceMultiplier: multiplier // * distanceMultiplier = the factor to multiply all distances returned by the query by in order to convert from meters to the desired units // * multiplier = the factor to multiply all distances returned by the query by in order to convert from meters to the desired units
         }
      },
      {
         $project: {
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