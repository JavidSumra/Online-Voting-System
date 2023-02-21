/* eslint-disable no-undef */
let port = process.env.PORT || 3008;
let app = require("./VotingSystem");

app.listen(port, () => {
  console.log(`Server Started on Port Number:${port}`);
});
