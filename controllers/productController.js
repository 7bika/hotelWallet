const catchAsync = require("../utils/catchAsync")
const Product = require("../models/productModel")
const AppError = require("../utils/appError")
const factory = require("../controllers/handlerFactory")

// & getting all products
exports.getAllProducts = factory.getAll(Product)

// & creating a product
exports.createProduct = catchAsync(async (req, res, next) => {
  try {
    const product = await Product.create(req.body)
    res.status(201).json({
      status: "success",
      data: {
        product: product,
      },
    })
  } catch (error) {
    // Handle validation errors and other errors
    next(error)
  }
})

// & updating a product
exports.getProduct = factory.getOne(Product)

// & updating a product
exports.updateProduct = factory.updateOne(Product)
// exports.updateReview = catchAsync(async (req, res, next) => {

//    const product = product.findByIdAndUpdate({ _id: req.params.id }, req.body, {  // ! data we want to change
//        ! the new updated document is gonna be returned
//       runValidators: true, new: true
//    })

//    if (!product) {
//       return next(new AppError('no product found with that id', 404))
//    }

//    res.status(200).json({
//       status: 'success',
//       data: {
//          product: product
//       }
//    })
// })

// & deleting a product
exports.deleteProduct = factory.deleteOne(Product)
// exports.deleteProduct = catchAsync(async (req, res, next) => {

//    const deletedReview = await Review.findByIdAndDelete(req.params.id)

//    if (!deletedReview) {
//       return next(new AppError('No review found with that ID', 404))
//    }

//    res.status(204).json({
//       status: 'success',
//       data: null
//    })
// })
