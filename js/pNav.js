/**
 * pyrineNav
 * code by: pyrineLaw
 * email: pyrine.law@gmail.com
 * last update: 2012/08/11
 * https: github.com/pyrinelaw/pNav 
 */

(function ($) {

var win = window,
	doc = window.document;

var events = {

	ITEM_ADD: 'itemAdd',
	ITEM_CLICK: 'itemClick',

	ITEM_LABEL_CHANGE: 'itemlabelChange',
	ITEM_UPDATE: 'itemUpdate',

	HOVER_IN: 'hoverIn',
	HOVER_OUT: 'hoverOut',
	HOVER_PRE_IN: 'hoverPreIn',
	HOVER_PRE_OUT: 'hoverPreOut',
	
	CHANGE: 'change',
	CLICK: 'click',
	UPDATE: 'update',
	ENABLE_CHANGE: 'enableChange',
	DEPTH_CHANGE: 'depthChange',

	/* 外部使用相关 */
	NAVI_CHANGE: 'naviChange'
};

var Model = Backbone.Model.extend({});

var View = Backbone.View.extend({
	enable: function (enabled, options) {
		if (_.isBoolean(enabled)) {
			this.model.set({
				enable: enabled
			});
			if (!options || options.silent != true) {
				this.trigger(events.ENABLE_CHANGE, this.model.get('enable'));
			}
		}
		return this.model.get('enable');
	},
	disable: function () {
		var enable = this.enable();
		if (_.isBoolean(enable)) {
			return !enable;
		}
		return true;
	},
	// TODO 未支持移除多个class
	addClass: function (clsName) {		
		this.$el.addClass(clsName);
	},
	hasClass: function (clsName){
		return this.$el.hasClass(clsName);
	},
	hide: function () {
		this.$el.hide();
	},

	// TODO 未支持移除多个class
	removeClass: function (clsName){
		this.$el.removeClass(clsName);
	},
	show: function () {
		this.$el.show();
	},
	toggleVisible: function() {
		this.visible(!this.visible());
	},

	visible: function (v) {
		var $el = this.$el,
			visible = $el && $el.is(':visible');
		if(_.isBoolean(v) && visible != v) {
			v ? this.show() : this.hide();
			visible = v;
		}
		return visible;
	}

});

var ItemModel = Model.extend({});

var Item = View.extend({
	tagName: 'li',
	className: 'pNav_item',
	defaults: {
		enable: true
	},

	initialize: function () {
		this.model = new ItemModel($.extend({}, this.defaults, this.options));
		this.model.set({
			key: Math.random().toString(36).substring(2)
		});
		
		this.initEventHandle();
		this.render();
	},

	initEventHandle: function () {
		this.on(events.CHANGE, this.render);
		this.on(events.ITEM_LABEL_CHANGE, this.render);
	},

	render: function () {
		var $el = this.$el.empty(),
			content = null,
			label = this.label() || '未知label',
			modelCb = this.model.get('cb');

		//sample html:  <span class="pNav_subject">software information</span>
		if (this.isOmitItem()) {
			content = this.make("span", {"class": "pNav_subject"}, ' ... ');
		} else {
			content = this.make("span", {"class": "pNav_subject"}, label);
		}

		if(modelCb){
			this.addClass('pnav_item_pointor')
		};

		$el.append(content);
	},

	/* Attributes operation part */
	index: function (index) {
		if (_.isNumber(index)) {
			this.model.set({
				index: index
			});
		}
		return this.model.get('index');		
	},

	key: function () {
		return this.model.get('key');
	},

	label: function (label, silent) {
		if (!_.isUndefined(label)) {
			this.model.set({
				label: label
			});
			if (!silent) {
				this.trigger(events.ITEM_LABEL_CHANGE, label);
			}
		}
		return	this.model.get('label');
	},

	value: function (value) {
		if (!_.isUndefined(value)) {
			this.model.set({
				value: value
			});
		}
		return this.model.get('value');
	},	

	/*  css style operation part */
	hover: function (hoverIn, hoverOut){
		var _this = this;
		this.$el.hover(function () {
			hoverIn.call(_this, _this.index());
		}, function () {
			hoverOut.call(_this, _this.index());
		});
	},
	hoverIn: function () {
		if (this.enable())
		this.addClass('pNav_hover');
	},
	hoverOut: function () {
		this.removeClass('pNav_hover');
	},

	hoverPreIn: function () {
		this.addClass('pNav_hover_prev');
	},
	hoverPreOut: function () {
		this.removeClass('pNav_hover_prev');
	},

	firstItem: function () {
		this.addClass('pNav_first');
	},
	lastItem: function () {
		this.addClass('pNav_last');
	},
	normalItem: function (silent) {
		this.removeClass('pNav_first');
		this.removeClass('pNav_last');
		this.removeClass('pNav_omit');
		this.removeClass('pNav_hover_prev');
		this.trigger(events.CHANGE, '');
	},

	omitItem: function () {
		this.$el.addClass('pNav_omit');
		this.trigger(events.CHANGE, this);
	},
	isOmitItem: function () {
		return this.$el.hasClass('pNav_omit');
	},

	click: function (cb) {
		var _this = this,
			model = _this.model,
			label = model.get('label'),
			modelCb = model.get("cb");
		this.$el.click(function () {
			if (!_this.enable()) {
				return;
			}
			if (!_this.isOmitItem()) {
				cb.call(_this, _this.index());
			}
			if (modelCb){
				modelCb.call(_this,label);
			}
		});
	},
	destroy: function () {
		this.remove();
		this.model.destroy();
	}

});

var pNavModel = Model.extend({
	defaults: {
		enable: false
	}
});
var pNav = View.extend({
	tagName: 'div',
	className: 'pNav',

	defaults: {
		$ul: $('<ul>').attr('class', 'pNav_list'),
		callbacks: {},
		maxLevelCount: 4		
	},
	
	initialize: function () {
		this.model = new pNavModel($.extend({}, this.defaults, this.options));
		this.initEventHandle();
		this.initItemData();
		this.render();
	},

	initEventHandle: function () {
		this.on(events.ITEM_ADD, this.render);
		this.on(events.DEPTH_CHANGE, this.render);
		this.on(events.DEPTH_CHANGE, this.depthChange);
		this.on(events.UPDATE, this.render);
		this.on(events.CHANGE, this.render);
		this.on(events.ENABLE_CHANGE, this.enableChange);
	},

	initItemData: function (){
		var itemValues = this.model.get('items') || [];
		var items = [];
		this.model.set({items: []});

		//$('.pNav_item').remove();

		for (var i = 0, len = _.size(itemValues); i < len; i++){
			this.add(itemValues[i], i, true);	
		}

	},

	render: function () {
		var _this = this,
			depth = this.depth(),
			items = this.items() || [],
			maxLevelCount = this.max(),
			isNeedOmitItem = depth > maxLevelCount;

		var $el = this.$el.empty();
		var $ul = this.model.get('$ul');
	
		$el.append($ul);

		if (depth > _.size(items)) {
			depth = _.size(items);
		}

		for (var i = 0, len = _.size(items); i < len; i++) {
			var item = items[i];
			var itemIndex = item.index();
			if (itemIndex >= depth) {
				item.hide();
			} else if (isNeedOmitItem && !_.include([0, 1, depth - 2, depth - 1], itemIndex)) {
				item.hide();
			} else {
				item.show();
			}
		}

		for (var i = 0, len = depth; i < len; i++) {
			var isNeedDisplay = true;
			var item = items[i];

			if (_this.depth() != 1) {
				switch (item.index()) {
				case 0:
					item.normalItem(true);
					item.firstItem();
					break;
				case (depth - 1):
					item.normalItem(true);
					item.lastItem();
					break;
				default:
					item.normalItem();
				}

			} else {
				item.normalItem(true);
				item.lastItem();
			}

			if (i == 1 && isNeedOmitItem) {
				item.normalItem(true);
				item.omitItem();
			} else {

				item.hover(

				function (index) {
					if (_this.disable()) {
						return;
					}
					if (items[index]) {
						items[index].hoverIn();
					}
					var fistIndex = 0,
						lastIndex = _this.depth() - 1;

					if (index != fistIndex && index != lastIndex) {
						index--;
						var itemPre = items[index];
						if (itemPre) {
							itemPre.hoverPreIn();
						}
					}
				}, function (index) {
					if (_this.disable()) {
						return;
					}
					if (items[index]) {
						items[index].hoverOut();
					}
					var fistIndex = 0,
						lastIndex = _this.depth() - 1;
					if (index != fistIndex && index != lastIndex) {
						index--;
						var itemPre = items[index];
						if (itemPre) {
							itemPre.hoverPreOut();
						}
					}
				});

			}
			
			item.click(function (index) {
				if(_this.disable()){
					return void(0);
				}

				// if (_this.enable())
				_this.depth(index + 1);
			});
			
			if (isNeedDisplay) {
				$ul.append(item.$el);
			}
		}

		this.model.set({
			items: items
		});

	},

	add: function (itemValue, options) {
		if (_.isNull(itemValue)) {
			return;
		}
		var _this = this;
		var items = this.items() || [];

		var item = new Item(itemValue);
		var	index = _.size(items);

		item.index(index);

		item.value(itemValue);

		if (itemValue.beforeChange) {
			this.beforeChange(itemValue.beforeChange);
		}

		this.depthForward({
			silent: true
		});

		items.push(item);

		this.items(items, {silent: true});

		if(!(options && options.silent == true)){
			this.trigger(events.ITEM_ADD, item);
		}
	},

	/*
	// 返回上一级
	.backward()
	要出发change事件
	*/
	back: function () {
		this.backward();
	}, 

	backward: function () {
		var depth = this.depth();
		var size = this.size();
		if (depth <= 1) {
			return void (0);
		}
		depth--;
		this.depth(depth);
	},

	beforeChange: function(cb) {
		var _this = this,
			cbs = this.model.get('beforeChanges') || [],
			r, result = true;
		if(cb) {
			cbs.push(cb);
			this.model.set({beforeChanges: cbs});
		} else {
			_.each(cbs, function(cb) {
				r = cb.apply(_this);
				if(r === false) {
					result = false;
				}
			});
			return result;
		}
	},

	/*
	// 导航改变
	.change( fn )
	fn为回调方法
	fn.apply( this, option )
	*/
	change: function (cb) {
		if (!_.isFunction(cb)) {
			return;
		}
		this.enable(true);
		this.on(events.NAVI_CHANGE, cb);
	},	

	/*
	// 目前导航深度/级数
	.depth()
	返回数值
	*/
	depth: function (depth, silent) {	

		if (_.isNumber(depth)) {
			var lastDepth = this.model.get('depth');
			var lastButOneDepth = this.lastDepth();
			this.lastDepth(lastDepth);
			this.model.set({
				depth: depth
			});
			if (!silent) {
				var items = this.items();
				var itemValue = items && _.size(items) >= depth ? items[depth-1].value() : null;
			
				if (itemValue && itemValue.beforeChange) {
					var r = this.beforeChange();
					if (r)	return void (0);
				}

				this.trigger(events.DEPTH_CHANGE, depth);
			}
		}

		return this.model.get('depth') || 0;
	},
	
	depthChange: function (depth) {
		var items = this.items();
		var lastDepth = this.lastDepth();
		if (depth == lastDepth) {
			return void(0);
		}
		var item = items[depth - 1];
		var itemValue = item ? item.value() : null;
		if (itemValue) {
			this.trigger(events.NAVI_CHANGE, itemValue);					
		}
	},

	depthForward: function (options) {
		var depth = this.depth();
		depth++;
		if(options && options.silent == true){
			this.depth(depth, true);
		}
		this.depth(depth);
	},

	/**                                                
	 * 销毁
	 */
	destroy: function() {
		this.reset();
		this.$el.remove();
	},

	enableChange: function (enable) {
		var items = this.items(),
			len = _.size(items);

		while (len--) {
			var item = items[len];
			item.enable(enable, {silent: false});
		}
	},

	enableItem: function (index, enable) {
		if (!_.isBoolean(enable)) {
			this.enableChange(enable);
		} else {
			var item = this.item(index);
			if (item) {
				item.enable(enable);
			}
		}
	},

	forward: function () {
		var depth = this.depth();
		var size = this.size();
		if (depth >= size) {
			return void(0);
		}
		depth++;
		this.depth(depth);
	},


	/*
	// 检测是否存在对应的导航
	.has( arg )
	-参数为字符串
	-参数为对象
	     均返回是否有对应的导航
	*/
	has: function (arg) {
		if (_.isNull(arg) || _.isUndefined(arg)) {
			return false;
		} 

		var compareLabel = null;
		if (_.isString(arg)) {
			compareLabel = arg;
		} else if ($.isPlainObject(arg)) {
			compareLabel = arg.label;
		}

		var items = this.items(),
			len = _.size(items);
		while (len--) {
			var item = items[len];
			var value = item.value();
			if (compareLabel == value.name) return true;
		}

		return false;
	},

	item: function (index) {
		if (!_.isNumber(index) || index >= this.size()) {
			return null;
		} else {
			var items = this.items();
			return items[index];
		}
	},

	items: function (items) {
		if (_.isArray(items)) {
			this.model.set({items:items});
		}		
		return this.model.get('items');
	},

	itemAdd: function(cb){
		this.on(events.ITEM_ADD, cb);
	},	


	/* 上一次的深度 */
	lastDepth: function (depth) {
		if (_.isNumber(depth)) {
			this.model.set({
				lastDepth: depth
			});
		}
		return this.model.get('lastDepth');
	},

	/*
	// 最多显示几级导航
	.max( count )	
	// TODO 未完成在实际使用中加入maxLevelCount这部分的设置
	*/	
	max: function (count) {
		if (_.isNumber(count)) {
			this.model.set({
				maxLevelCount: count
			});	
		}
		return this.model.get('maxLevelCount');
	},

	/*
	// 导航
	.navi( arg ) 
	-参数为空：
		 返回当前的配置，不需要出发change事件
	-参数为数值
		 指定跳转的数值
	-参数为字符串
		 跳转到指定位置
	-参数为对象
		 -不存在对应name
			  创建新的导航并跳转到指定位置
	*/
	navi: function (args) {
		var index = this.depth() == 0 ? 0 : this.depth() - 1,
			items = this.items();

		if (_.isNull(args) || _.isUndefined(args)) {
			return items[index].value();
		}

		var compareLabel = '';
		if (_.isNumber(args)) {
			if (args > _.size(items)) return;
			this.depth(args + 1);

		} else if (_.isString(args)) {
			var items = this.items(),
				len = _.size(items),
				compareLabel = args;

			while (len--) {
				var item = items[len];
				var label = item.label();
				if (compareLabel == label) {
					this.depth(item.index() + 1);
					break;
				}
			}

		} else if (_.isArray(args)) {
			this.reset();
			this.items(args, {silent: true});
			this.initItemData();
			
		} else if ($.isPlainObject(args)) {
			var items = this.items(),
				isExist = false,
				len = _.size(items),
				compareLabel = args.label ? args.label : '';

			while (len--) {
				var item = items[len];
				var label = item.label();
				if (compareLabel == label) {
					isExist = true;
					this.depth(item.index() + 1);
					break;
				}				
			}

			if (!isExist){
				this.next(args);
			}
		}

	},	

	next: function (itemValue, options) {
		if (_.isNull(itemValue)) {
			return;
		}

		var item = new Item(itemValue);
		var depth = this.depth();
		var items = this.items() || [];

		items[depth] = item;
		items[depth].index(depth);
		items[depth].value(itemValue);

		this.depthForward({
			silent: true
		});
		this.items(items, {silent: true});

		this.trigger(events.NAVI_CHANGE, item.value());
	},

	/*
	// 更新
	.update( options )
	{ name: '', label: '' }
	提供更新name对应的label
	*/
	update: function (label, newLabel) {
		if (_.isNull(label) || _.isNull(newLabel)) {
			return;
		}
		var items = this.items(),
			len = _.size(items);
		while (len--) {
			var item = items[len];
			var value = item.value();
			if (label == value.label) {
				item.label(newLabel);
				item.value().label = newLabel;
				break;
			}
		}
		this.trigger(events.UPDATE, this);
	},	

	reset: function () {
		var items = this.items() || [];
		_.each(items, function (item){
			item.destroy();
		});
		this.items([], {silent: true});
		this.depth(0, {silent: true});
		this.lastDepth(-1);
	},

	size: function () {
		var items = this.items();
		return _.size(items);
	},

	// only 4 testing change method
	test: function(){
		var depth = this.depth();
		this.trigger(events.NAVI_CHANGE, '这是回调的测试 数据 ');		
	}
	
});

win.pNav = pNav;

})(jQuery);