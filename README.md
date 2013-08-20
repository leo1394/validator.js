#Introduction to Validator.js
Last updated:8/20/2013 by Maxiupeng(RocShow)

Dependence Libraries:

jQuery

VldRulesLib.js https://github.com/RocShow/VldRulesLib

##Brief Introduction
Just as its name implies, Validator.js wraps some common functions used for validating user input. Aimming at simple using, Validator.js provide some clear and simple interfaces.

##Features
1. Dynamically Validating. Listen to users' input on real-time and dynamically validate.

2. AUtomatically Revising. Revise error input reasonably according to different validation rules.

3. Switching between timer and event binding. User can choose time or event handler to trigger validation.

4. Detailed Validation Results Exhibition. For the condition of multi validation rules, detailed results of each validation rule will be returned. 

5. Thirty-one kinds of integrated rules. 

6. Allowing extend new rules

7. Receiving custom functions or regular expressions as validation rules.

##How to use
An example of traditional usage is as following:
```js
vld = new Validator([{
            field: "#text1",
            rule: ["required","max[10]"],
            msg: "This field is required.",
            tipDir: "left",
            tipOffset: {
                left: -50,
            },
            dynamicVld: true
        }, {
            field: "#text2",
            rule: ["min[3]","max[10]"],
            msg: "The input length must be between 3 and 10",
            tipOffset: {
                left: 50,
            },
            dynamicVld: true
        }], {
            vldOnBlur: true,
            errorField: "#errField",
            errorClass: "error",
            tipDir: "right",
            tipOffset: {
                left: 5,
            },
            timer: false,
            parent: $(".outer").first(),
            autoRevise: true
        });
```

#### Validator Constructor

The constructor of Validator requires two parameters: the first one is an array, which represents the collection of the validation rules, the second one is the an js object, which represents the global settings.
	
#### Options for the array, the first parameter.
Each element of the array must obey the following format:
```js
{
    field: '', //input which needs to be validated
    rule: [], //rule for the validation.Type of Array.Each element must be string and obey this format: ruleName[parameter]
    msg: '', //error message for false validation
    tipDir:'', //location of the error tip, must be one of "up,down,left,right"
    tipOffset: {
        left: '', //left offset to the original location of error tip
        top: '' //top offset to the original location of error tip
    },
    limiter: {
        //the settings for limiter.js
    },
    dynamicVld: boolean //whether trigger dynamic validation or not
    
}
```
Of course you can skip some options. The default value will be used. But you must indicate two fields at least: field and rule.
	
#### Options and default value for the second parameter
```js
{
    //version code
    version: "1.0.2", 

    //when the input label lose its focus, its own validation will be triggered
    vldOnBlur: false, 

    //Once one input field was validated as faulty, it will be checked dynamically. 
    checkOnError: true, 

    //When there are several faulty inputs fields, the first one will be focused. 
    focus1stErr:true,

    //Use time or event handler to trigger validation
    timer: true,

    //id of a DOM element which will show all the error messages 
    errorFiled: null, 

    //CSS class name which will be applied to the input label when the validation fails
    errorClass: "", 

    //CSS class name which will be applied to the errorLoc
    errorLocClass: "", 

    //template for error tip
    errTipTpl: "<div class='errorTip' style='z-index:10;"
                + "position:absolute;'>{{message}}</div>",

    //location of the error tip, must be one of "up,down,left,right"
    tipDir: "right",

    //offset to the original location of error tip, must contains "left" and "top" fields
    tipOffset: null, 

    //default error msg 
    defaultMsg: "Error Input.",

    //Parent node of the input fields of validations
    parent: "body", 

    //For the dynamic validations, use the revised value or last value to replace the wrong value. If this option is set as true, revised value will be used, otherwise, last value will be used.
    //Notice: last value may not be correct as well.
    autoRevise: false
}
```
You can skip all options here, because every field has its default value.

By calling `vld.isPassed()` to check whether all the validations are passed.

By calling `vld,results()` to get the detailed results.

By calling `vld.revise()` to manually revise.

Besides timer and event can trigger validation, validation can be called by calling `vld.validateAll()` or `vld.validateOne(index)`.

## API

####window.ValidatorDefaults(opts)
@param opts string

Global settings

####window.Validator(validations,opts)

As described previously

####Validator.results()
@return [] detailed validation results

####Validator.isPassed()
@return boolean whether all validations are passed or not

####Validator.validateAll()
@return boolean whether all validations are passed or not

trigger all validations manually

####Validator.revise()
@return boolean whether all validations are passed or not after revising

manually revise, then validate all

####Validator.validateOne(index)
@param index integer index of validation in the set of validations

validate one validation manually, given by index

## validate single input field
$obj.validator(validation)
