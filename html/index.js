function start(){
	//taby

	//inne
	$('#content').style.height = (window.innerHeight-100)+'px';

	//mody
	drugs.init();
}

function scroll(node, settings){
	this.base = node;
	this.scroller = null;
	this.handle = null;
	this.moveInterval = null;
	this.scrollY = null;
	this.wheelStack = 0;
	this.init = function(){
		var scroller = this.base,
			newScroll = this;

		scroller.addEventListener('wheel',(function(e){
			this.wheel(e.deltaY*-1);
		}).bind(this));

		var list = scroller.addHTML('div',{class: 'list'});
		list.addHTML('div',{class: 'floater'}).addHTML('div').addHTML('div',{class: 'content', fn: function(self){
			newScroll.handle = self;
		}});

		scroller.addHTML('div',{class: 'scroll'}).addHTML('div',{class: 'scrollPos'}).addHTML('div',{class: 'scroller', fn: function(self){
			newScroll.scroller = self;
			self.addEventListener('mousedown',(function(e){
				e.currentTarget.classList.add('handle');
				document.onmouseup = this.endDrag.bind(this);
				document.onmousemove = this.moveDrag.bind(this);

				this.moveInterval = setInterval(this.move.bind(this),25);
				this.scrollY = e.clientY;
			}).bind(newScroll));
		}});
	};
	this.endDrag = function(e){
		this.scroller.classList.remove('handle');
		document.onmousemove = null;
		document.onmouseup = null;

		this.back();
		clearInterval(this.moveInterval);
		this.moveInterval = null;

		this.dir = 0;
		this.speed = 0;
	};
	this.moveDrag = function(e){
		var diff = e.clientY-this.scrollY,
			max = (this.scroller.parentNode.parentNode.scrollHeight-this.scroller.offsetHeight)/2;

		if(Math.abs(diff)>max)
			diff = (diff>0? max : -max);

		this.scroller.style.top = diff+'px';
		this.dir =(diff>0)? -1 : 1;
		this.speed = Math.abs(diff)/max;
	};
	this.back = function(){
		var top = this.scroller.offsetTop,
			diff = 10;

		if(Math.abs(top)<diff)
			top = diff;
		else
			setTimeout(this.back.bind(this),10);

		this.scroller.style.top = top + (top>0? -10 : 10 ) + 'px';
	};
	this.wheel = function(count){
		this.wheelStack++;
		this.speed = this.settings.scrollSpeed;
		this.dir =(count>0)? 1 : -1;

		if(!this.moveInterval)
			this.moveInterval = setInterval(this.wheelTim.bind(this),25);
	};
	this.wheelTim = function(){
		if(!this.wheelStack){
			clearInterval(this.moveInterval);
			this.moveInterval = null;
			this.speed = 0;
			this.dir = 0;
			return;
		}

		this.wheelStack--;
		this.move();
	};
	this.move = function(){
		var selfHeight = this.handle.offsetHeight,
			max = this.handle.parentNode.parentNode.offsetHeight-selfHeight,
			newStart = this.handle.parentNode.offsetTop+this.dir*Math.pow(this.speed*this.settings.scrollMulti,this.settings.scrollPow);	//multipler

		if(max>0)
			return;

		if(newStart<max)
			newStart = max;
		else if(newStart>0)
			newStart = 0;

		if(newStart<this.settings.nextLimit*max && this.dir==-1){
			this.next();
		}

		this.handle.parentNode.style.top = newStart+'px';
	};
	this.settings = {
		nextLimit: 0.75,		//od kiedy wczytuje sie dalsza czesc listy
		scrollMulti: 5,
		scrollPow: 3,
		scrollSpeed: 0.8
	}
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

		form['names'].addEventListener('change',function(){
			drugs.db.next = 0;
			drugs.search();
		});

		/*TODO
		* - ostatnie ustawienia wyszukiwania
		* - kolory wyszukiwan
		* */

		var cols = $('#d_cols');
		this.db.ile = Math.floor(cols.clientHeight/20*2);
		this.scroller = new scroll(cols, {});
		this.scroller.init();
		this.scroller.next = function(){
			if(drugs.db.next>0 && drugs.db.next%drugs.db.ile==0 && !drugs.db.load){
				drugs.search();
			}else if(!drugs.db.visible){
				drugs.db.visible = true;
				drugs.endOf();
			}
		}

		var base = this.scroller.base;
		//kategorie
		var cat  = $('#d_cats'),
			cols = base.$('*.content'),
			select = $('#d_select');

		this.db.cat.forEach(function(ele, i){
			cols.addHTML('div',{class: 'd_tab'+i});
			cat.addHTML('div',{html: ele, class: 'd_tab'+i});
			select.addHTML('option',{
				html: ele,
				fn: function(x){
					x.onclick = (function(){
						form['names'].selectedIndex
					}).bind({key: ele})
				}
			});
		});
		cat.addHTML('div',{class: 'd_tabEnd'});

		//data incoming
		this.xhr.on('done',function(data){
			var d_list = drugs.scroller.base.$$('*.content>div'),
				list = JSON.parse(data);

			drugs.db.order.forEach(function(ele, i){
				if(!drugs.db.next){
					d_list[i].innerHTML = null;
					if(!list.length)
						drugs.empty(true);
					else
						drugs.empty(false);
				}
				list.forEach(function(val, j){
					d_list[i].addHTML('div',{html: list[j][ele]});
				});
			});

			drugs.load(false);
			drugs.db.next +=(list.length)? list.length : 1;
		});
		this.xhr.on('error',function(data){
			console.log('Error: \n',data);
		});
	},
	xhr: new xhr(),
	db: {
		next: 0,
		ile: 0,
		prev: '',
		order: ['sub','name','val','form','opk','col','free','ean'],
		cat: ['Substancja','Nazwa','Wartość','Forma','Opakowanie','Kolumna','Odpłatność','EAN'],
		load: false,
		opacity: null,
		visible: null
	},
	search: function(){
		var form = document.forms['drugs'];
		if(form['search'].value=='' || (this.db.prev==form['search'].value && !this.db.next)){
			return;
		}

		this.load(true);
		this.db.prev = form['search'].value;
		this.xhr.form(form);
		this.xhr.data.append('limit', this.db.ile);
		this.xhr.data.append('skip', this.db.next);
		this.xhr.send();
	},
	load: function(on){
		$('#d_bCont *.d_b').style.display =(on)? 'block' : 'none';
		this.db.load = !!on;
	},
	endOf: function(){
		var alert = $$('#d_bCont *.d_b')[1];
		alert.style.display = 'block';
		alert.style.opacity = 1;

		setTimeout((function(){
			setTimeout(drugs.endOfTim.bind(this),20);
		}).bind(alert),1000);
	},
	endOfTim: function(){
		if(this.style.opacity>0.05){
			this.style.opacity = this.style.opacity-0.05;
			setTimeout(drugs.endOfTim.bind(this),20);
		}else{
			drugs.db.visible = false;
			this.style.display = "none";
		}
	},
	empty: function(on){
		$('#d_empty').style.display =(on)? 'block' : 'none';
	}
}
