/* eslint-disable no-unused-vars */
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
// const fetch = (...args) =>
//   import("node-fetch").then(({ default: fetch }) => fetch(...args));
const saltRound = 10;

const passport = require("passport");
const LocalStrategy = require("passport-local");
const connectEnsure = require("connect-ensure-login");

const path = require("path");

//Set View Engine
app.set("views", path.join(__dirname + "/views"));
app.set("view engine", "ejs");

const { sequelize } = require("./models");
const { DataTypes } = require("sequelize");

const sendMail = require("./nodemailer");

//Models
let Admin = require("./models/votingadmin")(sequelize, DataTypes);
let Quetion = require("./models/quetiondetail")(sequelize, DataTypes);
const CreateElection = require("./models/electiondetail")(sequelize, DataTypes);
const CreateOption = require("./models/optiondetail")(sequelize, DataTypes);
const Voter = require("./models/voterlogin")(sequelize, DataTypes);
const Voting = require("./models/voterdetail")(sequelize, DataTypes);

app.use(express.static("./Assets/"));
app.use(bodyParser.json());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookiepasrser("this is Secret String"));
app.use(csrf("this_should_be_32_character_long", ["POST", "PUT", "DELETE"]));

//Flash Message
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

//Authenticate Admin
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
            return done(null, false, { message: "User Doesn't Exist" });
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

// Get Request's
app.get("/", async (request, response) => {
  try {
    response.status(200).render("Login", { csrfToken: request.csrfToken() });
  } catch (error) {
    console.log("Error:" + error);
    request.flash("error", `Error:${error}`);
    response.redirect("back");
  }
});

app.get("/Signup", (request, response) => {
  try {
    response.status(200).render("SignUp", { csrfToken: request.csrfToken() });
  } catch (error) {
    console.log("Error:" + error);
    request.flash("error", `Error:${error}`);
    response.redirect("back");
  }
});

app.get(
  "/Home",
  connectEnsure.ensureLoggedIn({ redirectTo: "/" }),
  async (request, response) => {
    try {
      if (request.user.UserRole == "Admin") {
        console.log(request.user.id);
        let getElection = await CreateElection.RetriveElection(request.user.id);
        let liveElection = await CreateElection.getLiveElection(
          request.user.id
        );
        let completedElection = await CreateElection.getCompletedElection(
          request.user.id
        );
        // console.log(getElection)
        console.log(getElection);
        if (request.accepts("html")) {
          response.render("Home", {
            csrfToken: request.csrfToken(),
            User: request.user.FirstName,
            getElection,
            Live: liveElection.length,
            complete: completedElection.length,
          });
        } else {
          response.json({
            getElection,
            User: request.user.FirstName,
          });
        }
      } else {
        response.redirect("/");
      }
    } catch (error) {
      console.log("Error:" + error);
      request.flash("error", `Error:${error}`);
      response.redirect("back");
    }
  }
);

app.get("/users", async (request, response) => {
  try {
    let usersList = await Admin.allUserList();
    response.render("users", { usersList, csrfToken: request.csrfToken() });
  } catch (error) {
    response.send(error);
  }
});
app.get(
  "/Quetion/:id",
  connectEnsure.ensureLoggedIn({ redirectTo: "/" }),
  async (request, response) => {
    try {
      console.log("Id:" + request.params.id);
      let electionList = await CreateElection.findByPk(request.params.id);
      let QuetionList = await Quetion.getQuetionList(request.params.id);
      let VotersList = await Voter.getVotersList(request.params.id);
      // console.log(VotersList);
      response.status(200).render("AddQuetion", {
        csrfToken: request.csrfToken(),
        User: request.user.FirstName,
        electionList,
        QuetionList,
        VotersList,
      });
    } catch (error) {
      console.log("Error:" + error);
      request.flash("error", `Error:${error}`);
      response.redirect("back");
    }
  }
);

