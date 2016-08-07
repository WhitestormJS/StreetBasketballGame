/**
 * @author Alexander Buzin <alexbuzin88@gmail.com>
 * @version 0.0.1
 */

var ProgressLoader = function (maxsteps = 1) {
	this.percents = 0;
	this.currentStep = 0;
	this.maxSteps = maxsteps;
	this.events = {};

	return this;
}

ProgressLoader.prototype.step = function(step) {
	if (step) this.currentStep = step;
	else this.currentStep++;

	this.executeEvent('step');
	if (this.events['step-' + this.currentStep]) this.executeEvent('step-' + this.currentStep);
	if (this.currentStep === 1) this.executeEvent('start');
	if (this.currentStep === this.maxSteps) this.executeEvent('complete');
	if (this.currentStep > this.maxSteps) this.executeEvent('error');
};

ProgressLoader.prototype.getStep = function() {
	return this.currentStep;
};

ProgressLoader.prototype.getPercent = function() {
	return Math.floor(this.currentStep / this.maxSteps * 100);
};

ProgressLoader.prototype.on = function(eventName, callback) {
	var event = this.events[eventName];

	if (!event) this.events[eventName] = callback;
	else if (typeof event === 'function') this.events[eventName] = [event, callback];
	else event.push(callback); 
}

ProgressLoader.prototype.executeEvent = function(eventName) {
	var callback = this.events[eventName];
	var eventObject = {
		time: Date.now(),
		loader: this,
		step: this.getStep(),
		percent: this.getPercent()
	};

	if (!callback) return false;
	else if (typeof callback === 'function') callback(eventObject);
	else {
		callback.forEach(function(cb) {
			cb(eventObject);
		})
	}; 
};
