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
        name: 'title'
    });
    input.render();
    input.setValue('something');
    t.equal(input.input.value, 'something', 'Value should be updated');
    input.reset();
    t.equal(input.input.value, '', 'Value should be reset');

    var input2 = new InputView({
        name: 'title',
        value: 'start'
    });
    input2.render();
    t.equal(input2.input.value, 'start', 'Value should be set initially');
    input2.setValue('somethingelse');
    t.equal(input2.input.value, 'somethingelse', 'value should be updated');
    input2.reset();
    t.equal(input2.input.value, 'start', 'value should have been reset to original');

    t.end();
});

test('clear', function (t) {
    var input = new InputView({
        name: 'title',
        value: 'something'
    });
    input.render();

    t.equal(input.input.value, 'something');
    input.reset();
    t.equal(input.input.value, 'something', 'reset should do nothing');
    input.clear();
    t.equal(input.input.value, '');
    t.equal(input.value, '');

    var input2 = new InputView({
        name: 'thing'
    });
    input2.render();
    t.equal(input2.value, '');
    input2.setValue('thing');
    t.equal(input2.input.value, 'thing');
    t.equal(input2.value, 'thing');
    input2.clear();
    t.equal(input2.input.value, '');
    t.equal(input2.value, '');

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


test('validityClass is present on submit even if unchanged', function (t) {
    [
        new InputView({
            name: 'title',
            required: true
        }),
        new InputView({
            name: 'title',
            required: true,
            value: ''
        })
    ].forEach(function (input) {
        input.render();

        var inputElement = input.el.querySelector('input');
        var messageContainer = input.el.querySelector('[data-hook=message-container]');

        // "Trigger submit on the input"
        // TODO: should we pull in form-view and do a dom submit event?
        input.beforeSubmit();

        t.notOk(input.valid, 'Input should be invalid');
        t.notOk(isHidden(messageContainer), 'Message should be visible');
        t.ok(hasClass(inputElement, 'input-invalid'), 'Has invalid class');
        t.notOk(hasClass(inputElement, 'input-valid'), 'Does not have valid class');
    });

    t.end();
});

test('Required views display message and class after edited', function (t) {
    [
        new InputView({
            name: 'title',
            required: true
        }),
        new InputView({
            name: 'title',
            required: true,
            value: ''
        })
    ].forEach(function (input) {
        input.render();

        var inputElement = input.el.querySelector('input');
        var messageContainer = input.el.querySelector('[data-hook=message-container]');

        inputElement.value = 'Required string';
        input.handleInputChanged();
        input.handleBlur();

        t.ok(input.valid, 'Input should be valid');
        t.ok(isHidden(messageContainer), 'Message should not be visible');
        t.notOk(hasClass(inputElement, 'input-invalid'), 'Does not have invalid class');
        t.ok(hasClass(inputElement, 'input-valid'), 'Has valid class');

        // Changing the value back to an empty string should show invalid
        // message and class even though it is technically "unchanged"
        inputElement.value = '';
        input.handleInputChanged();
        input.handleBlur();

        t.notOk(input.valid, 'Input should be invalid');
        t.notOk(isHidden(messageContainer), 'Message should be visible');
        t.ok(hasClass(inputElement, 'input-invalid'), 'Has invalid class');
        t.notOk(hasClass(inputElement, 'input-valid'), 'Does not have valid class');
    });

    t.end();
});

test('value reports changed in cases where it shouldnt', function (t) {
    [
        new InputView({
            name: 'title'
        }),
        new InputView({
            name: 'title',
            value: ''
        }),
        new InputView({
            name: 'title',
            value: null
        })
    ].forEach(function (input) {
        input.render();

        var inputElement = input.el.querySelector('input');

        // Setting the input value directly and trigger input changed
        inputElement.value = '0';
        input.handleInputChanged();
        t.ok(input.changed, 'Input is changed');

        inputElement.value = '';
        input.handleInputChanged();
        t.notOk(input.changed, 'Input is not changed when empty string');

        inputElement.value = null;
        input.handleInputChanged();
        t.notOk(input.changed, 'Input is not changed when null');

        // Using the `setValue` method
        input.setValue('0');
        t.ok(input.changed, 'Input is changed');

        input.setValue('');
        t.notOk(input.changed, 'Input is not changed when empty string');

        input.setValue(null);
        t.notOk(input.changed, 'Input is not changed when null');
    });

    t.end();
});
