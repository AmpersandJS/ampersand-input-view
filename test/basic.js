var test = require('tape');
var suite = require('tape-suite');
var viewConventions = require('ampersand-view-conventions');
var InputView = require('../ampersand-input-view');
var customTemplate = '<label class="custominput"><span data-hook="label"></span><input><div data-hook="message-container"><p data-hook="message-text"></p></div></label>';
if (!Function.prototype.bind) Function.prototype.bind = require('function-bind');

var fieldOptions = {
    autoRender: true,
    name: 'textField'
};
viewConventions.view(suite.tape, InputView, fieldOptions);
viewConventions.formField(suite.tape, InputView, fieldOptions, 'foo');

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

test('should return view on render', function(t){
    var input = new InputView({ name: 'title' });
    var rendered = input.render();
    t.equal(input,rendered);
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

test('initialize with number value and type perserved after render', function (t) {
    var position = 1;
    var input = new InputView({
        name: 'position',
        value: position,
        type: 'number'
    });

    input.render();

    t.equal(input.value, position);
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

    input.beforeSubmit(); //Turn on shouldValidate
    input.reset();
    t.equal(input.shouldValidate, false);
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

    input.beforeSubmit(); //Turn on shouldValidate
    input.clear();
    t.equal(input.shouldValidate, false);


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

test('value `0` should be treated as a valid value if required is set to true', function(t) {
    var input = new InputView({
        name: 'title',
        type: 'number',
        value: 0,
        required: true
    });

    input.render();

    var inputElement = input.el.querySelector('input');
    var messageContainer = input.el.querySelector('[data-hook=message-container]');

    t.ok(isHidden(messageContainer), 'Message should not be visible');

    inputElement.value = 1;
    input.handleInputChanged();
    input.handleChange();
    t.ok(isHidden(messageContainer), 'Message should not be visible');

    inputElement.value = 0;
    input.handleInputChanged();
    input.handleChange();
    t.ok(isHidden(messageContainer), 'Message should not be visible');

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
        input.handleChange();

        t.notOk(input.valid, 'Input should be invalid');
        t.notOk(isHidden(messageContainer), 'Message should be visible');
        t.ok(hasClass(inputElement, 'input-invalid'), 'Has invalid class');
        t.notOk(hasClass(inputElement, 'input-valid'), 'Does not have valid class');

        //"Trigger change events again"
        inputElement.value = 'Once upon a time!';
        input.handleInputChanged();
        input.handleChange();

        t.ok(input.valid, 'Input should be valid');
        t.ok(isHidden(messageContainer), 'Message should not be visible');
        t.notOk(hasClass(inputElement, 'input-invalid'), 'Does not have invalid class');
        t.ok(hasClass(inputElement, 'input-valid'), 'Has valid class');
    });

    t.end();
});

test ('validityClassSelector', function (t) {
    var input = new InputView({
        name: 'title',
        validityClassSelector: 'label',
        required: true
    });

    input.render();
    var inputElement = input.el.querySelector('input');
    input.beforeSubmit();
    t.ok(hasClass(input.el, 'input-invalid'), 'Label has invalid class');
    t.notOk(hasClass(input.el, 'input-valid'), 'Label does not have valid class');
    t.notOk(hasClass(inputElement, 'input-invalid'), 'Input does not have invalid class');
    t.notOk(hasClass(inputElement, 'input-valid'), 'Input does not have valid class');

    input = new InputView({
        name: 'title',
        validityClassSelector: 'label, input',
        required: true
    });
    input.render();
    inputElement = input.el.querySelector('input');
    input.beforeSubmit();
    t.ok(hasClass(input.el, 'input-invalid'), 'Label has invalid class');
    t.notOk(hasClass(input.el, 'input-valid'), 'Label does not have valid class');
    t.ok(hasClass(inputElement, 'input-invalid'), 'Input has invalid class');
    t.notOk(hasClass(inputElement, 'input-valid'), 'Input does not have valid class');
    t.end();
});

test('inputClass is present on submit even if unchanged', function (t) {
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
        input.handleChange();

        t.ok(input.valid, 'Input should be valid');
        t.ok(isHidden(messageContainer), 'Message should not be visible');
        t.notOk(hasClass(inputElement, 'input-invalid'), 'Does not have invalid class');
        t.ok(hasClass(inputElement, 'input-valid'), 'Has valid class');

        // Changing the value back to an empty string should show invalid
        // message and class even though it is technically "unchanged"
        inputElement.value = '';
        input.handleInputChanged();
        input.handleChange();

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

test('initialize with a custom beforeSubmit', function (t) {
    var customBeforeSubmit = function () { return; };
    var input = new InputView({
        name: 'title',
        beforeSubmit: customBeforeSubmit
    });

    t.equal(input.beforeSubmit, customBeforeSubmit);
    t.end();
});

test('input that is dependent on another', function (t) {
    var inputOne = new InputView({
        name: 'foo',
        required: true
    });

    var inputTwo = new InputView({
        name: 'bar',
        required: false,
        tests: [
            function () {
                if (inputOne.valid) {
                    return 'Not valid';
                }
            }
        ]
    });
    inputOne.render();
    inputTwo.render();
    var inputElement = inputTwo.el.querySelector('input');
    var messageContainer = inputTwo.el.querySelector('[data-hook=message-container]');

    t.notOk(inputOne.valid);
    t.ok(inputTwo.valid);
    inputOne.setValue('something');
    // Since the only thing parent form evaluates on submit is the valid entry,
    // we can simulated that by evaluating valid on both
    t.ok(inputOne.valid);
    t.notOk(inputTwo.valid);
    t.ok(isHidden(messageContainer), 'Message should not be visible');
    t.notOk(hasClass(inputElement, 'input-invalid'), 'Does not have invalid class');
    t.notOk(hasClass(inputElement, 'input-valid'), 'Doest not have valid class');
    t.end();
});
