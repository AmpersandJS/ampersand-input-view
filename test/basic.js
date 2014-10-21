var test = require('tape');
var InputView = require('../ampersand-input-view');
var customTemplate = '<label class="custominput"><span data-hook="label"></span><input><div data-hook="message-container"><p data-hook="message-text"></p></div></label>';
if (!Function.prototype.bind) Function.prototype.bind = require('function-bind');

function isHidden(el) {
    return el.style.display === 'none';
}

function hasClass(el, klass) {
    return el.classList.contains(klass);
}

test('basic initialization', function (t) {
    var input = new InputView({ name: 'title' });
    input.render();
    t.equal(input.el.tagName, 'LABEL');
    t.equal(input.el.querySelectorAll('input').length, 1);
    t.equal(input.el.querySelector('input').getAttribute('name'), 'title');
    t.end();
});

test('initialize with value', function (t) {
    var input = new InputView({
        name: 'title',
        value: 'Once upon a time'
    });

    input.render();

    t.equal(input.el.querySelector('input').value, 'Once upon a time');
    t.end();
});

test('can initialize with template without having to extend', function (t) {
    var input = new InputView({
        name: 'title',
        value: 'Once upon a time',
        template: customTemplate
    });

    input.render();

    t.equal(input.el.className, 'custominput');
    t.end();
});

test('should be able to extend a template as well', function (t) {
    var input = new (InputView.extend({
        template: customTemplate
    }))({name: 'title',
        value: 'Once upon a time',
    });

    input.render();

    t.equal(input.el.className, 'custominput');
    t.end();

    input.render();
});

test('reset value', function (t) {
    var input = new InputView({
        name: 'title',
        value: 'My time here is short'
    });

    input.render();
    input.reset();
    input.render();

    t.equal(input.el.querySelector('input').value, '', 'Value should be reset');
    t.end();
});

test('initalize with a value of `0`', function(t) {
    var input = new InputView({
        name: 'title',
        type: 'number',
        value: 0
    });

    input.render();

    t.equal(parseFloat(input.el.querySelector('input').value), 0);
    t.end();
});

test('Tests with required true and false', function (t) {
    var inputs = [
        new InputView({
            name: 'title',
            required: true,
            tests: [
                function (val) {
                    if (val.length < 5) return 'Must be 5+ characters.';
                }
            ]
        }),
        new InputView({
            name: 'title',
            required: false,
            tests: [
                function (val) {
                    if (val.length < 5) return 'Must be 5+ characters.';
                }
            ]
        }),
    ];

    inputs.forEach(function (input) {
        input.render();

        var inputElement = input.el.querySelector('input');
        var messageContainer = input.el.querySelector('[data-hook=message-container]');

        //"Trigger change events"
        //TODO: this should be real dom events
        inputElement.value = 'O';
        input.handleInputChanged();

        // At this point we are not yet blurred so there should no messages or classes
        t.notOk(input.valid, 'Input should be invalid');
        t.ok(isHidden(messageContainer), 'Message should not be visible');
        t.notOk(hasClass(inputElement, 'input-invalid'), 'Does not have invalid class');
        t.notOk(hasClass(inputElement, 'input-valid'), 'Doest not have valid class');

        // Another change to an empty state
        inputElement.value = '';
        input.handleInputChanged();


        // should still not show errors
        t.notOk(input.valid, 'Input should be invalid');
        t.ok(isHidden(messageContainer), 'Message should not be visible');
        t.notOk(hasClass(inputElement, 'input-invalid'), 'Does not have invalid class');
        t.notOk(hasClass(inputElement, 'input-valid'), 'Doest not have valid class');

        // Blur to trigger invalid message/class
        inputElement.value = 'O';
        input.handleInputChanged();
        input.handleBlur();

        t.notOk(input.valid, 'Input should be invalid');
        t.notOk(isHidden(messageContainer), 'Message should be visible');
        t.ok(hasClass(inputElement, 'input-invalid'), 'Has invalid class');
        t.notOk(hasClass(inputElement, 'input-valid'), 'Does not have valid class');

        //"Trigger change events again"
        inputElement.value = 'Once upon a time!';
        input.handleInputChanged();
        input.handleBlur();

        t.ok(input.valid, 'Input should be valid');
        t.ok(isHidden(messageContainer), 'Message should not be visible');
        t.notOk(hasClass(inputElement, 'input-invalid'), 'Does not have invalid class');
        t.ok(hasClass(inputElement, 'input-valid'), 'Has valid class');
    });

    t.end();
});

test('allow setting root element class', function (t) {
    var input = new InputView();
    input.render();
    t.equal(input.el.className, '');

    input = new InputView({
        rootElementClass: 'something'
    });
    input.render();

    t.equal(input.el.className, 'something');
    input.rootElementClass = 'somethingelse';
    t.equal(input.el.className, 'somethingelse');

    t.end();
});
