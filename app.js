const express = require("express")
const mongoose = require("mongoose")
const morgan = require("morgan")
const dotenv = require("dotenv")
const cors = require("cors")
const bodyParser = require("body-parser") // npm i body-parser
const rateLimit = require("express-rate-limit") // npm i express-rate-limit
const helmet = require("helmet") // npm i helmet
const mongoSanitize = require("express-mongo-sanitize") // npm i express-mongo-sanitize
const xss = require("xss-clean") // npm i xss-clean
const roomController = require("./controllers/roomController")
const hpp = require("hpp")
const path = require("path")
const AppError = require("./utils/appError")
const cookieParser = require("cookie-parser")

dotenv.config({ path: "./config.env" }) // * where our config environment is
// console.log(process.env)

// & using express:
const app = express()

// & getting access to the cookie from the browser cookie-parser
app.use(cookieParser())

// & using body parser
app.use(bodyParser.urlencoded({ extended: false }))
// * add all form values to a body object
app.use(bodyParser.json())
app.use(express.urlencoded({ extended: true }))

// & using pug engine : html template for express
app.set("view engine", "pug")
app.set("views", path.join(__dirname, "views")) //will join the directory name and the views
app.use(express.static(path.join(__dirname, "public"))) // reading static files

// & middlewares:
// app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }))
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
)

app.use(morgan("dev")) // * type of request , status code , time taken, size
app.use(express.json()) // * reading data from the body into req.body //access the response body //body-parser
app.use(express.urlencoded({ extended: true }))

app.use((req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    "script-src  'self' api.mapbox.com",
    "script-src-elem 'self' api.mapbox.com"
  )
  next()
})

app.options("*", cors())

app.use(
  cors({
    credentials: true,
    origin: "http://localhost:3000",
    optionsSuccessStatus: 200,
  })
) // * cross Origin Resource Sharing // enabling sharing api

app.use(express.static(` $ {__dirname}/public `)) // * reading static files

//* handling axios requests
app.use(function (req, res, next) {
  res.setHeader(
    "Content-Security-Policy",
    "script-src 'self' https://cdnjs.cloudflare.com"
  )
  next()
})

// * preventing any attacker from using the user's password with brute force attacking:
const limiter = rateLimit({
  // ! how many requests per ip we're going to allow
  windowMs: 60 * 60 * 1000, // 1 hour //time window 100 request per 1 hour
  max: 100,
  message: "Too many requests from this IP, please try again in an hour",
})

app.use("/api", limiter) // * limit the access to our api route // apply this limiter only to /api and will affects all of the routes that start with /api

// & data sanitization against NoSQL query injection: "email": {"$gt" : ""} with a valid password, anyone can access to the app :
app.use(mongoSanitize()) // * filtering out all the dollar signs // "email": { "$gt": "" }

// & data sanitization against XSS:
// * clean the code from any malicious html code by converting the html tags to strings <>

//& preventing parameter pollution:
app.use(
  hpp({
    whitelist: [
      "duration",
      "ratingsQuantity",
      "maxGroupSize",
      "difficulty",
      "price",
      "ratingsAverage",
    ], //an array of allowed duplicated strings
  })
) // * clearing the query string from duplicated fields //getting the second duplicated value
//Ex ?sort=price&sort=duration , takes duration
// * but also we can do ?duration=5&duration=9 we can query for that

// & a simple middleware to output hello from the backend:
app.use((req, res, next) => {
  console.log("Hello from the backend 😊  ")
  next()
})

// & middleware : request time for when the request was sent:
app.use((req, res, next) => {
  let requestTime = new Date(Date.now()).toLocaleString()
  console.log(requestTime)
  console.log(req.headers)
  console.log("cookie")
  console.log(req.cookies.jwt)
  console.log("headers.cookie")
  console.log(req.headers.cookie)
  next()
})

