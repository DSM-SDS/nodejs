const express = require('express');
const credential = require('./var.js');
const mysql = require('mysql');
const cors = require('cors')
const bodyParser = require("body-parser");
const app = express();

const connection = mysql.createConnection({
    host: credential.mysql_host,
    user: credential.mysql_user,
    password: credential.mysql_pw,
    database: credential.mysql_db,
    timezone: "+09:00"
});

app.get('/', (req, res) => {
    return res.send("uhahaha");
});

app.get('/login', (req, res) => {
    connection.query(`select * from user_list`, (error, results) => {
        if (error) {
            console.log('select * from user_list');
            console.log(error);
            return;
        }
        return res.send(results);
    });
});

app.post('/signin', (req, res) => {
    let username = req.body.username;
    let password = req.body.password;
    let name = req.body.name;
    let hosu = req.body.hosu;
    let apt_name = req.body.apt_name;
    let role = req.body.role;
    console.log(username + " " + password + " " + name + " " + hosu + " " + apt_name + " " + role);
    connection.query(`INSERT INTO user_list (username, password, name, hosu, apt_name, role) VALUES (?,?,?,?,?,?)`, [username, password, name, hosu, apt_name, role], (error, results) => {
        if (error) {
            console.log('INSERT error');
            console.log(error);
            return;
        }
        return res.send(results);
    });
});

const port = 80;
app.listen(port, () => {
    console.log(`express server running on port ${port}`);
});