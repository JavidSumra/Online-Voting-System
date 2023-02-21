/* eslint-disable no-undef */
const request = require("supertest");
var cheerio = require("cheerio");
const db = require("../models/index");
const VotingApp = require("../VotingSystem");

let server, agent;

function extractCsrfToken(response) {
  var $ = cheerio.load(response.text);
  return $("[name=_csrf]").val();
}

const login = async (agent, username, password) => {
  let res = await agent.get("/");
  let csrfToken = extractCsrfToken(res);
  res = await agent.post("/AdminLogin").send({
    email: username,
    password: password,
    _csrf: csrfToken,
  });
};

describe("Online Voting Test Suite", () => {
  beforeAll(async () => {
    await db.sequelize.sync({ force: true });
    server = VotingApp.listen(3008 || process.env.PORT, () => {});
    agent = request.agent(server);
  });
  afterAll(async () => {
    await db.sequelize.close();
    server.close();
  });

  test("Admin Login", async () => {
    let response = await agent.get("/SignUp");
    const csrfToken = extractCsrfToken(response);
    response = await agent.post("/SignUpUser").send({
      FirstName: "Javid",
      LastName: "Sumra",
      email: "javidsumara987@gmail.com",
      password: "12345678",
      _csrf: csrfToken,
    });
    expect(response.statusCode).toBe(302);
  });

  test("Admin Signout", async () => {
    let response = await agent.get("/Home");
    expect(response.statusCode).toBe(200);
    response = await agent.get("/Signout");
    expect(response.statusCode).toBe(302);
    response = await agent.get("/Home");
    expect(response.statusCode).toBe(302);
  });

  test("Admin Login", async () => {
    const agent = request.agent(server);
    let response = await agent.get("/Home");
    expect(response.statusCode).toBe(302);
    await login(agent, "javidsumara987@gmail.com", "12345678");
    response = await agent.get("/Home");
    expect(response.statusCode).toBe(200);
  });

  test("Create Election", async () => {
    try {
      const agent = request.agent(server);
      await login(agent, "javidsumara987@gmail.com", "12345678");
      let response = await agent.get("/Home");
      let csrfToken = extractCsrfToken(response);
      const res = await agent.post("/AddElectionTitle").send({
        Title: "Who is Next P.M",
        _csrf: csrfToken,
      });
      let resp = await agent.get("/Home");
      expect(resp.statusCode).toBe(200);
    } catch (error) {
      console.log("Error:" + error);
    }
  });

  test("Delete Election", async () => {
    const agent = request.agent(server);
    await login(agent, "javidsumara987@gmail.com", "12345678");
    let response = await agent.get("/Home");
    let csrfToken = extractCsrfToken(response);
    await agent.post("/AddElectionTitle").send({
      Title: "Class Monitor-2023",
      _csrf: csrfToken,
    });

    response = await agent.get("/Home").set("Accept", "application/json");
    const ParseElection = JSON.parse(response.text);
    const ParseElectionlength = ParseElection.getElection.length;
    console.log(ParseElectionlength);
    const Election = ParseElection.getElection[ParseElectionlength - 1];
    console.log(Election);
    response = await agent.get("/Home");
    csrfToken = extractCsrfToken(response);

    const res = await agent
      .delete(`/delete/${Election.id}`)
      .send({ _csrf: csrfToken });

    const status = Boolean(res.text);
    expect(status).toBe(true);
  });
});
