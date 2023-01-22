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
const { send } = require("process");
const voterdetail = require("./models/voterdetail");

let Admin = require("./models/votingadmin")(sequelize, DataTypes);
let Quetion = require("./models/quetiondetail")(sequelize, DataTypes);
const CreateElection = require("./models/electiondetail")(sequelize, DataTypes);
const CreateOption = require("./models/optiondetail")(sequelize, DataTypes);
const Voter = require("./models/voterlogin")(sequelize, DataTypes);
const Voting = require("./models/voterdetail")(sequelize, DataTypes);
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
// Get Request's
app.get("/", (request, response) => {
  try {
    response.status(200).render("Login", { csrfToken: request.csrfToken() });
  } catch (error) {
    response.status(402).send(error);
  }
});

app.get("/Signup", (request, response) => {
  try {
    response.status(200).render("SignUp", { csrfToken: request.csrfToken() });
  } catch (error) {
    response.status(402).send(error);
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
        // console.log(getElection)
        console.log(getElection);
        response.status(200).render("Home", {
          csrfToken: request.csrfToken(),
          User: request.user.FirstName,
          getElection,
        });
      } else {
        response.redirect("/");
      }
    } catch (error) {
      response.status(402).send(error);
    }
  }
);

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
        URL,
      });
    } catch (error) {
      response.status(402).send(error);
    }
  }
);

app.get(
  "/ManageQuetion/:id",
  connectEnsure.ensureLoggedIn({ redirectTo: "/" }),
  async (request, response) => {
    try {
      let elcetionList = await CreateElection.findByPk(request.params.id);
      let QuetionList = await Quetion.getQuetionList(request.params.id);
      // let OptionList = await CreateOption.getOptionList(request.params.id);
      response.status(200).render("ManageQuetion", {
        csrfToken: request.csrfToken(),
        User: request.user.FirstName,
        elcetionList,
        QuetionList,
      });
    } catch (error) {
      response.status(402).send(error);
    }
  }
);
app.get(
  "/ManageOption/:id/election/:ElectId",
  connectEnsure.ensureLoggedIn({ redirectTo: "/" }),
  async (request, response) => {
    try {
      console.log("ManageOption:" + request.params.id);
      let electionList = await CreateElection.findByElectID(request.params.ElectId);
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
      console.log(error);
      response.status(402).send(error);
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
      console.log("AddVoter:" + electionList);
      console.log(electionList.Title);
      response.status(200).render("AddVoters", {
        User: request.user.FirstName,
        electionList,
        csrfToken: request.csrfToken(),
      });
    } catch (error) {
      response.status(402).send(error);
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
      });
    } catch (error) {
      response.status(402).send(error);
    }
  }
);

app.get("/loginvoter/:id", (request, response) => {
  try {
    response.status(200).render("VoterLogin", {
      csrfToken: request.csrfToken(),
      Id: request.params.id,
    });
  } catch (error) {
    response.status(402).send(error);
  }
});

