/* eslint-disable no-undef */
"use strict";
const express = require("express");
const app = express();
const csrf = require("tiny-csrf");
const cookiepasrser = require("cookie-parser");
const bodyParser = require("body-parser");
const flash = require("connect-flash");
const session = require("express-session");
const bcrypt = require("bcrypt");
const saltRound = 10;

const passport = require("passport");
const LocalStrategy = require("passport-local");
const connectEnsure = require("connect-ensure-login");

const path = require("path");
app.set("views", path.join(__dirname + "/views"));
app.set("view engine", "ejs");

//Model's
// const {
//   Vote,
//   Quetion,
//   Voters,
//   Voting,
//   VotingOption,
//   sequelize,
// } = require("./models");
const{sequelize} = require("./models")
const { DataTypes } = require("sequelize");
const { request } = require("https");
let Admin = require("./models/AdminDetail")(sequelize, DataTypes);
const CreateElection = require("./models/ElectionDetail")(sequelize,DataTypes)
app.use(bodyParser.json());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookiepasrser("this is Secret String"));
app.use(csrf("this_should_be_32_character_long", ["POST", "PUT", "DELETE"]));

app.use(flash());

app.use(
  session({
    secret: "This_is_Super_Secret_Key_2021095900025026",
    cookie: {
      maxAge: 60 * 60 * 24 * 1000, //24 Hours
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

passport.use(
  "local",
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
    },
    (username, password, done) => {
      Admin.findOne({
        where: {
          email: username,
        },
      })
        .then(async function (user) {
          if (user) {
            const resultantPass = await bcrypt.compare(password, user.password);
            if (resultantPass) {
              return done(null, user);
            } else {
              return done(null, false, { message: "Invalid Password" });
            }
          } else {
            return done(null, false, { message: "User Does Not Exist" });
          }
        })
        .catch((error) => {
          console.log(error);
          return error;
        });
    }
  )
);

passport.serializeUser((user, done) => {
  console.log("Serealizing User in Session", user.id);
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  Admin.findByPk(id)
    .then((user) => {
      done(null, user);
    })
    .catch((err) => {
      done(err, null);
    });
});

app.use(function (request, response, next) {
  const Message = request.flash();
  response.locals.messages = Message;
  next();
});
let title;
// Get Request's
app.get("/",(request, response) => {
  response.render("Login", { csrfToken: request.csrfToken() });
});

app.get("/Signup", (request, response) => {
  response.render("SignUp", { csrfToken: request.csrfToken() });
});

app.get(
  "/Home",
  connectEnsure.ensureLoggedIn({ redirectTo: "/" }),
  (request, response) => {
    console.log(request.user.UserRole)
    response.render("Home", {
      csrfToken: request.csrfToken(),
      User: request.user.FirstName,
    });
  }
);

app.get("/Quetion",connectEnsure.ensureLoggedIn({redirectTo:"/"}),(request,response)=>{
  console.log(title)
  response.render("AddQuetion",{csrfToken:request.csrfToken(),User:request.user.FirstName,ElectionTitle:title});
});

app.get("/ManageQuetion",connectEnsure.ensureLoggedIn({redirectTo:"/"}),async (request,response)=>{
  console.log("userId is :"+request.user.id);
  const getList = await CreateElection.findAll({where:{userId:request.user.id}});
  console.log("Election:"+getList);
   response.render("ManageQuetion",{csrfToken:request.csrfToken(),User:request.user.FirstName,ElectionTitle:title,userId:getList})
})
app.get("/Signout", (request, response, next) => {
  request.logout((err) => {
    if (err) {
      return next(err);
    }
    request.flash("success", "Signout Successfully");
    response.redirect("/");
  });
});
// Post Request
app.post(
  "/AdminLogin",
  passport.authenticate("local", { failureRedirect: "/", failureFlash: true }),
  (request, response) => {
    if(request.user.UserRole == "Admin"){
      console.log("Admin")
    }
    request.flash("success","Login Successfully")
    response.redirect("/Home");
  }
);

app.post("/SignUpUser", async (request, response) => {
  console.log(request.body);
  try {
    let User = await Admin.findAll({ where: { email: request.body.email } });
    if (User.length == 0) {
      let hashPass = await bcrypt.hash(request.body.password, saltRound);

      let add = await Admin.create({
        FirstName: request.body.fname,
        LastName: request.body.lname,
        email: request.body.email,
        password: hashPass,
        UserRole:"Admin"
      });
      request.login(add, (err) => {
        if (err) {
          console.log(err);
        }
        request.flash("success", "Admin Suceessfully Created");
        return response.redirect("/Home");
      });
    } else {
      request.flash("error", "Email Already Exist");
      response.redirect("/Signup");
    }
  } catch (error) {
    console.log(error);
  }
});

app.post("/AddElectionTitle",connectEnsure.ensureLoggedIn({redirectTo:"/"}),async (request,response)=>{
   try {
     if(request.user.UserRole=="Admin"){
      console.log("Request Id:"+request.user.id);
      title = request.body.ElectionTitle
      let addElection = await CreateElection.addNewElection(request.body.ElectionTitle,request.user.id)
      console.log(addElection)
      request.flash("success","Election Created Successfully");
       response.redirect("/Quetion");
     }
     else{
      response.redirect("/")
     }
   } catch (error) {
    response.send(error);
    // npx sequelize-cli migration:create --name add-user-id-in-todo
   }
});

// app.post("/addQuetion/:id",connectEnsure.ensureLoggedIn({redirectTo:"/"}),async (request,response)=>{
//   try {
      
//   } catch (error) {
//     response.send(error)
//   }
// })
module.exports = app;
