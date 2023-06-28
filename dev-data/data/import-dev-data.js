// ! creating all the rooms and importing them all into the database :

const fs = require('fs')
const dotenv = require('dotenv')
const app = require('../../app')
const Room = require('../../models/roomModel')
const Review = require('../../models/reviewModel')
const User = require('../../models/userModel')
const Tour = require('./../../models/tourModel')


// * reading the file :
dotenv.config({ path: '../config.env' })


// * reading the file :
const rooms = JSON.parse(fs.readFileSync(`${__dirname}/rooms.json`, 'utf-8'))
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf-8'))
const reviews = JSON.parse(fs.readFileSync(`${__dirname}/reviews.json`, 'utf-8'))
const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, 'utf-8'))
//an array of js objects


// * importing data into the database: 
const importData = async () => {
   try {

      await Room.create(rooms)
      await User.create(users, { validateBeforeSave: false }) // * all of the validation in the model will be ignored
      await Tour.create(tours) // * all of the validation in the model will be ignored
      await Review.create(reviews) // * all of the validation in the model will be ignored

      console.log('Data successfully loaded!')
   } catch (err) {
      console.log(err)
   }
   process.exit() //exiting
}


// * deleting all data from collection:
const deleteData = async () => {
   try {

      await Review.deleteMany()
      await Room.deleteMany()
      await User.deleteMany()
      await Tour.deleteMany()

      console.log('Data successfully deleted!')
   } catch (err) {
      console.log(err)
   }
   process.exit() //exiting
}

// ! node dev-data/data/import-dev-data.js --import : to import data to the database
// ! node dev-data/data/import-dev-data.js --delete : to delete all the data from the database

//argv :
console.log(process.argv)
// ['user/local/bin/node',
// 'users/benai/oneDrive/Desktop/proWallet2/backend/dev-data/data/import-dev-data.js',
// '--import]
// 0: node
// 1: user/local/bin/node
// 2: --import  // we specified the --import we added that as a third element of the array
//& return an array of the node placement at index 1 and this folder location at index2 and --import at index 3

if (process.argv[2] === '--import') {
   importData()
} else if (process.argv[2] === "--delete") {
   deleteData()
}

//data successfully deleted