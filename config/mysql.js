var mysql = require('mysql');
var util = require('util');
var pool = mysql.createPool({
    multipleStatements: true,
    connectionLimit : 1000,
    host : 'localhost',
    port : 3306,
    user: 'root',
    password : 'DHRCdodowa1',
    database : 'P06',
});
/*
var pool = mysql.createPool({
    multipleStatements: true,
    connectionLimit : 1000,
    host : process.env.MYSQL_HOST,
    port : process.env.MYSQL_PORT,
    user: process.env.MYSQL_USER,
    password : process.env.MYSQL_PASS,
    database : process.env.MYSQL_DB,
});
*/
pool.getConnection((err,conn) => {
    if (err) {
        if (err.code === 'PROTOCOL_CONNECTION_LOST') {
            console.error('Database connection was closed.')
        }
        if (err.code === 'ER_CON_COUNT_ERROR') {
            console.error('Database has too many connections.')
        } 
        if (err.code === 'ECONNREFUSED') {
            console.error('Database connection was refused.')
        }
    }
    if (conn) conn.release()
    return                  
});  

pool.query = util.promisify(pool.query);
module.exports = pool
