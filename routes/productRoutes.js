const express = require("express")
const productController = require("../controllers/productController")
const authController = require("../controllers/authController")
const router = express.Router()

// & check if the user is logged after this point
router.use(authController.checkLoggedIn) // * allowing only logged in users

router
  .route("/")
  .get(productController.getAllProducts)
  .post(authController.restrictTo("admin"), productController.createProduct)
//authController.checkLoggedIn

router
  .route("/:id")
  .get(productController.getProduct)
  .patch(authController.restrictTo("admin"), productController.updateProduct) // * restricted to only  admin
  .delete(authController.restrictTo("admin"), productController.deleteProduct) // * restricted to  and admin

module.exports = router
