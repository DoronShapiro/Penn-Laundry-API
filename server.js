var request = require('request'),
	cheerio = require('cheerio'),
	express = require('express');

var laundryAlertURL = 'http://www.laundryalert.com/cgi-bin/penn6389/LMRoom?XallingPage=LMPage&Halls=';

var scrape = function (roomID, callback) {
	var url =  laundryAlertURL + roomID;
	request(url, function (error, response, body) {
	    if (error || response.statusCode != 200) {
	    	console.log('error: ' + error);
	    	return null;
	    }

		var scrapedData = {
		    washers : [],
		    dryers : []
		};
		

		var $ = cheerio.load(body);
		var $table = $('form[name="form1"]').children('table').last();
		//var $table = $('form[name="form1"]');
		var $rows = $table.children();

		//var $rows = $('form[name="form1"] tr');

		console.log($table.html());

		var numRows = $rows.length - 2;
		console.log(numRows);
		for ( var i = 1; i < numRows; i++) {
		    var $row = $rows.eq(i);
		    var machineType = $row.children().eq(3).text().trim();
		    if(machineType.charAt(0) === 'F'){
				//Found a washer
				scrapedData.washers.push($row.children().eq(5).text().trim());
		    }else{
				//It's a dryer
				scrapedData.dryers.push($row.children().eq(5).text().trim());
		    }

		}
		
		console.log(scrapedData);
		callback(scrapedData);
	});
}

var app = express();

app.get('/building/:id', function(req, res){
  	var id = req.params.id;
  	scrape(id, function (scrapedData) {
   		res.send(scrapedData);
  	});
});

app.listen(3000);
console.log('Listening on port 3000');