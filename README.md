# ampersand-input-view

A view module for intelligently rendering and validating input. Works well with [ampersand-form-view](https://github.com/AmpersandJS/ampersand-form-view).

It does the following:

- Automatically shows/hides error messages based on tests
- Will not show error messages pre-submit or if it's never had a valid value. This lets people tab-through a form without triggering a bunch of error messages.
- Live-validates to always report if in valid state, but only shows messages when sane to do so.
- Only shows first failed message, then as user goes to correct, updates and validates against all tests, showing appropriate message until all tests pass.

It's built on [ampersand-view](https://github.com/AmpersandJS/ampersand-view) so it can be extended with `extend` as you might expect.


## install

```
npm install ampersand-input-view
```

## example

```javascript
var FormView = require('ampersand-form-view');
var InputView = require('ampersand-input-view');


module.exports = FormView.extend({
    fields: function () {
        return [
            new InputView({
                label: 'Address',
                name: 'address',
                value: this.model.address || '',
                required: false,
                placeholder: '2000 Avenue of the Stars, Los Angeles CA',
                parent: this
            })
        ];
    }
});

```

## API Reference

### extend `AmpersandInputView.extend({ })`

Since this view is based on [ampersand-state](http://ampersandjs.com/docs#ampersand-state) it can be extended in the same way. 

To create an **InputView** class of your own, you extend **AmpersandInputView** and provide instance properties and options for your class. Typically here you will pass any properties (`props`, `session` and `derived`) of your state class, and any instance methods to be attached to instances of your class.

If you're wanting to add an **initialize** function for your subclass of InputView, note that you're actually overwriting `initialize` which means you'll want to call its parent class's `initialize` manually like so:


```javascript
var AmpersandInputView = require('ampersand-input-view');

var MyCustomInput = AmpersandInputView.extend({
    initialize: function () {
        // call its parent's initialize manually
        AmpersandInputView.prototype.initialize.call(apply, arguments);

        // do whatever else you need to do on init here
    } 
});
```


### constructor/initialize `new AmpersandInputView([opts])`

When creating an instance of an input view, you can pass in the initial values of the **attributes** which will be [set](http://ampersandjs.com/docs#ampersand-state-set) on the state. Unless [extraProperties](#amperand-state-extra-properties) is set to `allow`, you will need to have defined these attributes in `props` or `session`.


#### opts

- name (required): name to use for input tag name and name used when reporting to parent form.
- type (default: `'text'`): input type to use, can be any valid HTML5 input type.
- value: initial value to set it to.
- template: a custom template to use (see 'template' section below for more).
- placeholder: optional value used as placeholder in input.
- el: optional element if you want to render it into a specific exisiting element pass it on initialization.
- required (default: `false`): whether this field is required or not.
- requiredMessage (default: `'This field is required'`): message to use if required and empty.
- tests (default: `[]`): test function to run on input (more below).
- validClass (defalt: `'input-valid'`): class to apply to input if valid.
- invalidClass (defalt: `'input-invalid'`): class to apply to input if invalid.
- parent: a view instance to use as the parent for this input. If used in a form view, the form sets this for you.


### render `inputView.render()`

Renders the input view. This gets handled for you if used within a parent [ampersand-form-view](https://github.com/ampersandjs/ampersand-form-view).

### template `inputView.template`

This can either be customized by using `extend` or by passing in a `template` property as part of your constructor arguments.

It can be a function returning an HTML string or DOM or it can be just an HTML string.

But the resulting HTML should contain the following hooks:

- an `<input>` or `<textarea>` element
- an element with a `data-hook="label"` attribute
- an element with a `data-hook="message-container"` attribute (this we'll show/hide)
- an element with a `data-hook="message-text"` attribute (where message text goes for error)

Creating a new class:

```javascript
// creating a custom input that has an alternate template
var CustomInput = AmpersandInputView.extend({
    template: [
        '<label>',
            '<input class="form-input">',
            '<span data-hook="label"></span>',
            '<div data-hook="message-container" class="message message-below message-error">',
                '<p data-hook="message-text"></p>',
            '</div>',
        '</label>'
    ].join('');
});

// Then any instances of that would have it
var myCustomInput = new CustomInput();
```

Setting the template when instantiating it:

```
// Or you can also pass it in when creating the instance
var myInput = new AmpersandInputView({
    template: myCustomTemplateStringOrFunction
});
```

### value `new AmpersandInputView({ value: 'something' })`

If passed when creating the original input it will be set in the input element and also be tracked as `startingValue`.

This is also the value that will be reverted to if we call `.reset()` on the input.

```javascript
var myInput = new AmpersandInputView({
    name: 'company name',
    value: '&yet'
});
myInput.render();
console.log(myInput.input.value); //=> '&yet'

myInput.setValue('something else');
console.log(myInput.input.value); //=> 'something else'
myInput.setValue('something else');
myInput.reset();
console.log(myInput.input.value); //=> '&yet'
```

#### Custom calculated output `value`

If you need to decouple what the user enters into the form from what the resulting value is that gets passed by the form you can do that by overwriting the `value` derived property.

Say you're making a validated address input. You may have a single text input for address that you do an API call to attempt to match to a real known address. So you have a single input, but you want the `value` of this input view to actually be an object of the resulting address fields from that API.

Do it by overwriting the `value` derived property as follows:

```javascript
var VerifiedAddressInput = AmpersandInputView.extend({
    initialize: function () {
        // call parent constructor
        AmpersandInputView.prototype.initialize.call(apply, arguments);

        // listen for changes to input value
        this.on('change:inputValue', this.validateAddress, this);
    },
    props: {
        verifiedAddress: {
            type: 'object'
        }
    },
    derived: {
        value: {
            // in you want it re-calculated
            // when the user changes input
            // make it dependent on `inputValue`
            deps: ['verifiedAddress'],
            fn: function () {
                // calculate your value here
                return this.verifiedAddress;
            }
        },
        // you may also want to change what
        // deterines if this field should be 
        // considerd valid. In this case, whether
        // it has a validated address
        valid: {
            deps: ['value'],
            fn: function () {
                if (this.verifiedAddress) {
                    return true;
                } else {
                    return false;
                }
            }
        }
    },
    // run our address verification
    validateAddress: function () {
        // validate it against your API (up to you how)
        validateIt(this.inputValue, function (result) {
            this.verifiedAddress = result;
        });
    }
});
```

### tests `InputView.extend({ tests: [test functions] });` or `new InputView({ tests: [] })`

Tests can be extended onto a new constructor for the input or can be passed in on init.

This should be an array of test functions. The test functions you supply will be called with the context of the input view and with the input value as the argument.

The tests should return an error message if invalid and a falsy value otherwise (or just not return at all).

```javascript
var myInput = new InputView({
    name: 'tweet',
    label: 'Your Tweet',
    tests: [
        function (value) {
            if (value.length > 140) {
                return "A tweet can be no more than 140 characters";
            }
        }
    ] 
});
```

*note:* you can still do `required: true` and pass tests. If you do it will check if it's not empty first and show the `requiredMessage` error if empty. Note that the input will only show one error per field at a time. This is to minimize annoyance. We don't want to show "this field is required" and every other error if they just left it empty. We just show the first one that fails, then when they go to correct it, it will change as they type to the other error or the error will disappear once valid. 


### setValue `inputView.setValue([value], [skipValidation|bool])`

Setter for value that will fire all appropriate handlers/tests. Can also be done by user input or setting value of `input` manually.

Passing `true` as second argument will skip validation. This is mainly for internal use.


### reset `inputView.reset()`

Set value to back original value. If you passed a `value` when creating the view it will reset to that, otherwise to `''`. 


### clear `inputView.clear()`

Sets value to `''` no matter what previous values were.


## changelog

- 3.1.0 - Add [ampersand-version](https://github.com/ampersandjs/ampersand-version) for version tracking.
- 3.0.0 - Add API reference docs. Add `.clear()`, `.reset()` methods. Make `value` derived property. Fix #21 validity class issue.
- 2.1.0 - Can now set `rootElementClass`. Add reset function #15. Allow setting `0` as value #17.
- 2.0.2 - Make sure templates can be passed in, in constructor.

## credits

Created by [@HenrikJoreteg](http://twitter.com/henrikjoreteg).

## license

MIT

