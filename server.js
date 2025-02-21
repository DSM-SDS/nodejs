const express = require('express');
const credential = require('./var.js');
const mysql = require('mysql');
const cors = require('cors')
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
const moment = require("moment");
const app = express();

app.use(cors({
    origin: '*',
}));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const connection = mysql.createConnection({
    host: credential.mysql_host,
    user: credential.mysql_user,
    password: credential.mysql_pw,
    database: credential.mysql_db,
    timezone: "+09:00"
});

// access token을 secret key 기반으로 생성
const generateAccessToken = (id) => {
    return jwt.sign({ id }, credential.secret_key, {
        expiresIn: "3 days",
    });
};

// refersh token을 secret key  기반으로 생성
const generateRefreshToken = (id) => {
    return jwt.sign({ id }, credential.secret_key, {
        expiresIn: "180 days",
    });
};

// access token의 유효성 검사
const authenticateAccessToken = (req, res, next) => {
    let authHeader = req.headers["authorization"];
    let token = authHeader && authHeader.split(" ")[1];

    if (!token) {
        console.log("wrong token format or token is not sended");
        return res.sendStatus(400);
    }

    jwt.verify(token, credential.secret_key, (error, user) => {
        if (error) {
            console.log(error);
            return res.sendStatus(403);
        }

        req.user = user;
        next();
    });
};

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
            let accessToken = generateAccessToken(results[0].username);
            let refreshToken = generateRefreshToken(results[0].username);
            res.json({ accessToken, refreshToken });
        }
        else {
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
        if (results == "") {
            connection.query(`INSERT INTO user_list (username, password, name, hosu, apt_name, role) VALUES (?,?,?,?,?,?)`, [username, password, name, hosu, apt_name, role], (error, results) => {
                if (error) {
                    console.log('INSERT error');
                    console.log(error);
                    return res.status(500).send('안되지롱')
                }
                return res.status(200).send('회원가입 성공')
            });
        }
        else {
            return res.status(500).send('중복된 아이디입니다')
        }
    });
});

app.post('/report', authenticateAccessToken, (req, res) => {
    let username = req.user.id;
    let title = req.body.title;
    let detail = req.body.detail;
    let time = req.body.time;
    let date = req.body.date;
    console.log(username + " " + title + " " + detail + " " + time + "" + date);
    connection.query(`select apt_name, hosu, name from user_list where username = ?`, [username], (error, results) => {
        if (error) {
            console.log('select username');
            console.log(error);
            return;
        }
        console.log(results);
        connection.query(`INSERT INTO report (username, name, apt_name, hosu, title, detail, time, date, is_accepted) VALUES (?,?,?,?,?,?,?,?,?)`, [username, results[0].name, results[0].apt_name, results[0].hosu, title, detail, time, date, "NO"], (error, results) => {
            if (error) {
                console.log('INSERT error');
                console.log(error);
                return res.status(500).send('안되지롱')
            }
            return res.status(200).send('신고 접수')
        });
    });
});

app.post('/report_list', authenticateAccessToken, (req, res) => {
    let username = req.user.id;
    console.log(username);
    connection.query(`select role, apt_name from user_list where username = ?`, [username], (error, results) => {
        if (error) {
            console.log('select username');
            console.log(error);
            return;
        }
        if (results[0].role == "Admin") {
            connection.query(`select report_id, title, name, hosu, is_accepted from report where apt_name = ?`, [results[0].apt_name], (error, results) => {
                if (error) {
                    console.log('select error');
                    console.log(error);
                    return res.status(500).send('안되지롱')
                }
                return res.json(results);
            });
        }
        else
        {
            return res.status(500).send('봐서 뭐하게')
        }
    });
});

app.post('/report_view', authenticateAccessToken, (req, res) => {
    let username = req.user.id;
    let report_id = req.body.report_id;
    console.log(username);
    connection.query(`select role, apt_name, hosu from user_list where username = ?`, [username], (error, results) => {
        if (error) {
            console.log('select username');
            console.log(error);
            return;
        }
        if (results[0].role == "Admin") {
            connection.query(`select report_id, title, name, date, time, detail from report where apt_name = ? and report_id = ?`, [results[0].apt_name, report_id], (error, report_results) => {
                if (error) {
                    console.log('select error');
                    console.log(error);
                    return res.status(500).send('안되지롱')
                }
                connection.query(`select * from sensor_data where hosu = ?`, [results[0].hosu], (error, sensor_results) => {
                    if (error) {
                        console.log('select error');
                        console.log(error);
                        return res.status(500).send('안되지롱')
                    }
                    report_results[0].sensor_data = sensor_results;
                    return res.json(report_results[0]);
                });
            });
        }
        else
        {
            return res.status(500).send('봐서 뭐하게')
        }
    });
});

app.post('/accept_report', authenticateAccessToken, (req, res) => {
    let username = req.user.id;
    let report_id = req.body.report_id;
    let is_accepted = req.body.is_accepted;
    console.log(username);
    connection.query(`select role, apt_name from user_list where username = ?`, [username], (error, results) => {
        if (error) {
            console.log('select username');
            console.log(error);
            return;
        }
        if (results[0].role == "Admin") {
            connection.query(`UPDATE report SET is_accepted = ? where apt_name = ? and report_id = ?`, [is_accepted, results[0].apt_name, report_id], (error, results) => {
                if (error) {
                    console.log('select error');
                    console.log(error);
                    return res.status(500).send('안되지롱')
                }
                return res.status(200).send('성공')
            });
        }
        else
        {
            return res.status(500).send('해서 뭐하게')
        }
    });
});

app.get('/put_data', (req, res) => {
    let hosu = req.query.hosu;
    let direction = req.query.direction;
    let avg = req.query.avg;
    console.log(hosu + "" + direction + "" + avg);
    connection.query(`INSERT INTO sensor_data (time, hosu, direction, avg) VALUES (?,?,?,?)`, [moment().format(), hosu, direction, avg], (error, results) => {
        if (error) {
            console.log('INSERT error');
            console.log(error);
            return res.status(500).send('안되지롱')
        }
        return res.status(200).send('Success')
    });
});

app.get('/get_data', (req, res) => {
    let hosu = req.query.hosu;
    console.log(hosu);
    connection.query(`select * from sensor_data where hosu = ?`, [hosu], (error, results) => {
        if (error) {
            console.log('INSERT error');
            console.log(error);
            return res.status(500).send('안되지롱')
        }
        return res.json(results);
    });
});

const port = 80;
app.listen(port, () => {
    console.log(`express server running on port ${port}`);
});