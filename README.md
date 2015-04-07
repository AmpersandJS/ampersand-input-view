# ampersand-input-view

Lead Maintainer: [Christopher Dieringer (@cdaringe)](https://github.com/cdaringe)

## Purpose
A view module for intelligently rendering and validating input. Works well with [ampersand-form-view](https://github.com/AmpersandJS/ampersand-form-view).

It does the following:

- Automatically shows/hides error messages based on tests
- Will not show error messages pre-submit, or if it's never had a valid value. This lets people tab-through a form without triggering a bunch of error messages.
- Live-validates, to always report if in valid state. But only shows messages when sane to do so.
- Only shows first failed message. Then, as the user corrects, updates and validates against all tests, showing appropriate message, until all tests pass.

It's built on [ampersand-view](https://github.com/AmpersandJS/ampersand-view), so you can use it with `extend` as expected.


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

Since this view is based on [ampersand-state](http://ampersandjs.com/docs#ampersand-state), it can be extended in the same way.

To create an **`InputView`** class of your own, you extend **`AmpersandInputView`** and provide instance properties and options for your class. Here, you will typically pass any properties (`props`, `session`, and `derived`) of your state class, and any methods to be attached to instances of your class.

**Note:** If you want to add **`initialize()`**, remember that it’s overriding InputView’s own `initialize()`. Thus, you should call the parent's `initialize()` manually:


```javascript
var AmpersandInputView = require('ampersand-input-view');

var MyCustomInput = AmpersandInputView.extend({
    initialize: function () {
        // call its parent's initialize manually
        AmpersandInputView.prototype.initialize.apply(this, arguments);

        // do whatever else you need to do on init here
    }
});
```


### constructor/initialize `new AmpersandInputView([opts])`

When creating an instance of an `InputView`, you can pass in the initial values of the **attributes** which will be [`set`](http://ampersandjs.com/docs#ampersand-state-set) on the state. Unless [`extraProperties`](#amperand-state-extra-properties) is set to `allow`, you will need to have defined these attributes in `props` or `session`.


#### opts

- `tests` (default: `[]`): test function to run on input (more below).
- `name`: the input's `name` attribute's value. Used when reporting to parent form.
- `type` (default: `'text'`): input type to use, can be any valid HTML5 input type.
- `value`: initial value for the `<input>`.
- `template`: a custom template to use (see 'template' section, below, for more).
- `placeholder`: (optional) “placeholder text” for the input.
- `el`: (optional) element if you want to render it into a specific exisiting element pass it on initialization.
- `required` (default: `true`): whether this field is required or not.
- `requiredMessage` (default: `'This field is required'`): message to use if required and empty.
- `validClass` (default: `'input-valid'`): class to apply to input if valid (see below for customizing where this is applied).
- `invalidClass` (default: `'input-invalid'`): class to apply to input if invalid (see below for customizing where this is applied).
- `parent`: a View instance to use as the `parent` for this input. If your InputView is in a FormView, this is automatically set for you.
- `beforeSubmit`: function called by [ampersand-form-view](https://github.com/AmpersandJS/ampersand-form-view) during submit. By default this runs the tests and displays error messages.


### render `inputView.render()`

Renders the inputView. This is called automatically if your inputView is used within a parent [ampersand-form-view](https://github.com/ampersandjs/ampersand-form-view).

### template `inputView.template`

This can either be customized by using `extend`, or by passing in a `template` on instantiation.

It can be a function that returns a string of HTML or DOM element—or just an plain old HTML string.

But whatever it is, the resulting HTML should contain the following hooks:

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

If you pass `value` on instantiation, it will be set on the `<input>` element (and also tracked as `startingValue`).

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

### Customizing the view

#### Custom calculated output `value`

If you need to decouple what the user puts into the form from the resulting value, you can do that by overriding the `value` derived property.

For example, consider a validated address input. You may have a single text input for address, which you can attempt to match to a real known address with an API call. So, you have a single `<input>`, but you want the inputView’s `value` to be an object returned from that API.

Do it by overriding the `value` derived property as follows:

```javascript
var VerifiedAddressInput = AmpersandInputView.extend({
    initialize: function () {
        // call parent constructor
        AmpersandInputView.prototype.initialize.apply(this, arguments);

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

#### Setting valid/invalid classes
By default, `validClass` and `invalidClass` are set on either the `input` or `textarea` in the rendered template.  This is done via a `validityClassSelector` property that is used to find the elements to apply either `validClass` or `invalidClass`. You can set `validityClassSelector` to have this class applied anywhere you need in your rendered template

For instance, this would set the class on the root label instead:

```javascript:
var CustomInput = InputView.extend({
    validityClassSelector: 'label'
});
```

And this would set it on the root label and the message element
```javascript:
var CustomInput = InputView.extend({
    validityClassSelector: 'label, [data-hook=message-text]'
});
```

### tests `InputView.extend({ tests: [test functions] });` or `new InputView({ tests: [] })`

You can provide tests inside `extend`, or passed them in for `initialize`.

This should be an array of test functions. The test functions will be called with the context of the inputView, and receive the input `value` as the argument.

The tests should return an error message if invalid, and return a falsy value otherwise (or, simply not return at all).

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

**Note:** You can still do `required: true` and pass tests. If you do, it will check if it's not empty first, and show the `requiredMessage` error if it is.

Remember that the inputView will only show one error per field at a time. This is to minimize annoyance. We don't want to show “this field is required” and every other error if they just left it empty. We just show the first one that fails, then when they go to correct it, it will update to reflect the next failed test (if any).


### setValue `inputView.setValue([value], [skipValidation|bool])`

Setter for value that will fire all appropriate handlers/tests. Can also be done by user input or setting value of `input` manually.

Passing `true` as second argument will skip validation. This is mainly for internal use.

#### Setting input.value on non-user input
This module assumes that the value of the input element will be set by the user.  This is the only event that can be reliably listened for on an input element.  If you have a third-party library (i.e. Bootstrap or jQuery) that is going to be affecting the input value directly you will need to let your model know about the change via `setValue`.

```javascript
var myInput = new InputView({
    name: 'date'
});
myInput.render();
document.body.appendChild(myInput.el);

$('[name=address]').datepicker({
    onSelect: function (newDate) {
        myInput.setValue(newDate);
    }
});

```

### reset `inputView.reset()`

Set value to back original value. If you passed a `value` when creating the view it will reset to that, otherwise to `''`.


### clear `inputView.clear()`

Sets value to `''` no matter what previous values were.

## gotchas
- Some browsers do not always fire a `change` event as expected.  In these [rare cases](https://github.com/AmpersandJS/ampersand-input-view/issues/2), validation may not occur when expected.  Validation *will occur* regardless on form submission, specifically when this field's `beforeSubmit` executes.

## changelog
- 4.0.5
 - Handle uncaught input value changes beforeSubmit
 - Add view convention tests, and update to pass them
- 4.0.0
 - Remove `rootElementClass` in favor of a better validityClass selector
 - Listen to `change` instead of `blur` event
 - Reset error message state on `clear()` and `reset()`
 - Allow `beforeSubmit` to be defined on initialization
- 3.1.0 - Add [ampersand-version](https://github.com/ampersandjs/ampersand-version) for version tracking.
- 3.0.0 - Add API reference docs. Add `.clear()`, `.reset()` methods. Make `value` derived property. Fix #21 validity class issue.
- 2.1.0 - Can now set `rootElementClass`. Add reset function #15. Allow setting `0` as value #17.
- 2.0.2 - Make sure templates can be passed in, in constructor.

## credits

Created by [@HenrikJoreteg](http://twitter.com/henrikjoreteg).

## license

MIT

