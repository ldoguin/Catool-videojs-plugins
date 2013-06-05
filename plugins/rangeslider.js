/**
 * This is a simple plugin for the VideoJS player that creates
 * a basic range slider on top of the seek bar. 
 *
 * It was made to facilitate setting IN/OUT points on a video and to feed
 * these values back to a form via custom player events. It is pure
 * HTML and CSS so it should work with both the HTML5 and Flash players,
 * just like the regular controls.
 *
 */
(function() {


	//-- define components
	videojs.RangeSliderControl = videojs.Component.extend({});
	videojs.RangeSliderControl.prototype.createEl = function(){
		return videojs.Component.prototype.createEl.call(this, 'div', {
			className: "videojs-rangeslider-control videojs-control"
		});
	};

	videojs.RangeSliderControl.prototype.options_ = {
		children: {
			'RangeSliderContainer': {},
		}
	};


	videojs.RangeSliderContainer = videojs.Component.extend({
		init: function(player, options){
			videojs.Component.call(this,player, options);
			this.left.box = this.el();
			this.left.handleValue = 0;
			
			this.right.box = this.el();
			this.right.handleValue = 1;

			this.bar.setHandles(this.left, this.right);
		}
	});


	videojs.RangeSliderContainer.prototype.getLeft = function(){
		return this.left;
	};
	videojs.RangeSliderContainer.prototype.getRight = function(){
		return this.right;
	};


	videojs.RangeSliderContainer.prototype.createEl = function(type, props){
		props = videojs.obj.merge({
			role: "slider",
			className: "videojs-rangeslider-holder",
			"aria-valuenow": 0,
			"aria-valuemin": 0,
			"aria-valuemax": 100,
			tabIndex: 0
		}, props);
	        return videojs.Component.prototype.createEl.call(this, type, props);
	};


	videojs.RangeSliderContainer.prototype.options_ = {
		children: {
			'left': { 
				componentClass: 'RangeSliderHandle',
				cls: 'videojs-rangeslider-handle-left',
				side: 'left'
			},
			'right' : { 
				componentClass: 'RangeSliderHandle',
				cls: 'videojs-rangeslider-handle-right',
				side: 'right'
			},
			'bar' : { 
				componentClass: 'RangeSliderBar'
			}
		}
	};



	videojs.RangeSliderHandle = videojs.Component.extend({
		handleValue: null, // position of handle on bar, number between 0 and 1
		locked: false, // true if the handle position is locked, false otherwise 
		init: function(player, options) {
			videojs.Component.call(this,player, options);
			this.on('mousedown', this.onMouseDown);

			videojs.on(document, 'rangesliderlock', videojs.bind(this,this.onLock));
			videojs.on(document, 'rangesliderunlock', videojs.bind(this,this.onUnlock));
		}

	});

	videojs.RangeSliderHandle.prototype.createEl = function(){
		var handle = videojs.Component.prototype.createEl.call(this, "div", {
			className: "videojs-rangeslider-handle " + this.options_.cls
		});
			
		handle.appendChild(videojs.Component.prototype.createEl.call(this,"div", {
			className: "videojs-rangeslider-handle-arrow"
		}));
		handle.appendChild(videojs.Component.prototype.createEl.call(this,"div", {
			className: "videojs-rangeslider-handle-line"
		}));
			
		return handle;
	};

	videojs.RangeSliderHandle.prototype.onLock = function(event) {
		this.locked = true;
	};
	videojs.RangeSliderHandle.prototype.onUnlock = function(event) {
		this.locked = false;
	};
	videojs.RangeSliderHandle.prototype.onMouseDown = function(event) {
		event.preventDefault();
		videojs.blockTextSelection();
		if(!this.locked) {
			videojs.on(document, "mousemove", videojs.bind(this, this.onMouseMove));
			videojs.on(document, "mouseup", videojs.bind(this, this.onMouseUp));
		}
	};
	videojs.RangeSliderHandle.prototype.onMouseUp = function(event) {
		videojs.off(document, "mousemove", this.onMouseMove, false);
		videojs.off(document, "mouseup", this.onMouseUp, false);
		
		if(!this.locked) {
			this.player().trigger('rangesliderchange');
		}
	};
	videojs.RangeSliderHandle.prototype.onMouseMove = function(event) {
		var left = this.calculateDistance(event);
		this.setPosition(left);
	};
	videojs.RangeSliderHandle.prototype.setPosition = function(left) {
		var handle = this;

		// Position shouldn't change when handle is locked
		if(handle.locked) {
			return false;
		}
		// Check for invalid position
		if(isNaN(left)) {
			this.player().trigger('rangeslidererror');
			return false;
		}

		// Move the handle and bar from the left based on the current distance
		if(this.updateBar(handle, left)) {
			this.handleValue = left;
			this.el().style.left = videojs.round(this.handleValue * 100, 2) + '%';
		} else {
			this.player().trigger('rangeslidererror');
			return false;
		}
		return true;
	};

	videojs.RangeSliderHandle.prototype.calculateDistance = function(event){
		var boxX = this.getBoxX();
		var boxW = this.getBoxWidth();
		var handleW = this.getWidth();

		// Adjusted X and Width, so handle doesn't go outside the bar
		boxX = boxX + (handleW / 2);
		boxW = boxW - handleW;

		// Percent that the click is through the adjusted area
		return Math.max(0, Math.min(1, (event.pageX - boxX) / boxW));
	};

	videojs.RangeSliderHandle.prototype.getBoxWidth = function() {
		return this.box.offsetWidth;
	};

	videojs.RangeSliderHandle.prototype.getBoxX = function() {
		return videojs.findPosition(this.box).left;
	};

	videojs.RangeSliderHandle.prototype.getWidth = function() {
		return this.el().offsetWidth;
	};

	videojs.RangeSliderHandle.prototype.getOffsetLeftPercent = function() {
		return this.el().offsetLeft / this.getBoxWidth();
	};

	videojs.RangeSliderHandle.prototype.getRawValue = function() {
		return this.handleValue;
	};

	videojs.RangeSliderHandle.prototype.getValue = function() {
		if(this.handleValue !== null) {
			return videojs.round(this.handleValue * this.player().duration(), 2);
		}
		return null;
	};

	videojs.RangeSliderHandle.prototype.setRawValue = function(rawValue) {
		this.handleValue = rawValue;
	};

	videojs.RangeSliderHandle.prototype.setBarUpdateHandler = function(fn) {
		this.updateBar = fn;
	};

	videojs.RangeSliderBar = videojs.Component.extend({
		updatePrecision: 2, // for CSS positioning 
	});

	videojs.RangeSliderBar.prototype.createEl = function(type, attrs) {
		return videojs.Component.prototype.createEl.call(this,"div", {
		  className: "videojs-rangeslider-bar"
		});			
	};
	videojs.RangeSliderBar.prototype.setHandles = function(left, right) {
		this.left = left;
		this.right = right;
		this.left.setBarUpdateHandler(videojs.bind(this,this.updateLeft));
		this.right.setBarUpdateHandler(videojs.bind(this,this.updateRight));
	};

	videojs.RangeSliderBar.prototype.updateLeft = function(handle, left) {
		var max = this.right.getOffsetLeftPercent();
		var width = this.right.getOffsetLeftPercent() - left;
		var precision = this.updatePrecision;
		if(videojs.round(left, precision) <= videojs.round(max, precision)) {
				this.el().style.left = videojs.round(left * 100, precision) + '%';
				this.el().style.width = videojs.round(width * 100, precision) + '%';
				return true;
		}
		return false;
	};
	videojs.RangeSliderBar.prototype.updateRight = function(handle, left) {
		var min = this.left.getOffsetLeftPercent();
		var width = left - this.left.getOffsetLeftPercent();
		var precision = this.updatePrecision;
		
		if(videojs.round(left, precision) >= videojs.round(min, precision)) {
			this.el().style.width = videojs.round(width * 100, precision) + '%';
			return true;
		}
		return false;
	};

	videojs.RangeSliderTime = videojs.Component.extend({});

	videojs.RangeSliderTime.prototype.createEl = function(){
		var el = videojs.Component.prototype.createEl.call(this,"div", {
			className: [this.timeCls, "videojs-rangeslider-time-controls", "videojs-control"].join(' ')
		});
		this.content = videojs.createEl("div", {
			className: this.timeDisplayCls,
			innerHTML: this.timeText
		});
		el.appendChild(videojs.createEl("div").appendChild(this.content));
		return el;
	};


	videojs.RangeSliderStartTime = videojs.RangeSliderTime.extend({
		timeText: 'Start',
		timeCls: 'videojs-rangeslider-start-time',
		timeDisplayCls: 'videojs-start-time-display'
	});

	videojs.RangeSliderEndTime = videojs.RangeSliderTime.extend({
		timeText: 'End',
		timeCls: 'videojs-rangeslider-end-time',
		timeDisplayCls: 'videojs-end-time-display'
	});


	videojs.plugin('rangeslider', function(options) {
		options = options || {}; // plugin options
		if(!options.hasOwnProperty('locked')) {
			options.locked = false; // lock slider handles
		}
	});
})();

