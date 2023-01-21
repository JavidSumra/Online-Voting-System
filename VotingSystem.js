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
const { sequelize } = require("./models");
const { DataTypes } = require("sequelize");
const { request } = require("http");
const { response } = require("express");

let Admin = require("./models/votingadmin")(sequelize, DataTypes);
let Quetion = require("./models/quetiondetail")(sequelize, DataTypes);
const CreateElection = require("./models/electiondetail")(sequelize, DataTypes);
const CreateOption = require("./models/optiondetail")(sequelize, DataTypes);
const Voter = require("./models/voterlogin")(sequelize, DataTypes);
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

//Authentication For Voters
passport.use(
  "local-Voter",
  new LocalStrategy(
    {
      usernameField: "VoterId",
      passwordField: "password",
    },
    (username, password, done) => {
      Voter.findOne({
        where: {
          VoterId: username,
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
  Voter.findByPk(id)
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
let URL=null;
// Get Request's
app.get("/", (request, response) => {
  response.render("Login", { csrfToken: request.csrfToken() });
});

app.get("/Signup", (request, response) => {
  response.render("SignUp", { csrfToken: request.csrfToken() });
});

app.get(
  "/Home",
  connectEnsure.ensureLoggedIn({ redirectTo: "/" }),
  async (request, response) => {
    if (request.user.UserRole == "Admin") {
      URL=null;
      console.log(request.user.id);
      let getElection = await CreateElection.RetriveElection(request.user.id);
      // console.log(getElection)
      response.render("Home", {
        csrfToken: request.csrfToken(),
        User: request.user.FirstName,
        getElection,
      });
    } else {
      response.redirect("/");
    }
  }
);

app.get(
  "/Quetion/:id",
  connectEnsure.ensureLoggedIn({ redirectTo: "/" }),
  async (request, response) => {
    console.log("Id:" + request.params.id);
    let electionList = await CreateElection.findByPk(request.params.id);
    let QuetionList = await Quetion.getQuetionList(request.params.id);
    let VotersList = await Voter.getVotersList(request.params.id);
    // console.log(VotersList);
    response.render("AddQuetion", {
      csrfToken: request.csrfToken(),
      User: request.user.FirstName,
      electionList,
      QuetionList,
      VotersList,
      URL,
    });
  }
);

app.get(
  "/ManageQuetion/:id",
  connectEnsure.ensureLoggedIn({ redirectTo: "/" }),
  async (request, response) => {
    let elcetionList = await CreateElection.findByPk(request.params.id);
    let QuetionList = await Quetion.getQuetionList(request.params.id);
    // let OptionList = awai CreateOption.getOptionList(request.params.id);
    response.render("ManageQuetion", {
      csrfToken: request.csrfToken(),
      User: request.user.FirstName,
      elcetionList,
      QuetionList,
    });
  }
);
app.get(
  "/ManageOption/:id/:ElectId",
  connectEnsure.ensureLoggedIn({ redirectTo: "/" }),
  async (request, response) => {
    console.log("ManageOption:" + request.params.id);
    let elcetionList = await CreateElection.findByPk(request.params.ElectId);
    let OptionList = await CreateOption.getOptionList(request.params.id);
    let QuetionDetail = await Quetion.getParticularList(request.params.id)
    console.log(QuetionDetail);
    console.log(OptionList);
    response.render("AddOption", {
      User: request.user.FirstName,
      csrfToken: request.csrfToken(),
      Id: elcetionList.id,
      OptionList,
      QuetionDetail,
    });
  }
);

app.get("/AddUrl/:id",connectEnsure.ensureLoggedIn({redirectTo:"/"}),async (request,response)=>{
  console.log(request.params.id)
  let electionList = await CreateElection.findByPk(request.params.id)
   response.render("addURL",{csrfToken:request.csrfToken(),ElectionId:request.params.id,User:request.user.FirstName,electionList});
});

app.get(
  "/voter/addVoter/:id",
  connectEnsure.ensureLoggedIn({ redirectTo: "/" }),
  async (request, response) => {
    console.log("Voter Id:" + request.params.id);
    let electionList = await CreateElection.findByPk(request.params.id);
    console.log("AddVoter:" + electionList);
    console.log(electionList.Title);
    response.render("AddVoters", {
      User: request.user.FirstName,
      electionList,
      csrfToken: request.csrfToken(),
    });
  }
);

app.get(
  "/Manage/voter/:id",
  connectEnsure.ensureLoggedIn({ redirectTo: "/" }),
  async (request, response) => {
    try {
      let VotersList = await Voter.getVotersList(request.params.id);
      response.render("ManageVoter", {
        csrfToken: request.csrfToken(),
        User: request.user.FirstName,
        VotersList,
      });
    } catch (error) {
      response.send(error);
    }
  }
);

app.get("/loginvoter",(request, response) => {
  response.render("VoterLogin", { csrfToken: request.csrfToken() });
});

app.get(
  "/DeclareElection/:id",
  connectEnsure.ensureLoggedIn({ redirectTo: "/" }),
  async (request, response) => {
    let electionList = await CreateElection.findByPk(request.params.id);
    console.log(electionList);
    console.log(request.params.id);
    let QuetionDetail = await Quetion.getQuetionList(request.params.id);
    let VoterDetail = await Voter.getVotersList(request.params.id)
    for (let i = 0; i < QuetionDetail.length; i++) {
      var getOptionList = [];
      getOptionList = await CreateOption.getOptionList(QuetionDetail[i].id)
    }
    if (electionList.Start === true && electionList.End === false) {
      request.flash("error", "Election Is Already Live");
      response.redirect(`/Quetion/${request.params.id}`);
    } else {
     if(URL!=null){
      if (QuetionDetail.length >= 1) {
        if (getOptionList.length >= 2) {
          if(VoterDetail.length>=1){
            request.flash("success", "Election is Live");
          await electionList.StartElection(request.params.id);
          response.redirect(`/Quetion/${request.params.id}`);
          }
          else{
            request.flash("error", "Please Register At Least One Voter");
            response.redirect(`/Quetion/${request.params.id}`);
          }
        } else {
          request.flash("error", "Please Create At Least Two Option");
          response.redirect(`/Quetion/${request.params.id}`);
        }
      } else {
        request.flash("error", "Please Create At Least One Quetion");
        response.redirect(`/Quetion/${request.params.id}`);
      }
     }
    else{
      request.flash("error", "Please Add Url First");
        response.redirect(`/Quetion/${request.params.id}`);
    }
  }
});

app.get(
  "/EndElection/:id",
  connectEnsure.ensureLoggedIn({ redirectTo: "/" }),
  async (request, response) => {
    let electionList = await CreateElection.findByPk(request.params.id);
    if (electionList.Start === true && electionList.End === false) {
      request.flash("success", "Election is Now Ended");
      await electionList.EndElection(request.params.id);
      response.redirect(`/Quetion/${request.params.id}`);
    } else {
      request.flash("error", "Please Make Sure Election Is Live or Not");
      response.redirect(`/Quetion/${request.params.id}`);
    }
  }
);

app.get(
  "/ElectionPerview/:id",
  connectEnsure.ensureLoggedIn({ redirectTo: "/" }),
  async (request, response) => {
    let electionList = await CreateElection.findByPk(request.params.id);
    let QuetionDetail = await Quetion.getQuetionList(request.params.id);

    console.log(QuetionDetail);
    console.log(QuetionDetail.length);

    let getOptionList = [];
    for (let i = 0; i < QuetionDetail.length; ++i) {
      let OptionList = await CreateOption.getOptionList(QuetionDetail[i].id)
      console.log(`${i + 1}Time:` + QuetionDetail[i].id);
      getOptionList.push(OptionList);
    }
    if (electionList.Start === true && electionList.End === false) {
      response.render("electionPerview", {
        csrfToken: request.csrfToken(),
        User: request.user.FirstName,
        electionList,
        QuetionDetail,
        getOptionList,
      });
    } else {
      request.flash("error", "Election is Not Live");
      response.redirect(`/Quetion/${request.params.id}`);
    }
  }
);

app.get("/voting",async (request,response)=>{
  console.log(request.user)
  let electionList = await CreateElection.findByPk(request.user.id)
  console.log(electionList)
  response.render("VotersVote",{csrfToken:request.csrfToken()})
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
  async (request, response) => {
    if (request.user.UserRole == "Admin") {
      console.log("Admin");
    }
    request.flash("success", "Login Successfully");
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
        UserRole: "Admin",
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

app.post(
  "/AddElectionTitle",
  connectEnsure.ensureLoggedIn({ redirectTo: "/" }),
  async (request, response) => {
    try {
      if (request.user.UserRole == "Admin") {
        console.log("Request User Id:" + request.user.id);
        let addElection = await CreateElection.create({
          Title: request.body.title,
          userId: request.user.id,
          Start: false,
          End: false,
        });
        console.log("Created");
        // console.log(addElection)
        // console.log(addElection.userId)
        request.flash("success", "Election Created Successfully");
        response.redirect(`Quetion/${addElection.id}`);
      } else {
        response.redirect("/");
      }
    } catch (error) {
      response.send(error);
    }
  }
);

app.post(
  "/addQuetion/:id",
  connectEnsure.ensureLoggedIn({ redirectTo: "/" }),
  async (request, response) => {
    try {
      console.log("Post Request:" + request.params.id);
      let AddQuetion = await Quetion.create({
        QuetionTitle: request.body.QuetionTitile,
        Description: request.body.Description,
        ElectionId: request.params.id,
      });
      console.log(AddQuetion);

      response.redirect(`/Quetion/${request.params.id}`);
    } catch (error) {
      response.send(error);
    }
  }
);

app.post(
  "/addOption/:QueId/:id",
  connectEnsure.ensureLoggedIn({ redirectTo: "/" }),
  async (request, response) => {
    console.log("Add Option:" + request.params.id);
    console.log("Quetion Id:" + request.params.QueId);
    let addOption = await CreateOption.create({
      OptionTitle: request.body.Title,
      OptionId: request.params.QueId,
    });
    console.log(addOption);
    response.redirect(
      `/ManageOption/${request.params.QueId}/${request.params.id}`
    );
  }
);

app.post(
  "/AddVoter/:id",
  connectEnsure.ensureLoggedIn({ redirectTo: "/" }),
  async (request, response) => {
    console.log(request.params.id)
    try {
      let findVoter = await Voter.findOne({
        where: { VoterId: request.body.VoterId },
      });
      if (findVoter) {
        request.flash("error", "Voter Id Already Exist");
        response.redirect(`/voter/addVoter/${request.params.id}`);
      } else {
        let hashPass = await bcrypt.hash(request.body.password, saltRound);
        let addVoter = await Voter.create({
          VoterId: request.body.VoterId,
          password: hashPass,
          userElectionId: request.params.id,
          Status: false,
          UserRole: "Voter",
        });
        request.flash("success", "Voter Suceessfully Created");
        return response.redirect(`/Quetion/${request.params.id}`);
      }
    } catch (error) {
      response.send(error);
    }
  }
);

app.post(
  "/VoterLogin",
  passport.authenticate("local-Voter", {
    failureRedirect: "/loginvoter",
    failureFlash: true,
  }),
  async (request, response) => {
    response.redirect("/voting")
  }
);

app.post("/url/:id",connectEnsure.ensureLoggedIn({redirectTo:"/"}),async (request,response)=>{
  URL = request.body.Url
  if(URL!=null){
    request.flash("success","Url Created Successfully")
    response.redirect(`/Quetion/${request.params.id}`)
  }
  else{
    request.flash("error","Failed To Create Url")
    response.redirect(`/Quetion/${request.params.id}`)
  }
})
// delete Request
app.delete(
  "/delete/:id",
  connectEnsure.ensureLoggedIn({ redirectTo: "/" }),
  async (request, response) => {
    console.log("We Get Delete Request From:" + request.params.id);
    let deleteElection = await CreateElection.RemoveElection(request.params.id,request.user.id);
    let deleteElectionQuetion = await Quetion.removeQuetion(request.params.id)
    let deleteVoters = await Voter.removeVoter(request.params.id)

    if (deleteElection ? true : false) {
      request.flash("success", "Successfully Deleted");
    } else {
      request.flash("error", "Failed To Delete");
    }
    return response.send(deleteElection ? true : false);
  }
);
app.delete(
  "/delete/Quetion/:id",
  connectEnsure.ensureLoggedIn({ redirectTo: "/" }),
  async (request, response) => {
    console.log("We Get Delete Request For Quetion:" + request.params.id);
    let deleteElectionQuetion = await Quetion.removeQuetion(request.params.id);
    console.log(deleteElectionQuetion);
    if (deleteElectionQuetion ? true : false) {
      request.flash("success", "Successfully Deleted");
    } else {
      request.flash("error", "Failed To Delete");
    }
    return response.send(deleteElectionQuetion ? true : false);
  }
);

app.delete(
  "/delete/Option/:id",
  connectEnsure.ensureLoggedIn({ redirectTo: "/" }),
  async (request, response) => {
    console.log("Executed");
    console.log("We Get Delete Request For Option:" + request.params.id);
    let deleteElectionOption = await CreateOption.removeOption(
      request.params.id,
      request.user.id
    );
    console.log(deleteElectionOption ? true : false);
    if (!deleteElectionOption ? true : false) {
      request.flash("success", "Successfully Deleted");
    } else {
      request.flash("error", "Failed To Delete");
    }
    return response.send(!deleteElectionOption ? true : false);
  }
);

app.delete(
  "/delete/Voter/:id",
  connectEnsure.ensureLoggedIn({ redirectTo: "/" }),
  async (request, response) => {
    console.log("We Get Delete Request For Voter:" + request.params.id);
    let deleteElectionVoter = await Voter.removeVoter(request.params.id);
    console.log(!deleteElectionVoter ? true : false);
    if (!deleteElectionVoter ? true : false) {
      request.flash("success", "Successfully Deleted");
    } else {
      request.flash("error", "Failed To Delete");
    }
    return response.send(!deleteElectionVoter ? true : false);
  }
);

module.exports = app;