app.get(
  "/DeclareElection/:id",
  connectEnsure.ensureLoggedIn({ redirectTo: "/" }),
  async (request, response) => {
    try {
      let electionList = await CreateElection.findByPk(request.params.id);
      console.log(electionList);
      console.log(request.params.id);
      let QuetionDetail = await Quetion.getQuetionList(request.params.id);
      let VoterDetail = await Voter.getVotersList(request.params.id);
      let getOptionList;
      for (let i = 0; i < QuetionDetail.length; i++) {
        getOptionList = await CreateOption.getOptionList(QuetionDetail[i].id);
      }
      if (electionList.Start === true && electionList.End === false) {
        request.flash("error", "Election Is Already Live");
        response.redirect(`/loginvoter/${request.params.id}`);
      } else {
        if (QuetionDetail.length >= 1) {
          if (getOptionList.length >= 2) {
            if (VoterDetail.length >= 1) {
              request.flash("success", "Election is Live");
              await electionList.StartElection(request.params.id);
              response.redirect(`/loginvoter/${request.params.id}`);
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
      response.status(402).send(error);
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
      response.status(402).send(error);
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

      console.log(QuetionDetail);
      console.log(QuetionDetail.length);

      let getOptionList = [];
      for (let i = 0; i < QuetionDetail.length; ++i) {
        let OptionList = await CreateOption.getOptionList(QuetionDetail[i].id);
          for(let j=0;j<OptionList.length;j++){
            getOptionList.push(OptionList)
          }
      }
      console.log(getOptionList)
      if (electionList.Start === true && electionList.End === false) {
        response.status(200).render("electionPerview", {
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
    } catch (error) {
      response.status(402).send(error);
    }
  }
);

app.get("/voting/:id", async (request, response) => {
  try {
    console.log(request.params.id);
    let electionList = await CreateElection.findByPk(request.params.id);
    let QuetionDetail = await Quetion.getQuetionList(electionList.id);
    let VoterDetail = await Voter.getVotersList(electionList.id);
    let getOptionList = [];
    for (let i = 0; i < QuetionDetail.length; ++i) {
      let OptionList = await CreateOption.getOptionList(QuetionDetail[i].id);
        for(let j=0;j<OptionList.length;j++){
          getOptionList.push(OptionList)
        }
    }
    console.log(VoterDetail);
    console.log("Voter Login:" + VoterDetail.length);

    response.status(200).render("VotersVote", {
      csrfToken: request.csrfToken(),
      electionList,
      QuetionDetail,
      getOptionList,
      VoterDetail,
    });
  } catch (error) {
    console.log("Error:" + error);
    response.status(402).send(error);
  }
});

app.get(
  "/election/ResultPerview/:id",
  connectEnsure.ensureLoggedIn("/"),
  async (request, response) => {
    try {
      console.log(request.params.id);
      if (request.user.UserRole == "Admin") {
        let electionList = await CreateElection.findByElectID(
          request.params.id
        );
        console.log(electionList);
        console.log(electionList.length);
        console.log(electionList[0].Start);
        console.log(electionList[0].id);
        if (electionList[0].Start == true) {
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

          let TotalNumberofVoters = await Voter.getTotalVoters(request.params.id);
          let RemaininigVoters = await Voter.getRemVoters(request.params.id);
          let SuccessVoters = await Voter.getSuccessVoters(request.params.id);
         console.log( QuetionDetail,
          OptionDetail,
          QuetionId,
          Vote,)
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
          request.flash("error", "Please Make Sure Election is Live or Not!");
          return response.redirect("/Home");
        }
      } else {
        response.redirect("/");
      }
    } catch (error) {
      response.send(error);
    }
  }
);
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
    response.status(402).send(error);
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
      response.status(402).send(error);
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
    response.status(402).send(error);
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
      response.status(402).send(error);
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

      response.redirect(`/ManageQuetion/${request.params.id}`);
    } catch (error) {
      response.status(402).send(error);
    }
  }
);

app.post(
  "/addOption/:QueId/:id",
  connectEnsure.ensureLoggedIn({ redirectTo: "/" }),
  async (request, response) => {
    try {
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
    } catch (error) {
      response.status(402).send(error);
    }
  }
);

app.post(
  "/AddVoter/:id",
  connectEnsure.ensureLoggedIn({ redirectTo: "/" }),
  async (request, response) => {
    console.log(request.params.id);
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
        console.log("Voter:" + addVoter);
        request.flash("success", "Voter Suceessfully Created");
        return response.redirect(`/Quetion/${request.params.id}`);
      }
    } catch (error) {
      response.status(402).send(error);
    }
  }
);

app.post("/VoterLogin/:id", async (request, response) => {
  try {
    passport.authenticate("local-Voter", {
      failureRedirect: `/loginvoter/${request.params.id}`,
      failureFlash: true,
    });
    request.flash("success", "Login Suceessfully");
    return response.redirect(`/voting/${request.params.id}`);
  } catch (error) {
    response.status(402).send(error);
  }
});

app.post("/addVote/:id/:voteId", async (request, response) => {
  console.log(request.body);
  let electionList = await CreateElection.findByPk(request.params.id);
  let QuetionDetail = await Quetion.getQuetionList(request.params.id);
  let VoterDetail = await Voter.findByPk(request.params.voteId);
  console.log(VoterDetail);
  for (let i = 0; i < QuetionDetail.length; i++) {
    let VoteValue = request.body[`Option-[${QuetionDetail[i].id}]`];
    console.log(VoteValue);
    let AddVote = await Voting.create({
      ElectionId: electionList.id,
      QuetionId: QuetionDetail[i].id,
      VoterId: request.params.voteId,
      TotalVotes: VoteValue,
    });
    console.log(AddVote);
  }
  //  console.log(updateVotingStatus)
  await VoterDetail.votedVoter();
  console.log(QuetionDetail);
  console.log(electionList);
  response.redirect(`/voting/${request.params.id}`);
});
// delete Request
app.delete(
  "/delete/:id",
  connectEnsure.ensureLoggedIn({ redirectTo: "/" }),
  async (request, response) => {
    try {
      console.log(request.params.id);
      let electionList = await CreateElection.findByPk(request.params.id);
      console.log(electionList);
      if (electionList.Start === true && electionList.End === false) {
        request.flash("error", "Election is Live Please End First");
        console.log("If PArt");
        response.redirect("/Home");
      } else {
        console.log(
          "We Get Delete Request From:" + request.params.id + request.user.id
        );
        let deleteElection = await CreateElection.RemoveElection(
          request.params.id,
          request.user.id
        );
        console.log(deleteElection ? true : false);
        let deleteElectionQuetion = await Quetion.removeParticularQuetion(
          request.params.id
        );
        console.log(deleteElectionQuetion);
        let deleteVoters = await Voter.removeParticularVoter(request.params.id);
        console.log(deleteVoters);
        if (deleteElection ? true : false) {
          request.flash("success", "Successfully Deleted");
        } else {
          request.flash("error", "Failed To Delete");
        }
        return response.send(deleteElection ? true : false);
      }
    } catch (error) {
      response.status(402).send(error);
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
      response.status(402).send(error);
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
      response.status(402).send(error);
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
      if (!deleteElectionVoter ? true : false) {
        request.flash("success", "Successfully Deleted");
      } else {
        request.flash("error", "Failed To Delete");
      }
      return response.status(200).send(!deleteElectionVoter ? true : false);
    } catch (error) {
      response.status(402).send(error);
    }
  }
);

module.exports = app;
