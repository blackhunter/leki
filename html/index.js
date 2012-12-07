function start(){
	//taby

	//inne
	$('#content').style.height = (window.innerHeight-100)+'px';

	//mody
	drugs.init();
}


var drugs = {
	init: function(){
		var form = document.forms['drugs'];

		form['search'].addEventListener('focus',function(){
			drugs.db.next = 0;
			this.value = null;
		});

		form['search'].addEventListener('keyup',function(){
			drugs.db.next = 0;
			drugs.search();
		});

		form['name'].addEventListener('change',function(){
			drugs.db.next = 0;
			drugs.search();
		});

		/*TODO
		* - ostatnie ustawienia wyszukiwania
		* - kolory wyszukiwan
		* */

		//scroll
		this.scroll.data.table = $('#drugs_list');
		this.scroll.data.handle = $('#d_scroller');
		this.scroll.data.handle.addEventListener('mousedown',function(e){
			document.onmouseup = function(){
				document.onmousemove = null;
				document.onmouseup = null;

				drugs.scroll.back();


				drugs.scroll.data.tableScroll = null;
				drugs.scroll.data.dir = 0;
				drugs.scroll.data.speed = 0;
			};

			document.onmousemove = function(e){
				var diff = e.clientY-drugs.scroll.data.y,
					max = (drugs.scroll.data.handle.parentNode.parentNode.scrollHeight-drugs.scroll.data.handle.offsetHeight*2)/2;

				if(Math.abs(diff)<max){
					drugs.scroll.data.handle.style.top = diff+'px';
				}else{
					drugs.scroll.data.handle.style.top =(diff>0? max : -max)+'px';
				}

				drugs.scroll.data.dir =(diff>0)? -1 : 1;
				drugs.scroll.data.speed = max/Math.abs(diff);

				drugs.scroll.dir();
			};

			drugs.scroll.data.y = e.clientY;
			//scrolling interval
		});

		//kategorie
		var cat  = $('#drugs_cat');
		this.db.cat.forEach(function(ele, i){
			cat.addHTML('th',{html: ele, class: 'drugs_tab'+i});
			form['name'].addHTML('option',{
				html: ele,
				fn: function(x){
					this.value = drugs.db.order[i];
				}
			});
		});

		//data incoming
		this.xhr.on('done',function(data){
			var drugs_list = $('#drugs_list'),
				list = JSON.parse(data),
				tr;

			console.log('back');
			drugs.db.load = false;

			if(!drugs.db.next){
				var string = '<tr>';
				drugs.db.cat.forEach(function(ele, i){
					string += '<td class="drugs_tab'+i+'"></td>';
				});
				string += '</tr>';
				drugs_list.innerHTML = string;
			}

			drugs.db.next +=(list.length)? list.length : 1;

			list.forEach(function(ele){
				tr = addHTML('tr');
				drugs.db.order.forEach(function(i){
					tr.addHTML('td',{html: ele[i]});
				});
				drugs_list.appendChild(tr);
			});
		});
		this.xhr.on('error',function(data){
			console.log('Error: \n',data);
		});
	},
	xhr: new xhr(),
	db: {
		next: 1,
		ile: 10,
		prev: '',
		order: ['sub','name','val','form','opk','col','free','ean'],
		cat: ['Substancja','Nazwa','Wartość','Forma','Opakowanie','Kolumna','Odpłatność','EAN'],
		load: false
	},
	search: function(){
		var form = document.forms['drugs'];
		if(form['search'].value=='' || this.db.prev==form['search'].value)
			return;

		drugs.db.load = true;

		this.db.prev = form['search'].value;
		this.xhr.form(form);
		this.xhr.data.append('limit', this.db.ile);
		this.xhr.data.append('skip', this.db.next);
		this.xhr.send();
	},
	scroll: {
		back: function(){
			var top = drugs.scroll.data.handle.offsetTop,
				diff = 10;

			if(Math.abs(top)<diff)
				top = 10;
			else
				setTimeout(drugs.scroll.back,10);

			drugs.scroll.data.handle.style.top = top + (top>0? -10 : 10 ) + 'px';
		},
		data: {
			y: 0,
			handle: null,
			table: null,
			speed: 0,
			dir: 0
		},
		dir: function(){
			if(drugs.scroll.data.speed){
				setTimeout(drugs.scroll.dir,100);
			}else{
				drugs.scroll.data.tableScroll = null;
			}


			if(drugs.db.next%drugs.db.ile!=0)
				return;

			var start = drugs.scroll.data.table.offsetTop,
				newStart = start+drugs.scroll.data.dir*drugs.scroll.data.speed*0.5;	//multipler

			console.log(newStart,drugs.scroll.data.table.scrollHeight-drugs.scroll.data.table.offsetHeight*1.5);

			if(newStart>drugs.scroll.data.table.scrollHeight-drugs.scroll.data.table.offsetHeight*1.5)
				drugs.scroll.next();

			if((newStart + drugs.scroll.data.table.offsetHeight)>=drugs.scroll.data.table.scrollHeight)
				newStart = drugs.scroll.data.table.scrollHeight - drugs.scroll.data.table.offsetHeight;

			drugs.scroll.data.table.style.top = newStart+'px';


		},
		next: function(){
			if(!drugs.db.load && drugs.db.next%drugs.db.ile==0){
				console.log('next');
				//drugs.search();
				//drugs.scroll.bubble(true);
			}
		},
		bubble: function(on){
			//$('#d_b').className =(on)? 'drugs_bv' : 'drugs_bi';
		}
	}
}