// & importing the routes from the userRoutes and roomRoutes:
const userRoutes = require("./routes/userRoutes")
const roomRoutes = require("./routes/roomRoutes")
const reviewRoutes = require("./routes/reviewRoutes")
const tourRoutes = require("./routes/tourRoutes")
const viewRoutes = require("./routes/viewRoutes")
const bookingRoutes = require("./routes/bookingRoutes")

// & main routes:
// app.route('/').get((req, res) => {
//    res.status(200).json({
//       message: 'hello world',
//    })
// })

// const router = express.Router()
app.use("/", viewRoutes) // * whenever a url looks like this '/' it will go straight to viewRoutes

// const userRouter = express.Router() // * creating a router so to use it for each resource
app.use("/api/users", userRoutes) // * using the userRouter on '/api/users'

// const roomRouter = express.Router() // * creating the rooms router
app.use("/api/rooms", roomRoutes) // * using the roomRouter on 'api/rooms'

// const roomRouter = express.Router() // * creating the reviews router
app.use("/api/reviews", reviewRoutes) // * using the reviewRouter on 'api/reviews'

// const tourRouter = express.Router()  // * creating the tour router
app.use("/api/tours", tourRoutes) // * using the reviewRouter on 'api/reviews'

// const tourRouter = express.Router()  // * creating the tour router
app.use("/api/bookings", bookingRoutes) // * using the reviewRouter on 'api/reviews'

// userRouter.route('/api/users').get((req, res) => {
//    res.json({
//       message: ' success',
//    })
// })

// userRouter.route('/:id').get((req, res) => {
//    console.log(req.params.id)
//    res.json({
//       status: 'success',
//       message: 'nice'
//    })
// }) //output//5

// app.post('api/users/:id', (req, res) => {
//    console.log(res.params.id)
//    res.status(200).json({
//       name: "iheb",
//       email: " benaichaiheb@gmail.com"
//    })
// })

// const getAllUsers = (req, res) => {
//    res.status(200).json({
//       status: 'sucess',
//       data: {
//          users: 'users'
//       }
//    })
// }

// const deleteUser = (req, res) => {

//    if  !(res.body.includes('name')) {
//       return
//    }
//    res.status(404).json({
//       status: "failed",
//       message: "user not found"
//    })

// }

//routes:
// app
//    .route('/api/users')
//    .get(getAllUsers)
//    .post(createUser)

// app.route('/api/users/:id')
//    .get("/:id", getUser)
//    .delete("/:id", deleteUser)
//    .patch('/:id', updateUser)

//rooms:

// roomRouter.route('/')//only the necessary url
//    .get((req, res) => {
//       res.json({
//          status: 'success',
//          message: 'room'
//       })
//    })

// app.route('/api/rooms/:id')
//    .get()
//    .post()
//    .delete()
//    .patch()

// * route for our geospatial data : where our hotel is located
app
  .route("/api/whereWeAre/:distance/center/:latlng/unit/:unit")
  .get(roomController.getOurHotel)

// app.route('/api/signup').post(authController.signUp)
// app.route('/api/signin').post(authController.logIn)

// * handling  all the unspecified routes :
app.all("*", (req, res, next) => {
  // ! all : gonna run for all the http methods, * : all routes

  // res.status(404).json({
  //    status: 'fail',
  //    message: `can't find ${req.originalUrl} on this server !`
  // })

  // const err = new Error(`can't find ${req.originalUrl} on this server !`)
  // err.status = 'fail'
  // err.statusCode = 404

  next(new AppError(`can't find ${req.originalUrl} on this server !`, 404))
})

// * handling errors with express:
app.use((err, req, res, next) => {
  console.log(err.stack) // ! showing us the error and where the error is

  err.statusCode = err.statusCode || 500
  err.status = err.status || "error"

  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    error: err,
    stack: err.stack,
  })
})

// * connecting to the database:
const DB = process.env.DATABASE.replace("<PASSWORD>", process.env.PASSWORD)

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false,
  })
  .then(() => {
    console.log("Connected to DATABASE")
  })

module.exports = app
