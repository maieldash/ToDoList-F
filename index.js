
import express from "express";
import bodyParser from "body-parser";
import path,{ dirname } from "path";
import { fileURLToPath } from "url";
import * as fs from 'node:fs';
import rl from "readline-specific";
const __dirname = dirname(fileURLToPath(import.meta.url));
const HTML_DIR = path.join(__dirname, '/public/')
const app = express();
const port = 3000;
var customListsTitles = [];
var today;
var curListTitle = "";

function Task(title, deadline, description, priority, listId) {
    let task = {
        "title": title,
        "deadline": deadline,
        "description": description,
        "priority": priority,
        "listId": listId
    }
    return task;
}
function setCurDate(req,res,next) {
    today = new Date();
    next();
}

function updateListTitles() {
    if (fs.existsSync("customListsTitles.txt")) {
        console.log("reading from file of titles ");
        var data = fs.readFileSync("customListsTitles.txt").toString('UTF8');
        if (data.length === 0) return [];
        else {
            console.log(" data are read from custom titles :" + data);
            return data.split('\n'); 
        }       
    }
    console.log('rendering the page');
    return customListsTitles;
}
function createDefaultLists(req, res, next) {
    if (!fs.existsSync("customListsTitles.txt")) {
        fs.writeFileSync("customListsTitles.txt","");
    }
    if (!fs.existsSync("today.txt")) {
        fs.writeFileSync("today.txt","");
    }
    if (!fs.existsSync("upcoming.txt")) {
        fs.writeFileSync("upcoming.txt","");
    }
    if (!fs.existsSync("customLists.txt")) {
        fs.writeFileSync("customLists.txt","");
    }
    if (!fs.existsSync("completed.txt")) {
        fs.writeFileSync("completed.txt","");
    }
    next();
}

function createNewList(title) {
    if (customListsTitles.includes(title)) {
        console.log("list already exist " + title);
        return;
    }
    else {
        console.log("cuatom title " + customListsTitles.length);
        if (customListsTitles.length != 0) {
            fs.appendFileSync("customLists.txt", "\n");
            fs.appendFileSync("customListsTitles.txt", "\n" );
        }
        fs.appendFileSync("customLists.txt", title);
        fs.appendFileSync("customListsTitles.txt", title );
        customListsTitles.push(title);
    }
}

function createNewTask(title, deadline, description,priority, listId) {
    var date = new Date(deadline);
    var list = "";
    if (listId != "none") {   
        addTaskToFile("customLists.txt", title, deadline, description, priority, listId);
    }
    if (
        date.getFullYear() === today.getFullYear() &&
        date.getMonth() === today.getMonth() &&
        date.getDate() === today.getDate()
    ) {
        list = "today";
        addTaskToFile("today.txt", title, deadline, description, priority, listId);

    } else {
        list = "upcoming";
        addTaskToFile("upcoming.txt", title, deadline, description, priority, listId);

    } 
    return list;
}
function addTaskToFile(filePath, title, deadline, description, priority, listId) {
    var newTask = "|"
        + title + "@"
        + deadline + "@"
        + description + "@"
        + priority + "@"
        + listId + "@"
        + "incompleted";
    if (filePath === "today.txt" || filePath === "upcoming.txt") {
        fs.appendFileSync(filePath, newTask);
    }
    else {
        var listTitle = customListsTitles[listId];
        var data = fs.readFileSync("customLists.txt");
        console.log("data fro, custome is " + typeof data);
        data = String(data);
        let re = new RegExp(`^.*${listTitle}.*$`, 'gm');
        var oldLine = data.match(re); 
        let newData = data.replace(re, oldLine + newTask);
        console.log(newData);
        fs.writeFileSync("customLists.txt",newData);
        
    }
}
function showSelectedList(filePath,listId) {
    var result = [];
    var allTasks = [];
    if (filePath === "customLists.txt") {
        console.log("listId is " + listId);
        var ListData = fs
            .readFileSync(filePath)
            .toString('UTF8')
            .split('\n');
        console.log("list data is " + ListData);
        allTasks = ListData[listId].split('|');
    }
    else {
        allTasks = fs
            .readFileSync(filePath)
            .toString('UTF8')
            .split('|');
    }
    console.log("all Tasks returned are " + allTasks);
    if (allTasks) {
        for (var i = 1; i < allTasks.length; i++) {
            var taskInfo = allTasks[i].split("@");
            console.log("task Info : " + taskInfo);
            var newTask = new Task(taskInfo[0], taskInfo[1], taskInfo[2], taskInfo[3], taskInfo[4]);
            console.log("task  : " + newTask);
            result.push(newTask);
        }
    }
    return result;
}
// async function renderHomePage(selectedList,res){
//     await ;
//     // now wait for firstFunction to finish...
//     // do something else
//     console.log("rendering the page");
//     res.render("index.ejs", {
//         "customListsTitles" : customListsTitles,
//         "selectedList": selectedList,
//         "today":today
//     }); 
//   };
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(setCurDate);
app.use(createDefaultLists);
app.listen(port, () => {
    console.log("server is listening to port " + port);
});
var selectedList = [];

