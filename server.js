var express = require('express');
var fs 		= require('fs');
// var request = require('request');
var requestify = require('requestify'); 
var cheerio = require('cheerio');
var q		= require('q');
var app		= express();

function r(url, callback) {
	requestify.get(url).then(function(response) {
		callback(cheerio.load(response.getBody()));
	});
}

app.get('/scrape', function(req, res){
	var processedUrl = {};
	var base_url = "http://www.endontorcuato.com.ar/";
	url = base_url + 'categorias.php';

	// fs.writeFile('output.json', '[', function(err){});

	r(url, function($, response){
		var categories = {};
		var stores = [];
		var n = 1;
		var promises = [];
		$('#contentCategorias a[href^="results.php?idcat="]').each(function(i) {
			var url = base_url + $(this).attr('href');
			while (n) {
				n--;
				r(url, function($){
					$('#resultsComercios ul.box li:not([class])').each(function() {
						var deferred = Q.defer();
						var li = $(this);
						var storeUrl = base_url + li.find('h3 a').attr('href').trim();

						if (!processedUrl[storeUrl]) {
							processedUrl[storeUrl] = true;
							r(storeUrl, function($){
								var categoryName = $("a.cat").text().trim();
								if (!categories[categoryName]) {
									var category = {
										name: categoryName,
										url: base_url + $("a.cat").attr("href").trim(),
										subcategories: []
									};
									categories[categoryName] = category;
								}

								var subcategoryName = $("a.subcat").text().trim();
								if (!categories[categoryName].subcategories[subcategoryName]) {
									var subcategory = {
										name: subcategoryName,
										url: base_url + $("a.subcat").attr("href").trim()
									};
									categories[categoryName].subcategories[subcategoryName] = subcategory;
								}

								var store = {
									category: categories[categoryName].subcategories[subcategoryName],
									url: storeUrl,
									name: $('.details').text().trim(),
									description: $(".descDet").text().trim(),
									image: base_url + $('.logo img').attr("src").trim(),
									address: $('.direccion strong').text().trim(),
									phone: $('.tel strong').text().trim(),
									opening: $('.horario strong').text().trim(),
									web: $('.web strong').text().trim(),
									payments: $('.pago strong').text().trim(),
									delivery: !!$('.delivery strong').text().trim().toLowerCase("si"),
									installments: !!$('.cuota strong').text().trim().toLowerCase("si"),
								};

								// console.log(store);
								stores.push(store);
								// fs.appendFile('output.json', JSON.stringify(store, null, 4), function (err) {
								// });
								deferred.resolve();
							});
						}
						promises.push(deferred);
					});
				});
			}
		});
	})
});

function finish() {
	fs.writeFile('output.json', JSON.stringify(stores, null, 4), function(err){
		console.log('File successfully written! - Check your project directory for the output.json file');
	});

	res.send("Listo.");
}

app.listen('8081');
console.log('Magic happens on port 8081');
exports = module.exports = app;