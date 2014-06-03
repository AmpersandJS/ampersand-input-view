var domify = require('domify');


// can be overwritten by anything with:
// <input>, <label> and <the same `role` attributes
var template = [
    '<label>',
        '<span role="label"></span>',
        '<input>',
        '<div role="message-container" class="message message-below message-error">',
            '<p role="message-text"></p>',
        '</div>',
    '</label>'
].join('');


function TextInputView(opts) {
    if (!opts.name) throw new Error('must pass in a name');

    // settings
    this.name = opts.name;
    this.value = opts.value || '';
    this.el = opts.el;
    this.template = opts.template || template;
    this.placeholder = opts.placeholder || '';
    this.label = opts.label || '';
    this.type = opts.type || 'text';
    this.required = (typeof opts.required === 'boolean') ? opts.required : true;
    this.validClass = opts.validClass || 'input-valid';
    this.invalidClass = opts.invalidClass || 'input-invalid';
    this.requiredMessage = opts.requiredMessage || 'This field is required.';
    this.valid = false;
    this.parent = opts.parent;

    // render right away
    this.render();

    // add our event handlers
    this.handleBlur = this.handleBlur.bind(this);
    this.handleInputEvent = this.handleInputEvent.bind(this);
    this.input.addEventListener('blur', this.handleBlur, false);
    this.input.addEventListener('input', this.handleInputEvent, false);

    // tests for validity
    this.tests = opts.tests || [];

    this.checkValid();
}

// remove and destroy element
TextInputView.prototype.remove = function () {
    this.input.removeEventListener('input', this.handleInputEvent, false);
    this.input.removeEventListener('blur', this.handleBlur, false);
    var parent = this.el.parentNode;
    if (parent) parent.removeChild(this.el);
};

// handle input events and show appropriate errors
TextInputView.prototype.handleInputEvent = function () {
    this.value = this.input.value;
    this.edited = true;
    this.runTests();
    if (this.parent) this.parent.update(this);
};

// set the error message if exists
// hides the message container entirely otherwise
TextInputView.prototype.setMessage = function (message) {
    var input = this.input;
    this.message = message;
    // there is an error
    if (message && this.hasBeenValid) {
        this.messageContainer.style.display = 'block';
        this.messageEl.textContent = message;
        addClass(input, this.invalidClass);
        removeClass(input, this.validClass);
    } else {
        this.messageContainer.style.display = 'none';
        if (this.hasBeenValid && this.edited) {
            addClass(input, this.validClass);
            removeClass(input, this.invalidClass);
        }
    }
};

// this is so we don't throw validation errors while typing
TextInputView.prototype.handleBlur = function () {
    if (this.value) {
        if (this.edited) this.hasBeenValid = true;
        this.runTests();
    }
};

TextInputView.prototype.beforeSubmit = function () {
    this.hasBeenValid = true;
    this.edited = true;
    this.runTests();
};

TextInputView.prototype.checkValid = function () {
    var message = '';
    if (this.required && !this.value) {
        message = this.requiredMessage;
    } else {
        this.tests.some(function (test) {
            message = test.call(this, this.value);
            return message;
        }, this);
    }
    this.valid = !message;
    return message;
};

// runs tests and sets first failure as message
TextInputView.prototype.runTests = function () {
    var message = this.checkValid();
    if (!message) this.hasBeenValid = true;
    this.setMessage(message);
};

// expose option to set type dynamically, this
// can be useful in mobile situations where you
// may want a password field to be visible
TextInputView.prototype.setInputType = function (type) {
    if (type) this.type = type;
    this.input.setAttribute('type', this.type);
};

// very `manual` render to avoid dependencies
TextInputView.prototype.render = function () {
    // only allow this to be called once
    if (this.rendered) return;
    var newDom = domify(this.template);
    var parent = this.el && this.el.parentNode;
    if (parent) parent.replaceChild(newDom, this.el);
    this.el = newDom;
    this.input = this.el.querySelector('input');
    this.labelEl = this.el.querySelector('[role=label]');
    this.messageContainer = this.el.querySelector('[role=message-container]');
    this.messageEl = this.el.querySelector('[role=message-text]');
    this.setInputType();
    this.setMessage(this.message);
    if (this.required) this.input.required = true;
    this.input.setAttribute('placeholder', this.placeholder);
    this.input.value = this.value;
    this.labelEl.textContent = this.label;
    this.rendered = true;
};

module.exports = TextInputView;


// helpers *ugh*
function hasClass(el, cls) {
    if (el.classList) {
        return el.classList.contains(cls);
    } else {
        return new RegExp('(^| )' + cls + '( |$)', 'gi').test(el.className);
    }
}

function addClass(el, cls) {
    if (!hasClass(el, cls)) {
        if (el.classList) {
            el.classList.add(cls);
        } else {
            el.className += ' ' + cls;
        }
    }
}

function removeClass(el, cls) {
    if (el.classList) {
        el.classList.remove(cls);
    } else {
        el.className = el.className.replace(new RegExp('(^|\\b)' + cls.split(' ').join('|') + '(\\b|$)', 'gi'), ' ');
    }
}
