var request = require('request'),
	express = require('express');

var laundryAlertURL = 'http://www.laundryalert.com/cgi-bin/penn6389/LMRoom?XallingPage=LMPage&Halls=';

var removeMarkup = function (source) {
	var start = source.indexOf("<table id=\"tablea\"");
	source = source.substring(start);
	var split = source.split('\n');
	var markupBeacon = /^\s*</;
	var nbspBeacon = /^\s*&nbsp;/;
	var onlyWhitespaceBeacon = /^\s*$/;
	var data = new Array();

	for(var i = 0; i < split.length; i++) {
		if (split[i].search(markupBeacon) == -1 && split[i].search(nbspBeacon) == -1 && split[i].search(onlyWhitespaceBeacon) == -1){
			if(split[i].charAt(0) === '>') {
				data.push(split[i].slice(50,split[i].length - 22).trim());
			} else {
				data.push(split[i].trim());
			}
		}
	}
	var firstUsefulLine = 4;
	var lastUsefulLine = data.length - 2;
	return data.slice(firstUsefulLine,lastUsefulLine);
}

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

		var sanitizedBody = removeMarkup(body);
		var numRows = sanitizedBody.length;
		for ( var i = 0; i < numRows; i += 4) {
		    var machineType = sanitizedBody[i + 1];
		    if (i+3 >= numRows || sanitizedBody[i + 3].search(/min|ago|unknown|status$/) == -1) {
		    	i--;
		    }
		    if (machineType.charAt(0) === 'F') {
				//Found a washer
				scrapedData.washers.push(sanitizedBody[i + 3]);
		    }else{
				//It's a dryer
				scrapedData.dryers.push(sanitizedBody[i + 3]);
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