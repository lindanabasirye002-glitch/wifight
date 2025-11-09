<?php
class Database {
    private $host = "localhost";
    private $db_name = "wifight_db";
    private $username = "root"; // change to your DB username, e.g. 'wifightuser'
    private $password = "";     // set DB password
    public $conn;

    public function getConnection() {
        $this->conn = null;
        try {
            $this->conn = new PDO(
                "mysql:host=" . $this->host . ";dbname=" . $this->db_name,
                $this->username,
                $this->password,
                [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8"
                ]
            );
        } catch(PDOException $exception) {
            @file_put_contents(__DIR__ . '/../../storage/logs/db_errors.log', date('c') . ' DB Connection error: ' . $exception->getMessage() . "\n", FILE_APPEND);
            return null;
        }
        return $this->conn;
    }
}