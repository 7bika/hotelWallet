const express = require("express")
const paymentController = require("./../controllers/paymentController")
const authController = require("./../controllers/authController")

const router = express.Router()

router.use(authController.checkLoggedIn)

// router.get("/checkout-session/:id", bookingController.getCheckoutSession)
router.get(
  "/checkout-session/products/:productId",
  paymentController.getProductCheckoutSession
)

// router.get(
//   "/checkout-session/:tourId/:roomId",
//   bookingController.getCheckoutSession
// )

// router.get('/checkout-session/:roomId', bookingController.getCheckoutSession)

router.use(authController.restrictTo("admin"))

router
  .route("/")
  .get(productController.getAllProducts)
  .post(productController.createProduct)

router
  .route("/:id")
  .get(productController.getProduct)
  .patch(productController.updateProduct)
  .delete(productController.deleteProduct)

module.exports = router
