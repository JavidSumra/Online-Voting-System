let port = 3008 || process.env.PORT;
let app = require("./VotingSystem");

app.listen(port,()=>{
    console.log(`Server Started on Port Number:${port}`);
})