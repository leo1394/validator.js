<?php 
	$time = $_GET["time"];
	$second = $time / 1000;
	$microSecond = $time % 1000;
	$start = time() + microtime();

	$now = time() + microtime();

	while($now - $start < $time / 1000){
		$now = time() + microtime();
	}

	echo "{result:done}";

?>