<?php try { $pdo = new PDO('mysql:host=127.0.0.1;dbname=wifight_db', 'wifight', 'Matovunc01'); echo 'DB OK'; } catch (Exception $e) { echo $e->getMessage(); }
?>