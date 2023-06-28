const User = require('./../models/userModel')
const catchAsync = require('./../utils/catchAsync')
const AppError = require('./../utils/appError')
const factory = require('../controllers/handlerFactory')
const multer = require('multer')
const sharp = require('sharp')


// & multer storage : for storing images : in the disk
// const multerStorage = multer.diskStorage({ // * storing the file in our file system //this directory
//    destination: (req, file, cb) => { // * cb : callback function
//       cb(null, 'public/img/users')
//    },
//    filename: (req, file, cb) => {
//       const ext = file.mimetype.split('/')[1] // ^ mimetype: 'image/jpeg' [1] = jpeg the jpeg part
//       cb(null, `user-${req.user.id}-${Date.now()}.${ext}`)
//    }
// })
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


// & upload user photo middleware : uploadUserPhoto
exports.uploadUserPhoto = upload.single('photo') // * single : single file // * photo : field name // * req.file : the file that is being uploaded // we pass the name of the field that is going to hold the image to upload (photo)

// & resizing the user updated photo
exports.resizeUserPhoto= catchAsync(async (req,res, next) => {
  if (!req.file) return next()

  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`

  // * resizing and formatting to jpeg
  await sharp(req.file.buffer).resize(500, 500).toFormat('jpeg').jpeg({quality: 90}).toFile(`public/img/users/${req.file.filename}`)

  next()
})

//handlers: controllers :
//get all users:

// exports.checkID = (req, res, next, value) => {

//    console.log(`the user id is ${value}`)
//    // if (req.params.id < users.length) {
//    //    return res.status(404).json({
//    //       status: 'failed',
//    //       message: 'user not found'
//    //    })
//    // }
//    next()
// }

// exports.checkBody = (req, res, next, val) => {

//    if (!req.body.name || !req.body.price) {
//       return res.status(404).json({
//          status: 'fail',
//          message: 'Invalid ID'
//       })
//    }
//    next()
// }

// & filter object method to allow only specific fields
const filterObj = (obj, ...allowedFields) => { // filterObj(req.body, 'name', 'email')
   // ^ req.body and name , email , image or anything else that we want to keep

   const newObj = {}
   Object.keys(obj).forEach((el) => {
      if (allowedFields.includes(el)) newObj[el] = obj[el]
   })
   return newObj
}


// & get all users :
exports.getAllUsers = factory.getAll(User)
// exports.getAllUsers = catchAsync(async ( req, res, next) => {

//    const users = await User.find() //* before this query is executed we executed the query middleware : this.find({ active: { $ne: false } })
//    res.status(200).json({
//       status: 'success',
//       results: users.length,
//       data: {
//          users: users
//       }
//    })
// })


// & get my data : logged in user's data
exports.getMe = (req, res, next) => { // * get one basically uses the id coming from the parameter in order to get the request document but we want to get the document based of the current user ID logged in user iD not from the params.id 

   req.params.id = req.user.id // * req.params.id the getOne method gonna use and set it to req.user.id coming from the logged in user

   next()
}


// & updating my data : logged in user's data
exports.updateMe = catchAsync(async (req, res, next) => {

   console.log(req.file)
   console.log('req.body')
   console.log(req.body)

   // ! 1 create an error if the user tries to update the password : POST
   if (req.body.password || req.body.passwordConfirm) {
      return next(new AppError('this route is not for password updates please use /updateMyPassword', 400))
   }


   // ! 2 filtered unwanted field names that are not allowed to be updated
   const filterBody = filterObj(req.body, 'name', 'email') // ! fields that we want to keep in the body and filter out all the rest 

   if (req.file) filterBody.photo = req.file.filename // * filterBody = name of the field that holds the photo 
   // * filename: 'user-5c8a211f2f8fb814b56fa188-1681774100933.png',   
   // * if the user uploaded a file then we want to add the photo field to the filterBody object and set it to the filename that we got from multer
   // !! adding the photo property to the object (filterBody) that is going to be updated next in updatedUser and that photo property is equal to file.filename


   // const user = await User.findById(req.user.id)
   // user.name= "iheb"
   // await user.save()
   // ! won't work : the passwordConfirm validator will error so we use findByIdAndUpdate cuz we only want to update the name and email and photo not the password and the passwordConfirm validator will run on password so we don't need it


   // ! 3 update the user's document
   const updatedUser = await User.findByIdAndUpdate(req.user.id, filterBody, { new: true, runValidators: true })
   //* object to keep :filterBody: only contains name and email // * new to return the new updated object and run validators again 

   res.status(200).json({
      status: 'success',
      message: 'user updated',
      data: {
         user: updatedUser
      }
   })

})


// & set the account to inactive : not actually deleting it so the user in some point in the future reactivate his account :
exports.deleteMe = catchAsync(async (req, res, next) => {

   const account = await User.findByIdAndUpdate(req.user.id, { active: false }) // * data that we want to update

   if (!account) {
      return next(new AppError('user not found', 404))
   }

   res.status(204).json({
      status: 'success',
      message: 'account deactivated',
      data: null
   })
})



// ! BY AN ADMIN : 


// & creating a user :
exports.createUser = (req, res) => {
   res.status(500).json({
      status: 'error',
      message: 'This route is not defined! Please use /signup instead'
   })
}


// & getting a user:
exports.getUser = factory.getOne(User)
// exports.getUser = catchAsync(async (req, res, next) => {

//    const user = await User.findById(req.params.id)

//    if (!user) {
//       return next(new AppError('user not found', 404))
//    }

//    res.status(200).json({
//       status: 'success',
//       data: {
//          user: user
//       }
//    })
// })


// ! not for updating user's password with this route 

// & updating a user:
exports.updateUser = factory.updateOne(User)


// & deleting a user:
exports.deleteUser = factory.deleteOne(User)
