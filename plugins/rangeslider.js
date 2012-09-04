(function() {

	//---------------------------------------------
	// VideoJS Components for this plugin
	
	var RangeSliderControl = _V_.Component.extend({
		options: {
			components: {
				'RangeSliderContainer': {}
			}
		},
		createElement: function() {
			return this._super("div", {
				className: "vjs-rangeslider-control vjs-control"
			});
		}
	});

	var RangeSliderContainer = _V_.Component.extend({
		options: {
			components: {
				'left': { 
					componentClass: 'RangeSliderHandle',
					cls: 'vjs-rangeslider-handle-left',
					side: 'left'
				},
				'right' : { 
					componentClass: 'RangeSliderHandle',
					cls: 'vjs-rangeslider-handle-right',
					side: 'right'
				},
				'bar' : { 
					componentClass: 'RangeSliderBar'
				}
			}
		},
		init: function(player, options){
			this._super(player, options);

			this.left.box = this.el;
			this.left.handleValue = 0;
			
			this.right.box = this.el;
			this.right.handleValue = 1;

			this.bar.setHandles(this.left, this.right);
		},
		createElement: function(type, attrs) {
			attrs = _V_.merge({
				role: "slider",
				className: "vjs-rangeslider-holder",
				"aria-valuenow": 0,
				"aria-valuemin": 0,
				"aria-valuemax": 100,
				tabIndex: 0
			}, attrs);
	
			return this._super(type, attrs);
		},
		getLeft: function() {
			return this.left;
		},
		getRight: function() {
			return this.right;
		}
	});

	var RangeSliderHandle = _V_.Component.extend({
		handleValue: null, // position of handle on bar, number between 0 and 1
		init: function(player, options) {
			this._super(player, options);
			this.on('mousedown', this.onMouseDown);
		},
		createElement: function(){
			var handle = this._super("div", {
				className: "vjs-rangeslider-handle " + this.options.cls
			});
			
			handle.appendChild(_V_.createElement("div", {
				className: "vjs-rangeslider-handle-arrow"
			}));
			handle.appendChild(_V_.createElement("div", {
				className: "vjs-rangeslider-handle-line"
			}));
			
			return handle;
		},
		onMouseDown: function(event) {
			event.preventDefault();
			_V_.blockTextSelection();

			_V_.on(document, "mousemove", this.proxy(this.onMouseMove));
			_V_.on(document, "mouseup", this.proxy(this.onMouseUp));
		},
		onMouseUp: function(event) {
			_V_.off(document, "mousemove", this.onMouseMove, false);
			_V_.off(document, "mouseup", this.onMouseUp, false);
			
			this.player.trigger('rangesliderchange');
		},
		onMouseMove: function(event) {
			var left = this.calculateDistance(event);
			this.setPosition(left);
		},
		setPosition: function(left) {
			var handle = this;
			if(isNaN(left)) {
				this.player.trigger('rangeslidererror');
			} else {
				// Move the handle and bar from the left based on the current distance
				if(this.updateBar(handle, left)) {
					this.handleValue = left;
					this.el.style.left = _V_.round(this.handleValue * 100, 2) + '%';
				} else {
					this.player.trigger('rangeslidererror');
				}
			}
		},
		calculateDistance: function(event){
			var boxX = this.getBoxX();
			var boxW = this.getBoxWidth();
			var handleW = this.getWidth();

		 // Adjusted X and Width, so handle doesn't go outside the bar
			boxX = boxX + (handleW / 2);
			boxW = boxW - handleW;

		// Percent that the click is through the adjusted area
			return Math.max(0, Math.min(1, (event.pageX - boxX) / boxW));
	  },
		getBoxWidth: function() {
			return this.box.offsetWidth;
		},
		getBoxX: function() {
			return _V_.findPosX(this.box);
		},
		getWidth: function() {
			return this.el.offsetWidth;
		},
		getOffsetLeftPercent: function() {
			return this.el.offsetLeft / this.getBoxWidth();
		},
		getRawValue: function() {
			return this.handleValue;
		},
		getValue: function() {
			if(this.handleValue !== null) {
				return _V_.round(this.handleValue * this.player.duration(), 2);
			}
			return null;
		},
		setRawValue: function(rawValue) {
			this.handleValue = rawValue;
		},
		setBarUpdateHandler: function(fn) {
			this.updateBar = fn;
		}
	});
	
	var RangeSliderBar = _V_.Component.extend({
		updatePrecision: 2, // for CSS positioning 
		init: function(player, options) {
			this._super(player, options);
		},
		createElement: function(type, attrs) {
			return this._super("div", {
			  className: "vjs-rangeslider-bar"
			});			
		},
		setHandles: function(left, right) {
			this.left = left;
			this.right = right;

			this.left.setBarUpdateHandler(this.proxy(this.updateLeft));
			this.right.setBarUpdateHandler(this.proxy(this.updateRight));
		},
		updateLeft: function(handle, left) {
			var max = this.right.getOffsetLeftPercent();
			var width = this.right.getOffsetLeftPercent() - left;
			var precision = this.updatePrecision;
			
			if(_V_.round(left, precision) <= _V_.round(max, precision)) {
					this.el.style.left = _V_.round(left * 100, precision) + '%';
					this.el.style.width = _V_.round(width * 100, precision) + '%';
					return true;
			}
			return false;
		},
		updateRight: function(handle, left) {
			var min = this.left.getOffsetLeftPercent();
			var width = left - this.left.getOffsetLeftPercent();
			var precision = this.updatePrecision;
			
			if(_V_.round(left, precision) >= _V_.round(min, precision)) {
				this.el.style.width = _V_.round(width * 100, precision) + '%';
				return true;
			}
			return false;
	 }
	});

	var RangeSliderStartTime = _V_.Component.extend({
		init: function(player, options){
			this._super(player, options);
		},
		createElement: function(){
			var el = this._super("div", {
				className: "vjs-rangeslider-start-time vjs-rangeslider-time-controls vjs-control"
			});

			this.content = _V_.createElement("div", {
				className: "vjs-start-time-display",
				innerHTML: 'Start'
			});

			el.appendChild(_V_.createElement("div").appendChild(this.content));
			return el;
		}
	});
	
	var RangeSliderEndTime = _V_.Component.extend({
		init: function(player, options){
			this._super(player, options);
		},
		createElement: function(){
			var el = this._super("div", {
				className: "vjs-rangeslider-end-time vjs-rangeslider-time-controls vjs-control"
			});

			this.content = _V_.createElement("div", {
				className: "vjs-end-time-display",
				innerHTML: 'End'
			});

			el.appendChild(_V_.createElement("div").appendChild(this.content));
			return el;
		}
	});
		
	//-- Plugin
	var RangeSliderPlugin = function(player, options) {
		this.player = player; // player component
		this.options = options; // plugin options
		this.components = {}; // holds any custom components we add to the player
		
		this.init(player, options);
	};
	
	RangeSliderPlugin.prototype = {
		init: function(player, options) {
			var components = ['rangeSliderControl', 'rangeSliderStartTime', 'rangeSliderEndTime'];
			var i, name, len;
			
			// augment player with plugin components
			for(i = 0, len = components.length; i < len; i++) {
				name = components[i];
				this.components[name] = player.controlBar.addComponent(name);
			}
		},
		hide: function() {
			_V_.eachProp(this.components, function(name, component) {
				component.hide();
			});
		},
		show: function() {
			_V_.eachProp(this.components, function(name, component) {
				component.show();
			});
		},
		currentStatus: function() {
			var left = this._left().getValue();
			var right = this._right().getValue();
			var status = {
				values: [left, right],
				error: ''
			};

			return status;
		},
		setValue: function(index, value, suppressEvent) {
			var val = this._percent(value);
			if(index === 0 || index === 1) {
				this[index === 0 ? '_left' : '_right']().setPosition(val);
				this.player.trigger('rangesliderchange');
			}
		},
		_percent: function(value) {
			var duration = this.player.duration();
			if(isNaN(duration)) {
				return 0;
			}
			return Math.min(1, Math.max(0, value / duration));
		},
		_left: function() {
			return this._container().getLeft();
		},
		_right: function() {
			return this._container().getRight();
		},
		_container: function() {
			return this.components.rangeSliderControl.RangeSliderContainer;
		}
	};
	
	_V_.RangeSliderControl = RangeSliderControl;
	_V_.RangeSliderContainer = RangeSliderContainer;
	_V_.RangeSliderBar = RangeSliderBar;
	_V_.RangeSliderHandle = RangeSliderHandle;
	_V_.RangeSliderStartTime = RangeSliderStartTime;
	_V_.RangeSliderEndTime = RangeSliderEndTime;

	_V_.registerPlugin('rangeslider', RangeSliderPlugin);
})();
