//jshint esversion:6
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const _ = require('lodash')

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

// create mongoose conection
// DB Name: todolistDB
// password: ypwJHn0DeCIAOluo

mongoose.connect("mongodb+srv://admin-mahatmaditya:Test-123@cluster0.fm1dz4k.mongodb.net/todolistDB", { useNewUrlParser: true, useUnifiedTopology: true})

// create schemas
const itemsSchema = new mongoose.Schema({
  name: String
})

// Create mongoose model
const Item = mongoose.model('Item', itemsSchema)

// Create 3 new documents
const item1 = new Item({
  name: "Welcome to your toDoList!"
})

const item2 = new Item({
  name: "Hit the + button do add a new item"
})

const item3 = new Item({
  name: "<== Hit this to delete an item!"
})

// insert to an array
const defaultItems = [item1, item2, item3]

// this is will be use in customListName
// new List schema
const listSchema = {
  name: String,
  // have an array of item documents associated with it 
  items: [itemsSchema]
}
// create a List model
const List = mongoose.model("List", listSchema)

app.get("/", function(req, res) {

  // validating

  // print out all document inside items
  // and pass it into newListItems
  Item.find({}, function(err, foundItems) {

    if( foundItems.length === 0) {
      // insert defaultItems into todolistDB
      Item.insertMany(defaultItems, function(err){
        if(err) {
          console.log(err)
        } else {
          console.log("Successfully saved default items to DB")
        }
      })
      // use redirect instead of refresh twice
      res.redirect('/')
    } else {
      // if not empty render "list"
      res.render("list", {listTitle: 'Today', newListItems: foundItems});
    }
  })

});

// 344 adding newListsItem
app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list

  // create a new item document
  const item = new Item({
    name: itemName
  })

  if (listName === "Today") {
    // mongoose shortcut
    item.save();

    // redirect to home route
    res.redirect('/')
  } else {
    // search list document in our lists collection & add the item and embed it into the existing array of items
    // find the customListName
    List.findOne({name: listName}, function(err, results) {
      // push/add new item  into items(listSchema)
      results.items.push(item)
      // save the results
      results.save()
      res.redirect('/' + listName)
    })
  }
});

// Removed items that checked out 
app.post('/delete', function(req, res) {
  // using findByIdeAndRemove
  // item _id
  const checkedItemId = req.body.checkbox
  
  const listName = req.body.listName

  if ( listName === "Today" ) {
    Item.findByIdAndRemove(checkedItemId, (err, docs) => {
      if (!err) {
        console.log("Removed item: ", docs)
        res.redirect('/')
      } else {
        console.log(err)
      }
    })
  } else {
    // pull from items that has an ID that corresponds to our checkedItemId
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, results) {
      if (!err) {
        res.redirect('/' + listName)
      }
    })
  }
})

// access work parameter
app.get("/:customListName/", (req, res) => {
  const customListName = _.capitalize(req.params.customListName)

  List.findOne({name: customListName}, function(err, results) {
    if (!err) {
      // if results doesnt exixst
      if (!results) {
        // create a new list
        // create a new document with a different schema
        const list = new List({
          name: customListName,
          items: defaultItems
        })

          // save into list collection
          list.save()
          // redirect in to the customListName
          // u shouldn't have to refresh it twice
          res.redirect('/' + customListName)
      } else {
        // show an existing list
        
        // results.items is refers on the items
        res.render("list",{listTitle: results.name, newListItems: results.items})
      }
    }
  })
})

app.get("/about", function(req, res){
  res.render("about");
});

// solve favicon problem
// app.get("/favicon.ico", function (req, res) {
//   res.redirect("/");
// });

app.listen(3000, function() {
  console.log("Server started on port 3000");
});