app.get(
  "/ManageQuetion/:id",
  connectEnsure.ensureLoggedIn({ redirectTo: "/" }),
  async (request, response) => {
    try {
      let electionList = await CreateElection.findByPk(request.params.id);
      console.log(electionList.Start);
      if (electionList.Start == true) {
        request.flash("error", "Election is Live Now You Can Not Edit Quetion");
        response.redirect(`/Quetion/${request.params.id}`);
      } else {
        let electionList = await CreateElection.findByPk(request.params.id);
        let QuetionList = await Quetion.getQuetionList(request.params.id);
        console.log(electionList);
        // let OptionList = await CreateOption.getOptionList(request.params.id);
        response.status(200).render("ManageQuetion", {
          csrfToken: request.csrfToken(),
          User: request.user.FirstName,
          electionList,
          QuetionList,
        });
      }
    } catch (error) {
      console.log("Error:" + error);
      request.flash("error", `Error:${error}`);
      response.redirect("back");
    }
  }
);
app.get(
  "/ManageOption/:id/election/:ElectId",
  connectEnsure.ensureLoggedIn({ redirectTo: "/" }),
  async (request, response) => {
    try {
      console.log("ManageOption:" + request.params.id);
      let electionList = await CreateElection.findByElectID(
        request.params.ElectId
      );
      let OptionList = [];
      OptionList = await CreateOption.getOptionList(request.params.id);
      console.log(OptionList ? true : false);
      let QuetionDetail = await Quetion.getParticularList(request.params.id);
      console.log(QuetionDetail);
      console.log(OptionList);
      response.status(200).render("AddOption", {
        User: request.user.FirstName,
        csrfToken: request.csrfToken(),
        Id: electionList[0].id,
        OptionList,
        QuetionDetail,
      });
    } catch (error) {
      console.log("Error:" + error);
      request.flash("error", `Error:${error}`);
      response.redirect("back");
    }
  }
);

app.get(
  "/voter/addVoter/:id",
  connectEnsure.ensureLoggedIn({ redirectTo: "/" }),
  async (request, response) => {
    try {
      console.log("Voter Id:" + request.params.id);
      let electionList = await CreateElection.findByPk(request.params.id);
      if (electionList.Start === true) {
        request.flash("error", "Election is Live Now You Can Not Add Voters");
        response.redirect(`/Quetion/${request.params.id}`);
      } else {
        console.log("AddVoter:" + electionList);
        console.log(electionList.Title);
        response.status(200).render("AddVoters", {
          User: request.user.FirstName,
          electionList,
          csrfToken: request.csrfToken(),
        });
      }
    } catch (error) {
      console.log("Error:" + error);
      request.flash("error", `Error:${error}`);
      response.redirect("back");
    }
  }
);

app.get(
  "/Manage/voter/:id",
  connectEnsure.ensureLoggedIn({ redirectTo: "/" }),
  async (request, response) => {
    try {
      let VotersList = await Voter.getVotersList(request.params.id);
      response.status(200).render("ManageVoter", {
        csrfToken: request.csrfToken(),
        User: request.user.FirstName,
        VotersList,
        Id: request.params.id,
      });
    } catch (error) {
      request.flash("error", `Error:${error}`);
      response.redirect("back");
    }
  }
);

app.get("/loginvoter/:id", (request, response) => {
  try {
    response.status(200).render("VoterLogin", {
      csrfToken: request.csrfToken(),
      Id: request.params.id,
    });
    // request.flash("error", "Admin Can't Access Voter Login Page");
    // response.redirect("/");
  } catch (error) {
    console.log("Error:" + error);
    request.flash("error", `Error:${error}`);
    response.redirect("back");
  }
});

