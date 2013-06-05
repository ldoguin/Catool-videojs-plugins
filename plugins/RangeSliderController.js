NXVideoInfo = {};

NXVideoInfo.components = {};
NXVideoInfo.options = {};

NXVideoInfo.init = function(player, options) {
 	player.rangeslider(options);
	var components = ['RangeSliderControl', 'RangeSliderStartTime', 'RangeSliderEndTime'];
	var i, name, len;
	this.options=options;
	this.player=player;

	// augment player with plugin components
	for(i = 0, len = components.length; i < len; i++) {
		name = components[i];
		this.components[name] = player.controlBar.addChild(name, options);
	}
	if(this.options.locked) {
		this.lock();
	}
	NXVideoInfo.show();
},
NXVideoInfo.hide = function() {
	for(componentName in this.components) {
		this.components[componentName].hide();
	}
},
NXVideoInfo.show = function() {
	for(componentName in this.components) {
		this.components[componentName].show();
	}
},
NXVideoInfo.lock = function() {
	this.options.locked = true;
	videojs.trigger(document,'rangesliderlock');
},
NXVideoInfo.unlock = function() {
	this.options.locked = false;
	videojs.trigger(document,'rangesliderunlock');
},
NXVideoInfo.currentStatus = function() {
	var left = this._left().getValue();
	var right = this._right().getValue();
	var status = {
		values: [left, right],
		error: ''
	};
	return status;
},
NXVideoInfo.setValue = function(index, value, suppressEvent) {
	var val = this._percent(value);
	var isValidIndex = (index === 0 || index === 1);
	var isChangeable = !this.locked;
	if(isChangeable && isValidIndex) {
		this[index === 0 ? '_left' : '_right']().setPosition(val);
		if(!suppressEvent) {
			videojs.trigger(this,'rangesliderchange');
		}
	}
},
NXVideoInfo._percent = function(value) {
	var duration = this.player().duration();
	if(isNaN(duration)) {
		return 0;
	}
	return Math.min(1, Math.max(0, value / duration));
},
NXVideoInfo._left = function() {
	return this._container().getLeft();
},
NXVideoInfo._right = function() {
	return this._container().getRight();
},
NXVideoInfo._container = function() {
	return this.components.RangeSliderControl.RangeSliderContainer;
},
NXVideoInfo.initializeRangeSlider = function(video, options) {
	NXVideoInfo.init(video, options);
};

