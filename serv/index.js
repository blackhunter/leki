var extend = require('wszerad_extend'),
	http = require('http'),
	mongode = require('mongode'),
	hosp = mongode.connect('mongodb://@127.0.0.1/hosp'),
	drugs = hosp.collection('drugs');

extend.extend(http);
http.createServer( extend.listener ).listen(1337);

extend.paths('/init',function(){
	var res = this,
		data = [],
		toDB = [],
		tab = ['a','b','c','d','e','f'];

	function generator(string,ile){
		tab.forEach(function(ele){
			if(!ile)
				data.push(string+ele);
			else
				generator(string+ele,--ile);
		});
	}

	generator('a',5);
	data.forEach(function(ele, i){
		toDB.push({
			sub: ele, name: 'Ibuprom', form: 'tabl.', val: '300mg', opk: '40',col:'N', free: '30%', ean: i
		});
	});

	drugs.insert(toDB,{safe: true},function(err){
		if(err)
			console.log(err);
		res.end();
	});
});

extend.paths('/drugs',function(data, res){
	var res = this,
		rec = {},
		find = {};

	this.format('json');
	data.on('field',function(n, v){
			rec[n] = v;
	});

	data.on('end',function(){
		find[rec.name] = {$regex: '^'+rec.search};
		drugs.find(find, {limit: rec.limit, skip: rec.skip, sort: rec.name}).toArray(function(err, data){
			res.end(data);
		});
	});
});

extend.paths('/',function(){
	this.end('Hello!');
});