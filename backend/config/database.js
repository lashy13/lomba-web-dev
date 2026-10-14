/* global require, process, module */

const mysql = require("mysql2/promise");

const isProduction = process.env.NODE_ENV === "production";
const useSSL = process.env.DB_SSL === "true";

const db = mysql.createPool({
  host: process.env.DB_HOST || "127.0.0.1",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD ?? "",
  database: process.env.DB_NAME || "laporkita",

  ssl: useSSL
    ? {
        minVersion: "TLSv1.2",
        rejectUnauthorized: true,
      }
    : undefined,

  waitForConnections: true,
  connectionLimit: isProduction ? 5 : 10,
  queueLimit: 0,
  connectTimeout: 10000,
});

module.exports = db;