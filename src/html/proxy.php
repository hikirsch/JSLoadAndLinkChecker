<?php
$request_uri = $_REQUEST['request'];
$request_uri = rawurldecode($request_uri);

$callback = null;
if (isset($_GET["__callback"])) {
	$callback = $_GET["__callback"];
}

#set http header vars
header("Cache-Control: no-cache, must-revalidate"); // HTTP/1.1
header("Expires: Mon, 26 Jul 1997 05:00:00 GMT"); // Date in the past

// create a new curl resource
$ch = curl_init();

// set URL and other appropriate options
curl_setopt($ch, CURLOPT_URL, $request_uri);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_HEADER, false);
curl_setopt($ch, CURLOPT_NOBODY, false);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, false);

if ($callback) {
  print($callback . "(");
}
curl_exec($ch);
if ($callback) {
  print(")");
}
// close curl resource, and free up system resources
curl_close($ch);
?>