function renderHomePage(res) {
    customListsTitles = updateListTitles();
    res.render("index.ejs", {
        "customListsTitles": customListsTitles,
        "selectedList": selectedList,
        "today": today,
        "curListTitle":curListTitle
    })
}
  
app.get("/", (req, res) => {
    console.log("Show Default list of today ");
    res.redirect("/today");
});
app.get("/today", (req, res) => {
    console.log("show today list tasks ");
    selectedList = showSelectedList("today.txt", 0);
    console.log("custom lists are " + customListsTitles.length);
    console.log("selected tasks are   " + selectedList);
    curListTitle = "";
    renderHomePage(res);
});
app.get("/upcoming", (req, res) => {
    console.log("show upcoming list");
    selectedList = showSelectedList("upcoming.txt",0);
    curListTitle = "Upcoming";
    console.log("selected tasks are  " + selectedList);
    renderHomePage(res);
});
app.get("/list", (req, res) => {
    const listId = req.query.list;
    // rl.oneline('customLists.txt', listId + 1, function (err, data) {
    //     if (err) console.error(err)	//handling error
    //     console.log("one line from custom to parse is _____ " + data);	//print content
        
    //     console.log("selected tasks are    " + selectedList);
    // });
    console.log("list sent is " + listId);
    selectedList = showSelectedList("customLists.txt",listId);
    console.log("selected tasks are    ** " + selectedList);
    curListTitle = customListsTitles[listId];
    renderHomePage(res);
});
app.post("/addList", (req, res) => {
    console.log("new request to create list " + req.body["list-title"]);
    createNewList(req.body["list-title"]);
    res.redirect(`/list?list=${customListsTitles.length - 1}`);
});
app.post("/addTask", (req, res) => {
    console.log("new task created " + req.body["task-title"]);
    var list = createNewTask(req.body["task-title"], req.body["task-dateTime"], req.body["task-description"], req.body["task-priority"], req.body["task-list"]);
    if (req.body["task-list"] === "none") {
        res.redirect(`/${list}`);
    }
    else {
        res.redirect(`/list?list=${req.body['task-list']}`);
    }
    
});
// function updateHomePage(a) {
//     let i = 0
//     console.log(a.textContent + " is pressed");
//     console.log(a.href);
//     if (a.textContent ===  "Today") {
//         selectedList = todayList;
//     }
//     else if (a.textContent === "Upcoming") {
//         selectedList = upcomingList;
//     }
//     else {
//         selectedList = customLists[i];
//     }
//     app.render("index.ejs", {
//         "selectedList": selectedList,
//         "customListsTitles": customListsTitles,
//         "today": today
//     });
// }