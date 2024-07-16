const express = require('express');
const credential = require('./var.js');
const mysql = require('mysql');
const cors = require('cors')
const bodyParser = require("body-parser");
const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

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

// app.get('/login', (req, res) => {
//     connection.query(`select * from user_list`, (error, results) => {
//         if (error) {
//             console.log('select * from user_list');
//             console.log(error);
//             return;
//         }
//         return res.send(results);
//     });
// });

app.post('/login', (req, res) => {
    let username = req.body.username;
    let password = req.body.password;
    console.log(username + " " + password);
    connection.query(`select username from user_list where username = ? and password = ?`, [username, password], (error, results) => {
        if (error) {
            console.log('select username');
            console.log(error);
            return;
        }
        console.log(results[0])
        if (results != "") {
            return res.status(200).send('로그인 성공')
        }
        else
        {
            return res.status(500).send('안되지롱')
        }
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
    connection.query(`select username from user_list where username = ?`, [username], (error, results) => {
        if (error) {
            console.log('select username');
            console.log(error);
            return;
        }
        console.log(results[0])
        if (results[0].username != username) {
            connection.query(`INSERT INTO user_list (username, password, name, hosu, apt_name, role) VALUES (?,?,?,?,?,?)`, [username, password, name, hosu, apt_name, role], (error, results) => {
                if (error) {
                    console.log('INSERT error');
                    console.log(error);
                    return res.status(500).send('안되지롱')
                }
                return res.status(200).send('회원가입 성공')
            });
        }
        else
        {
            return res.status(500).send('중복된 아이디입니다')
        }
    });
});

const port = 80;
app.listen(port, () => {
    console.log(`express server running on port ${port}`);
});