const userInput = req.query.name;
document.innerHTML = userInput;
eval(userInput);
const query = "SELECT * FROM users WHERE id = " + userId;
db.query(query);
const child_process = require('child_process');
child_process.exec(req.body.command);
document.write(location.hash);