app.get(
  "/DeclareElection/:id",
  connectEnsure.ensureLoggedIn({ redirectTo: "/" }),
  async (request, response) => {
    try {
      let electionList = await CreateElection.findByPk(request.params.id);
      let QuetionDetail = await Quetion.getQuetionList(request.params.id);
      let VoterDetail = await Voter.getVotersList(request.params.id);
      let getOptionList;

      for (let i = 0; i < QuetionDetail.length; i++) {
        getOptionList = await CreateOption.getOptionList(QuetionDetail[i].id);
      }
      if (electionList.Start === true && electionList.End === false) {
        request.flash("error", "Election Is Already Live");
        response.redirect(`/Quetion/${request.params.id}`);
      } else {
        if (QuetionDetail.length >= 1) {
          if (getOptionList.length >= 2) {
            if (VoterDetail.length >= 1) {
              request.flash("success", "Election is Live");
              await electionList.StartElection(request.params.id);
              response.redirect(`/Quetion/${request.params.id}`);
            } else {
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
    } catch (error) {
      console.log("Error:" + error);
      request.flash("error", `Error:${error}`);
      response.redirect("back");
    }
  }
);

app.get(
  "/EndElection/:id",
  connectEnsure.ensureLoggedIn({ redirectTo: "/" }),
  async (request, response) => {
    try {
      let electionList = await CreateElection.findByPk(request.params.id);

      if (electionList.Start === true && electionList.End === false) {
        request.flash("success", "Election is Now Ended");
        await electionList.EndElection(request.params.id);
        response.redirect(`/Quetion/${request.params.id}`);
      } else {
        request.flash("error", "Please Make Sure Election Is Live or Not");
        response.redirect(`/Quetion/${request.params.id}`);
      }
    } catch (error) {
      console.log("Error:" + error);
      request.flash("error", `Error:${error}`);
      response.redirect("back");
    }
  }
);

app.get(
  "/ElectionPerview/:id",
  connectEnsure.ensureLoggedIn({ redirectTo: "/" }),
  async (request, response) => {
    try {
      let electionList = await CreateElection.findByPk(request.params.id);
      let QuetionDetail = await Quetion.getQuetionList(request.params.id);

      let getOptionList = [];
      for (let i = 0; i < QuetionDetail.length; ++i) {
        let OptionList = await CreateOption.getOptionList(QuetionDetail[i].id);
        getOptionList.push(OptionList);
      }

      response.status(200).render("electionPerview", {
        csrfToken: request.csrfToken(),
        User: request.user.FirstName,
        electionList,
        QuetionDetail,
        getOptionList,
      });
    } catch (error) {
      console.log("Error:" + error);
      request.flash("error", `Error:${error}`);
      response.redirect("back");
    }
  }
);

app.get(
  "/editQuetion/:id",
  connectEnsure.ensureLoggedIn({ redirectTo: "/" }),
  async (request, response) => {
    try {
      let QuetionDetail = await Quetion.findByPk(request.params.id);
      response.status(200).render("editQuetion", {
        csrfToken: request.csrfToken(),
        QuetionDetail,
        User: request.user.FirstName,
      });
    } catch (error) {
      console.log("Error:" + error);
      request.flash("error", `Error:${error}`);
      response.redirect("back");
    }
  }
);

app.get("/voting/:id/:voterId", async (request, response) => {
  try {
    let electionList = await CreateElection.findByPk(request.params.id);
    let VoterDetail = await Voter.getVoter(request.params.voterId);

    if (VoterDetail.length != 0) {
      if (electionList.End == true) {
        response.redirect(`/result/${request.params.id}`);
      } else if (electionList.End == false && electionList.Start == true) {
        if (VoterDetail.UserRole == "Voter") {
          let QuetionDetail = await Quetion.getQuetionList(electionList.id);
          let getOptionList = [];
          for (let i = 0; i < QuetionDetail.length; ++i) {
            let OptionList = await CreateOption.getOptionList(
              QuetionDetail[i].id
            );
            getOptionList.push(OptionList);
          }

          response.status(200).render("VotersVote", {
            csrfToken: request.csrfToken(),
            electionList,
            QuetionDetail,
            getOptionList,
            VoterDetail,
          });
        } else {
          request.flash("error", "Voting Completed");
          response.redirect(`/loginvoter/${request.params.id}`);
        }
      } else {
        request.flash("error", "Voting Not Started Yet");
        response.redirect(`/loginvoter/${request.params.id}`);
      }
    } else {
      request.flash("error", "Login Please");
      response.redirect(`/loginvoter/${request.params.id}`);
    }
  } catch (error) {
    console.log("Error:" + error);
    request.flash("error", `Error:${error}`);
    response.redirect("back");
  }
});

app.get(
  "/election/ResultPerview/:id",
  connectEnsure.ensureLoggedIn("/"),
  async (request, response) => {
    try {
      let list = await CreateElection.findByPk(request.params.id);
      if (list.Start === true) {
        if (list.Start === false || list.End === false) {
          if (request.user.UserRole == "Admin") {
            let electionList = await CreateElection.findByElectID(
              request.params.id
            );
            let QuetionDetail = await Quetion.getQuetionList(request.params.id);
            let OptionDetail = [];
            let Vote = [];
            let QuetionId = [];

            for (let i = 0; i < QuetionDetail.length; i++) {
              QuetionId.push(QuetionDetail[i].id);
              let Options = await CreateOption.getOptionList(
                QuetionDetail[i].id
              );
              let OptionName = [];
              let VotesList = [];
              for (let j = 0; j < Options.length; j++) {
                OptionName.push(Options[j].OptionTitle);
                let votes = await Voting.getNumberofVotes(
                  electionList[0].id,
                  Options[j].OptionTitle,
                  QuetionDetail[i].id
                );
                VotesList.push(votes.length);
              }
              OptionDetail.push(OptionName);
              Vote.push(VotesList);
            }

            let TotalNumberofVoters = await Voter.getTotalVoters(
              request.params.id
            );
            let RemaininigVoters = await Voter.getRemVoters(request.params.id);
            let SuccessVoters = await Voter.getSuccessVoters(request.params.id);
            // response.send("Completed")
            response.status(200).render("ResultPerview", {
              electionList,
              QuetionDetail,
              OptionDetail,
              QuetionId,
              Vote,
              Total: TotalNumberofVoters.length,
              Remaining: RemaininigVoters.length,
              Success: SuccessVoters.length,
              User: request.user.FirstName,
            });
          } else {
            response.redirect(`/Quetion/${request.params.id}`);
          }
        } else {
          request.flash("error", "Make Sure Election is Live or Not!");
          response.redirect(`/Quetion/${request.params.id}`);
        }
      } else {
        request.flash("error", "Election is Not Live");
        response.redirect(`/Quetion/${request.params.id}`);
      }
    } catch (error) {
      console.log("Error:" + error);
      request.flash("error", `Error:${error}`);
      response.redirect("back");
    }
  }
);

app.get("/result/:id", async (request, response) => {
  try {
    let electionList = await CreateElection.findByElectID(request.params.id);
    let QuetionDetail = await Quetion.getQuetionList(request.params.id);
    let votedetail = await Voting.findByPk(request.params.id);
    console.log(votedetail);
    let OptionDetail = [];
    let Vote = [];
    let QuetionId = [];
    for (let i = 0; i < QuetionDetail.length; i++) {
      QuetionId.push(QuetionDetail[i].id);
      let Options = await CreateOption.getOptionList(QuetionDetail[i].id);
      let OptionName = [];
      let VotesList = [];
      for (let j = 0; j < Options.length; j++) {
        OptionName.push(Options[j].OptionTitle);
        let votes = await Voting.getNumberofVotes(
          electionList[0].id,
          Options[j].OptionTitle,
          QuetionDetail[i].id
        );
        VotesList.push(votes.length);
      }
      OptionDetail.push(OptionName);
      Vote.push(VotesList);
    }
    console.log(QuetionDetail, OptionDetail, QuetionId, Vote);
    // response.send("Completed")
    let TotalNumberofVoters = await Voter.getTotalVoters(request.params.id);
    let SuccessVoters = await Voter.getSuccessVoters(request.params.id);
    response.status(200).render("Result", {
      electionList,
      QuetionDetail,
      OptionDetail,
      QuetionId,
      Vote,
      TotalNumberofVoters,
      SuccessVoters,
      votedetail,
    });
  } catch (error) {
    console.log("Error:" + error);
    request.flash("error", `Error:${error}`);
    response.redirect("back");
  }
});

app.get("/editOption/:id/:electId", async (request, response) => {
  let OptionList = await CreateOption.findByPk(request.params.id);
  try {
    response.render("editOption", {
      csrfToken: request.csrfToken(),
      User: request.user.FirstName,
      OptionList,
      Id: request.params.electId,
    });
  } catch (error) {
    console.log("Error:" + error);
    request.flash("error", `Error:${error}`);
    response.redirect("back");
  }
});

app.get("/editVoter/:id", async (request, response) => {
  let VoterList = await Voter.findByPk(request.params.id);
  console.log(VoterList);
  try {
    response.render("updateVoter", {
      csrfToken: request.csrfToken(),
      User: request.user.FirstName,
      VoterList,
    });
  } catch (error) {
    console.log("Error:" + error);
    request.flash("error", `Error:${error}`);
    response.redirect("back");
  }
});

app.get("/forgotPass", async (request, response) => {
  try {
    response.render("forgotpass", { csrfToken: request.csrfToken() });
  } catch (error) {
    console.log("Error:" + error);
    request.flash("error", `Error:${error}`);
    response.redirect("back");
  }
});
app.get("/Signout", (request, response, next) => {
  try {
    request.logout((err) => {
      if (err) {
        return next(err);
      }
      request.flash("success", "Signout Successfully");
      response.redirect("/");
    });
  } catch (error) {
    console.log("Error:" + error);
    request.flash("error", `Error:${error}`);
    response.redirect("back");
  }
});

app.get("/Signout/Voter/:id", (request, response) => {
  try {
    request.logout((err) => {
      if (err) {
        return next(err);
      }
      request.flash("success", "Signout Successfully");
      response.redirect(`/loginvoter/${request.params.id}`);
    });
  } catch (error) {
    console.log("Error:" + error);
    request.flash("error", `Error:${error}`);
    response.redirect("back");
  }
});

// Post Request
app.post(
  "/AdminLogin",
  passport.authenticate("local", { failureRedirect: "/", failureFlash: true }),
  async (request, response) => {
    try {
      if (request.user.UserRole == "Admin") {
        console.log("Admin");
      }
      request.flash("success", "Login Successfully");
      response.redirect("/Home");
    } catch (error) {
      console.log("Error:" + error);
      request.flash("error", `Error:${error}`);
      response.redirect("back");
    }
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
    console.log("Error:" + error);
    request.flash("error", `Error:${error}`);
    response.redirect("back");
  }
});

app.post("/forgotPass/User", async (request, response) => {
  try {
    let findUser = await Admin.getUser(request.body.email);
    if (findUser) {
      if (request.body.NewPass === request.body.ConPass) {
        let Hashpass = await bcrypt.hash(request.body.NewPass, saltRound);
        await findUser.updatePass(Hashpass);
        request.flash("success", "Password Updated Successfully");
        response.redirect("/");
      } else {
        request.flash(
          "error",
          "New Password and Confirm Password Are Not Same"
        );
        response.redirect("/forgotPass");
      }
    } else {
      request.flash("error", "Please SignUp First");
      response.redirect("/SignUp");
    }
  } catch (error) {
    console.log("Error:" + error);
    request.flash("error", `Error:${error}`);
    response.redirect("back");
  }
});

app.post(
  "/AddElectionTitle",
  connectEnsure.ensureLoggedIn({ redirectTo: "/" }),
  async (request, response) => {
    try {
      if (request.user.UserRole == "Admin") {
        if (request.body.title.length < 10) {
          request.flash(
            "error",
            "Please Add Title with Length Greater than 10"
          );
          response.redirect(`/Home`);
        } else {
          console.log("Request User Id:" + request.user.id);
          let addElection = await CreateElection.create({
            Title: request.body.title,
            userId: request.user.id,
            Start: false,
            End: false,
          });
          console.log("Created");
          console.log(addElection);
          // console.log(addElection.userId)
          request.flash("success", "Election Created Successfully");
          response.redirect(`Quetion/${addElection.id}`);
        }
      } else {
        response.redirect("/");
      }
    } catch (error) {
      console.log("Error:" + error);
      request.flash("error", `Error:${error}`);
      response.redirect("back");
    }
  }
);

app.post(
  "/addQuetion/:id",
  connectEnsure.ensureLoggedIn({ redirectTo: "/" }),
  async (request, response) => {
    try {
      let electionList = await CreateElection.findByPk(request.params.id);
      if (electionList.Start == true) {
        request.flash("error", "Election is Live Now You Cannot Edit Quetion");
        response.redirect(`/ManageQuetion/${request.params.id}`);
      } else {
        if (
          request.body.QuetionTitle.trim().length > 20 ||
          request.body.Description.trim().length < 10
        ) {
          request.flash(
            "error",
            "Quetion Title Must Less Than 15 And Quetion Description Greater Than 10"
          );
          response.redirect(`/ManageQuetion/${request.params.id}`);
        } else {
          console.log("Post Request:" + request.params.id);
          let AddQuetion = await Quetion.create({
            QuetionTitle: request.body.QuetionTitle,
            Description: request.body.Description,
            ElectionId: request.params.id,
          });
          console.log(AddQuetion);
          response.redirect(`/ManageQuetion/${request.params.id}`);
        }
      }
    } catch (error) {
      console.log("Error:" + error);
      request.flash("error", `Error:${error}`);
      response.redirect("back");
    }
  }
);

app.post(
  "/editQuetion/:id",
  connectEnsure.ensureLoggedIn({ redirectTo: "/" }),
  async (request, response) => {
    try {
      let QuetionDetail = await Quetion.findByPk(request.params.id);
      let updateTitle = request.body.QuetionTitle;
      let updateDesc = request.body.Description;
      console.log(updateTitle + "\n" + updateDesc);
      if (updateTitle.trim().length > 20 || updateDesc.trim().length < 10) {
        request.flash(
          "error",
          "Quetion Title Must Less Than 10 And Quetion Description Greater Than 10"
        );
        response.redirect(`/editQuetion/${request.params.id}`);
      } else {
        await QuetionDetail.updateQuetion(updateTitle, updateDesc);
        request.flash("success", "Quetion Updated Successfully");
        response.redirect(`/editQuetion/${request.params.id}`);
      }
    } catch (error) {
      console.log("Error:" + error);
      request.flash("error", `Error:${error}`);
      response.redirect("back");
    }
  }
);

app.post(
  "/editOption/:id/:electId",
  connectEnsure.ensureLoggedIn({ redirectTo: "/" }),
  async (request, response) => {
    try {
      let OptionDetail = await CreateOption.findByPk(request.params.id);
      let updateTitle = request.body.OptionTitle;
      if (updateTitle.trim().length > 10) {
        request.flash("error", "Option Title Must Less Than 10");
        response.redirect(
          `/editOption/${request.params.id}/${request.params.electId}`
        );
      } else {
        await OptionDetail.updateOption(updateTitle);
        request.flash("success", "Option Updated Successfully");
        response.redirect(
          `/editOption/${request.params.id}/${request.params.electId}`
        );
      }
    } catch (error) {
      console.log("Error:" + error);
      request.flash("error", `Error:${error}`);
      response.redirect("back");
    }
  }
);

app.post(
  "/forgotPass/Voter",
  connectEnsure.ensureLoggedIn({ redirectTo: "/" }),
  async (request, response) => {
    try {
      let VoterDetail = await Voter.getParticularVoter(request.body.VoterId);
      console.log(VoterDetail);
      if (VoterDetail) {
        if (request.body.NewPass === request.body.ConPass) {
          let updatePass = request.body.NewPass;
          updatePass = await bcrypt.hash(updatePass, saltRound);
          await VoterDetail.updateVoterPass(updatePass);
          request.flash("success", "Voter Password Updated Successfully");
          response.redirect(`/Quetion/${request.user.id}`);
        } else {
          request.flash(
            "error",
            "New Password And Confirm Password Are Not Same"
          );
          response.redirect(`/editVoter/${request.params.id}`);
        }
      } else {
        request.flash("error", "Voter Does Not Exist");
        response.redirect(`/editVoter/${request.params.id}`);
      }
    } catch (error) {
      console.log("Error:" + error);
      request.flash("error", `Error:${error}`);
      response.redirect("back");
    }
  }
);

app.post(
  "/addOption/:QueId/:id",
  connectEnsure.ensureLoggedIn({ redirectTo: "/" }),
  async (request, response) => {
    try {
      if (request.body.Title.trim().length > 9) {
        request.flash("error", "Option Name Must Less Than 9");
        response.redirect(
          `/ManageOption/${request.params.QueId}/election/${request.params.id}`
        );
      } else {
        console.log("Add Option:" + request.params.id);
        console.log("Quetion Id:" + request.params.QueId);
        let addOption = await CreateOption.create({
          OptionTitle: request.body.Title,
          OptionId: request.params.QueId,
        });
        console.log(addOption);
        response.redirect(
          `/ManageOption/${request.params.QueId}/election/${request.params.id}`
        );
      }
    } catch (error) {
      console.log("Error:" + error);
      request.flash("error", `Error:${error}`);
      response.redirect("back");
    }
  }
);

app.post(
  "/AddVoter/:id",
  connectEnsure.ensureLoggedIn({ redirectTo: "/" }),
  async (request, response) => {
    console.log(request.params.id);
    try {
      if (
        request.body.VoterId.trim().length > 10 &&
        request.body.VoterId.trim().length < 5
      ) {
        request.flash("error", "Voter Id Must Greater Than 5 and Less Than 10");
        response.redirect(`/voter/addVoter/${request.params.id}`);
      } else {
        let findVoter = await Voter.findOne({
          where: { VoterId: request.body.VoterId },
        });
        if (findVoter) {
          request.flash("error", "Voter Id Already Exist");
          response.redirect(`/voter/addVoter/${request.params.id}`);
        } else {
          const electiondetail = await CreateElection.findByPk(
            request.params.id
          );
          console.log(electiondetail);
          let hashPass = await bcrypt.hash(request.body.password, saltRound);
          let hashAddhar = await bcrypt.hash(request.body.VoterId, saltRound);
          console.log(request.body.email);
          let addVoter = await Voter.create({
            email: request.body.email,
            VoterId: hashAddhar,
            password: hashPass,
            userElectionId: request.params.id,
            Status: false,
            UserRole: "Voter",
          });
          console.log(addVoter);
          if (addVoter) {
            console.log("Mail");
            sendMail(
              request.body.email,
              `Welcome to the ${electiondetail.Title} Voter List!`,
              `Dear Voter,

We are excited to inform you that you have been officially added to the voter list for the upcoming ${electiondetail.Title}! Your participation in this democratic process is vital to shaping the future of our community/country, and we are grateful to have you as a registered voter.

Your voter information:

Voter ID: ${request.body.VoterId},
Password: ${request.body.password},
Email:${request.body.email},

When Election is Live then You Can Vote on,
https://online-voting-platform-xoug.onrender.com/loginvoter/${electiondetail.id}

As a registered voter, you now have the privilege and responsibility of casting your vote in this election. It is your opportunity to have your voice heard and make a difference in the decisions that affect our community/country.`
            );
          }

          request.flash("success", "Voter Suceessfully Created");
          return response.redirect(`/Quetion/${request.params.id}`);
        }
      }
    } catch (error) {
      console.log("Error:" + error);
      request.flash("error", `Error:${error}`);
      response.redirect("back");
    }
  }
);

app.post(
  "/VoterLogin/:id",
  passport.authenticate("local-Voter", {
    failureRedirect: "back",
    failureFlash: true,
  }),
  async (request, response) => {
    let election = await Voter.findAll({
      where: {
        userElectionId: request.params.id,
        VoterId: request.body.VoterId,
      },
    });
    // console.log(election.length);
    if (election.length > 0) {
      try {
        console.log(request.user);
        request.flash("success", "Login Suceessfully");
        response.redirect(
          `/voting/${request.params.id}/${request.user.VoterId}`
        );
      } catch (error) {
        console.log("Error:" + error);
        request.flash("error", `Error:${error}`);
        response.redirect("back");
      }
    } else {
      request.flash("error", "You Can't Access Voting Page");
      response.redirect("back");
    }
  }
);

app.post("/addVote/:id/election/:voterId", async (request, response) => {
  console.log(request.body);
  try {
    console.log(request.user);
    let electionList = await CreateElection.findByPk(request.params.id);
    let QuetionDetail = await Quetion.getQuetionList(request.params.id);
    let VoterDetail = await Voter.findByPk(request.params.voterId);
    console.log(VoterDetail);
    console.log(VoterDetail.id);
    for (let i = 0; i < QuetionDetail.length; i++) {
      let VoteValue = request.body[`Option-[${QuetionDetail[i].id}]`];
      console.log(VoteValue);
      let AddVote = await Voting.create({
        ElectionId: electionList.id,
        QuetionId: QuetionDetail[i].id,
        VoterId: VoterDetail.id,
        TotalVotes: VoteValue,
      });
      console.log(AddVote);
    }
    //  console.log(updateVotingStatus)
    await VoterDetail.Voted();
    console.log(QuetionDetail);
    console.log(electionList);
    response.redirect(`/loginvoter/${request.params.id}`);
  } catch (error) {
    console.log("Error:" + error);
    request.flash("error", `Error:${error}`);
    response.redirect("back");
  }
});

// delete Request
app.delete(
  "/delete/:id",
  connectEnsure.ensureLoggedIn({ redirectTo: "/" }),
  async (request, response) => {
    try {
      // console.log(request.params.id);
      console.log(request.body);
      let electionList = await CreateElection.findByPk(request.params.id);
      // console.log(electionList);
      if (electionList.Start == true && electionList.End == false) {
        request.flash("error", "Election is Live Please End First");
        response.redirect("/Home", { _csrf: request.body._csrf });
      } else {
        console.log(
          "We Get Delete Request From:" + request.params.id + request.user.id
        );
        let deleteElection = await CreateElection.RemoveElection(
          request.params.id,
          request.user.id
        );
        let deleteElectionQuetion = await Quetion.removeParticularQuetion(
          request.params.id
        );
        let deleteVoters = await Voter.removeParticularVoter(request.params.id);
        if (deleteElection ? true : false) {
          request.flash("success", "Successfully Deleted");
        } else {
          request.flash("error", "Failed To Delete");
        }
        console.log(`Status:${deleteElection ? true : false}`);
        return response.send(deleteElection ? true : false);
      }
    } catch (error) {
      console.log("Error:" + error);
      request.flash("error", `Error:${error}`);
      response.redirect("back");
    }
  }
);
app.delete(
  "/delete/Quetion/:id",
  connectEnsure.ensureLoggedIn({ redirectTo: "/" }),
  async (request, response) => {
    try {
      console.log("We Get Delete Request For Quetion:" + request.params.id);
      let deleteElectionQuetion = await Quetion.removeQuetion(
        request.params.id
      );
      console.log(deleteElectionQuetion);
      if (deleteElectionQuetion ? true : false) {
        request.flash("success", "Successfully Deleted");
      } else {
        request.flash("error", "Failed To Delete");
      }
      return response.status(200).send(deleteElectionQuetion ? true : false);
    } catch (error) {
      console.log("Error:" + error);
      request.flash("error", `Error:${error}`);
      response.redirect("back");
    }
  }
);

app.delete(
  "/delete/Option/:id",
  connectEnsure.ensureLoggedIn({ redirectTo: "/" }),
  async (request, response) => {
    try {
      console.log("Executed");
      console.log("We Get Delete Request For Option:" + request.params.id);
      let deleteElectionOption = await CreateOption.removeOption(
        request.params.id,
        request.user.id
      );
      console.log(deleteElectionOption ? true : false);
      if (deleteElectionOption ? true : false) {
        request.flash("success", "Successfully Deleted");
      } else {
        request.flash("error", "Failed To Delete");
      }
      return response.status(200).send(deleteElectionOption ? true : false);
    } catch (error) {
      console.log("Error:" + error);
      request.flash("error", `Error:${error}`);
      response.redirect("back");
    }
  }
);

app.delete(
  "/delete/Voter/:id",
  connectEnsure.ensureLoggedIn({ redirectTo: "/" }),
  async (request, response) => {
    try {
      console.log("We Get Delete Request For Voter:" + request.params.id);
      let deleteElectionVoter = await Voter.removeVoter(request.params.id);
      console.log(!deleteElectionVoter ? true : false);
      if (deleteElectionVoter ? true : false) {
        request.flash("success", "Successfully Deleted");
      } else {
        request.flash("error", "Failed To Delete");
      }
      return response.status(200).send(deleteElectionVoter ? true : false);
    } catch (error) {
      console.log("Error:" + error);
      request.flash("error", `Error:${error}`);
      response.redirect("back");
    }
  }
);

app.delete("/Delete/User/:id", async (request, response) => {
  try {
    console.log(`We Got Request to Delete User With Id ${request.params.id}`);
    let deleteUser = await Admin.deleteUserById(request.params.id);
    return response.send(deleteUser ? true : false);
  } catch (error) {
    console.log(error);
    response.send(error);
  }
});
module.exports = app;
