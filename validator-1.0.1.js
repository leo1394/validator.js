function defineValidator(window,$,VldRulesLib,limiter){
    /*
     *validator.js 表单验证器
     *@author：maxiupeng
     *@date:2013-8-1
     */

    /* 获取光标位置插件 */
    jQuery.fn.getCursorPosition = function() {
        if (this.lengh == 0) return -1;
        return $(this).getSelectionStart();
    };
    jQuery.fn.setCursorPosition = function(position) {
        if (this.lengh == 0) return this;
        return $(this).setSelection(position, position);
    };
    jQuery.fn.getSelection = function() {
        if (this.lengh == 0) return -1;
        var s = $(this).getSelectionStart();
        var e = $(this).getSelectionEnd();
        return this[0].value.substring(s, e);
    };
    jQuery.fn.getSelectionStart = function() {
        if (this.lengh == 0) return -1;
        input = this[0];

        var pos = input.value.length;

        if (input.createTextRange) {
            var r = document.selection.createRange().duplicate();
            r.moveEnd('character', input.value.length);
            if (r.text == '')
                pos = input.value.length;
            pos = input.value.lastIndexOf(r.text);
        } else if (typeof(input.selectionStart) != "undefined")
            pos = input.selectionStart;

        return pos;
    };
    jQuery.fn.getSelectionEnd = function() {
        if (this.lengh == 0) return -1;
        input = this[0];

        var pos = input.value.length;

        if (input.createTextRange) {
            var r = document.selection.createRange().duplicate();
            r.moveStart('character', -input.value.length);
            if (r.text == '')
                pos = input.value.length;
            pos = input.value.lastIndexOf(r.text);
        } else if (typeof(input.selectionEnd) != "undefined")
            pos = input.selectionEnd;

        return pos;
    };
    jQuery.fn.setSelection = function(selectionStart, selectionEnd) {
        if (this.lengh == 0) return this;
        input = this[0];

        if (input.createTextRange) {
            var range = input.createTextRange();
            range.collapse(true);
            range.moveEnd('character', selectionEnd);
            range.moveStart('character', selectionStart);
            range.select();
        } else if (input.setSelectionRange) {
            input.focus();
            input.setSelectionRange(selectionStart, selectionEnd);
        }

        return this;
    };

    /* 定时器检验间隔 */
    var CHECK_INTERVAL = 100;

    /* Vld命名空间 */
    var Vld = {};
    Vld.Util = {};

    /* 默认参数 */
    Vld.defaults = {
        version: "1.0.1", //版本号
        vldOnBlur: false, //元素失去焦点时验证
        checkOnError: true, //当前input内的数据不合法时自动验证数据
        focus1stErr:true,//发生错误时第一个错误input获取焦点
        timer: true, //是否使用定时器验证，若否，使用keydown和onpaste代替
        errorFiled: null, //集中显示错误信息的区域。
        errorClass: "", //错误时input标签应用的css样式
        errorLocClass: "", //错误时错误提示标签应用的样式，如show
        errTipTpl: "<div class='errorTip' style='z-index:10;"
                    + "position:absolute;'>{{message}}</div>", //错误Tip模板,absolute定位
        tipDir: "right", //错误tip的显示位置，可选up,down left,right,关闭tip的话设置为false
        tipOffset: null, //错误tip显示位置的偏移量，需要包含left和top
        defaultMsg: "输入有误，请重新输入", //默认的错误提示信息
        parent: "body", //父节点$selector,为空的话自动指定为body
        revisedVal: false /* 动态验证时使用修正后的值替换错误值，若为false，
                             则使用上一次保存的值替换错误值。
                             注:上一次保存的值不一定是正确值
                          */
    }

    /* 设置默认参数 */
    Vld.setDefaults = function(opts){
        Vld.defaults = $.extend(true,Vld.defaults,opts);
    };

    /*
     * validator 定义
     * @param:validations {array}  应用到当前form中所有field的规则
     *                                 eg:[{
                                       field:'userName',
                                       rule:'required',
                                       msg:'userName is required!',
                                       errorLoc:'error_username',
                                       dynamicVld:true
                                    },{
                                        ...
                                    }]
     * @param:opts {object}        选项
     */
    Vld.Validator = function(validations, opts) {
        if (!validations || !validations.length) 
        {
            throw new Error("参数错误");
            return;
        }
            
        var me = this;
        me.opts = $.extend(true,{}, Vld.defaults, opts);
        me.dynamicVlds = []; //需要动态验证的validation列表
        me.validations = []; //validations的副本
        $.each(validations,function(index,val){
            me.validations.push($.extend(true,{},val));
        });
        me._init();
    };

    /*
     * 启动
     */
    Vld.Validator.prototype._init = function() {
        /* 映射实例变量为局部变量 */
        var me = this;
        var opts = me.opts;
        var dynamicVlds = me.dynamicVlds;
        var validations = me.validations;

        opts.$errorField = $(opts.errorField);

        opts.$parent = $(opts.parent);

        /* jQuery元素拆分
         * 对不唯一对应一个DOM元素的$对象，将所有子对象添加到validation的children下面
         */
        var newValidations = [];
        for(var i = 0; i < validations.length; i++){
            if($(validations[i].field).length > 1){
                var children = [];
                $.each($(validations[i].field),function(index,val){
                    var newValidation = $.extend(true,{},validations[i],{
                        field: $(val),
                        derivedFrom: validations[i]
                    });
                    newValidations.push(newValidation);
                    children.push(newValidation);
                });
                validations[i].children = children;
                // validations.shift()
                // opts.deleted.push(validations[i]);
            } else {
                newValidations.push(validations[i]);
            }
        }

        //originalValidations 与 validations存在映射关系
        me.originalValidations = validations; //originalValidations用于最后统计结果
        me.validations = newValidations; //validations用于验证
        validations = me.validations;

        /* 设置limiter、passed属性、checked属性、$el、$errorLoc、动态验证、记录光标位置 */
        for (var i = 0; i < validations.length; i++) {
            validations[i].passed = true;

            /* 记录是否被检验过 */
            validations[i].checked = false;

            /* 设置$el */
            validations[i].$el = $(validations[i].field);

            /* 设置$errorLoc */
            validations[i].$errorLoc = $(validations[i].errorLoc);
            
            /* 设置limiter */
            var limiter = limiter ? limiter : undefined;
            if (limiter && validations[i].limiter) {
                validations[i].$el.limiter(validations[i].limiter);
            }

            /* 设置动态验证 */
            if(validations[i].dynamicVld){
                dynamicVlds.push(validations[i]);
            }
            
            /* 绑定input的onblur */
            if (opts.vldOnBlur) {
                validations[i].$el.on("blur", {
                    vld: validations[i]
                }, function(e){
                    me._check(e.data.vld);
                });
            }

            /* 设置光标位置记录器 */
            if(!opts.revisedVal){
                me._initPosition(validations[i]);
            }
        }
        
        /* 设置定时器和动态验证 */
        if (opts.timer) {
            //动态验证的定时器
            if (dynamicVlds.length != 0) {
                setInterval(function() {
                    for (var i = 0; i < dynamicVlds.length; i++) {
                        me._dynamicCheck(dynamicVlds[i]);
                    }
                }, CHECK_INTERVAL);
            }
            //出错时检验的定时器
            if (opts.checkOnError) {
                setInterval(function() {
                    for (var i = 0; i < validations.length; i++) {
                        if (validations[i].onError) { //onError专用于定时验证,不用passed是为了焦点不离开输入框时不取消定时器
                            me.validate(validations[i]);
                        }
                    }
                }, CHECK_INTERVAL);
            }
        } else { //keydown和paste代替timer
            //动态验证
            for (var i = 0; i < validations.length; i++) {
                if (validations[i].dynamicVld) {
                    me._initDynamicVld(validations[i]);
                }
            }
            //出错时检验在error()中设置
        }     
    };

    /*
     * 初始化动态验证
     */
    Vld.Validator.prototype._initDynamicVld = function(vld){
        var me = this;
        if($.browser.msie){//IE
            vld.$el.on("keydown", {vld: vld}, function(e) {
                setTimeout(function() {
                    me._dynamicCheck(e.data.vld);
                }, 0);
            });
        } else {//非IE
            vld.$el.on("input", {vld: vld}, function(e) {
                setTimeout(function() {
                    me._dynamicCheck(e.data.vld);
                }, 0);
            }); 
        }
        vld.$el.on("paste", {vld: vld}, function(e){
            setTimeout(function(){
                me._dynamicCheck(e.data.vld);
            }, 0);
        });
    };

    /* 
     * 设置光标位置记录器
     */
    Vld.Validator.prototype._initPosition = function(vld){
        var me = this;
        if($.browser.msie){//IE
            vld.$el.on("keydown", {vld: vld}, function(e) {
                setTimeout(function() {
                    vld.oldPosition = vld.$el.getCursorPosition();
                }, 0);
            });
        } else {//非IE
            vld.$el.on("input", {vld: vld}, function(e) {
                setTimeout(function() {
                    vld.oldPosition = vld.$el.getCursorPosition();
                }, 0);
            }); 
        }
    }

    /*
     * 动态验证,方便callee识别
     */
    Vld.Validator.prototype._dynamicCheck = function(vld){
        this.validate(vld);
    };

    /*
     * 用于绑定单个input的blur、change事件
     */

    Vld.Validator.prototype._check = function(vld) {
        if(vld.onError){
            vld.onError = false;
        }
        return this.validate(vld);
    };

    /* 是否所有的validation都被检验过 */
    Vld.Validator.prototype._allChecked = function(){
        for(var i = 0; i < this.validations.length; i++){
            if(!this.validations[i].checked){
                return false;
            }
        }
        return true;
    }

    /*
     * 验证结果列表
     */
    Vld.Validator.prototype.results = function getResults(validations){
        validations = validations ? validations : this.originalValidations;
        var results = [];
        $.each(validations,function(index,val){
            if(val.children){
                var subResults = getResults(val.children);
                var result = {
                    field: val.field,
                    passed: true,
                    rules: val.rules,
                    detail: "该field包含多个DOM元素，查看childrenResults",
                    childrenResults: subResults
                };
                for(var i = 0; i < subResults.length; i++){
                    if(!subResults[i].passed){
                        result.passed = false;
                        break;
                    }
                }
            } else {
                var result = {
                    field: val.field,
                    passed: val.passed,
                    rules: val.rules,
                    details: val.details
                }
            }
            results.push(result);
        });
        return results;
    };

    /*
     * 验证是否通过
     */
    Vld.Validator.prototype.isPassed = function() {
        if(!this._allChecked()){
            throw new Error("存在未被检验过的input，可手动调用validateAll()以保证全部被检验过");
            return null;
        }
        var results = this.results();
        for(var i = 0; i < results.length; i++){
            if(!results[i].passed){
                return false;
            }
        }
        return true;
    };


    /*
     * 验证全部field
     */
    Vld.Validator.prototype.validateAll = function() {
        var validations = this.validations;
        var flag = true;
        for (var i = 0; i < validations.length; i++) {
            var result = this.validate(validations[i]);
            flag = result == false ? false : flag;
        }

        //第一个错误标签获得焦点
        if(this.opts.focus1stErr && !flag){
            for (var i = 0; i < validations.length; i++) {
                if (validations[i].passed == false) {
                    validations[i].$el.focus();
                    return false;
                }
            }
        }

        return flag;
    };

    /*
     * 验证单个field
     * @param validation {object} 验证规则
     */

    Vld.Validator.prototype.validate = function(validation) {
        /* 映射实例变量为局部变量 */
        var me = this;
        var opts = me.opts;
        var dynamicVlds = me.dynamicVlds;
        var validations = me.validations;
        var msg = validation.msg ? validation.msg : (opts.defaultMsg ? opts.defaultMsg : "");
        var field = validation.field;
        var errorLoc = validation.$errorLoc;
        var $el = validation.$el;
        var input = validation.$el[0];
        var value = input.value;
        var result;

        validation.checked = true;

        //自定义函数验证
        if (typeof validation.rule == "function") {
            var result = validation.rule();
            if (result) {
                ok();
            } else {
                error();
            }
            return result;
        }

        //正则表达式验证
        if (validation.rule.constructor == RegExp) {
            var result = validation.rule.test(value);
            validation.rule.lastIndex = 0;
            if (result) {
                ok();
            } else {
                error();
            }
            return result;
        }

        //普通验证
        var rule = validation.rule;
        var reg = /\[\$\((.+)\)\]/g;
        if(reg.test(rule)){
            rule = rule.replace(reg,function(matched,val,index,original){
                return $(val).val();
            });
        }


        //验证
        result = VldRulesLib.validate(value, rule);

        validation.details = result.details;
        validation.passed = result.passed;
        validation.rules = result.rules;

        //是否动态验证
        var dynamic = arguments.callee.caller == me._dynamicCheck;
        
        if(validation.passed == true){
            ok();
            return true;
        } else {
            error();
            return false;
        }

        //验证成功后执行的操作

        function ok() {
            //记录最后一次正确的值和光标位置
            validation.oldVal = validation.$el.val();

            if (errorLoc) {
                errorLoc.html("");
                if(opts.errorLocClass){
                    errorLoc.removeClass(opts.errorLocClass);
                }else{
                    errorLoc.hide();
                }
            }
            if(validation.errTipSet){
                validation.errTipSet.remove();
            }
            $el.removeClass(opts.errorClass);

            me._showInErrorField();
        }

        //验证失败后执行的操作

        function error() {
            var offsetLeft = validation.tipOffset && validation.tipOffset.left ? validation.tipOffset.left : 0;
            var offsetTop = validation.tipOffset && validation.tipOffset.top ? validation.tipOffset.top : 0;
            var tipDir = validation.tipDir;
            
            //动态验证设置input值
            if(dynamic){
                if(opts.revisedVal){ //使用revisedVal的值进行替换
                    validation.$el.val(result.revisedVal);
                    if(me.validate(validation)){ //再次验证替换后的值
                        return;
                    }
                } else { //使用oldValue
                    if(result.revisedVal != value){ //验证方法具有可替换性
                        validation.$el.val(validation.oldVal);
                        validation.$el.setCursorPosition(validation.oldPosition - 1);
                        if(me.validate(validation)){ //再次验证替换后的值
                            return;
                        }
                    } else { //不具有可替换性，将错误值设置为oldvalue
                        validation.oldVal = value;
                    }
                }
            }

            validation.onError = true; //在onblur中设置
            if (errorLoc) {
                validation.$errorLoc.html(msg);
                if(opts.errorLocClass){
                    validation.$errorLoc.addClass(opts.errorLocClass);
                }else{
                    validation.$errorLoc.show();
                }
            } 
            $el.addClass(opts.errorClass);

            //出错后检验
            if(opts.checkOnError && !opts.timer && !validation.binded && !validation.dynamicVld){
                validation.binded = true;
                if($.browser.msie){//IE
                    $el.on("keydown", {vld: validation}, function(e) {
                        setTimeout(function() {
                            me.validate(e.data.vld);
                        }, 0);
                    });
                } else {//非IE
                    $el.on("input", {vld: validation}, function(e) {
                        setTimeout(function() {
                            me.validate(e.data.vld);
                        }, 0);
                    });
                }
                $el.on("paste", {vld: validation}, function(e) {
                    setTimeout(function() {
                        me.validate(e.data.vld);
                    }, 0);
                });
            }

            if ((tipDir && tipDir != "none") || (opts.tipDir && opts.tipDir != "none")) {
                if(validation.errTipSet){
                    validation.errTipSet.remove();
                }
                var errTip = $(opts.errTipTpl.replace("{{message}}",msg));
                opts.$parent.append(errTip);
                Vld.Util.setTipLoc($el, errTip, tipDir, offsetLeft, offsetTop, opts);
                validation.errTipSet = errTip;
            }

            me._showInErrorField();
        }
    };




    /*
     * 集中显示错误信息
     */

    Vld.Validator.prototype._showInErrorField = function() {
        var me = this;
        var errorMsg = [];
        $.each(me.validations,function(index,val){
            if(!val.passed){
                var msg = val.msg ? val.msg : (me.opts.defaultMsg ? me.opts.defaultMsg : "");
                if(msg != ""){
                    errorMsg.push(msg);
                }
            }
        });
        me.opts.$errorField.html(errorMsg.join("<br/>"));
    };

    /*
     * 获取元素位置
     * @param elmId {string}   元素id
     * @return result {object} 包含left,top,width,height
     */

    Vld.Util.getElmLoc = function($el) {
        var result = {};
        var elm = $el;
        // result["left"] = elm[0].offsetLeft;
        // result["top"] = elm[0].offsetTop;
        // result["width"] = elm[0].offsetWidth;
        // result["height"] = elm[0].offsetHeight;

        //通过jQuery获取的有问题,宽度4个像素偏差，高度6个像素偏差
        result["left"] = elm.offset().left;
        result["top"] = elm.offset().top;
        result["width"] = elm.width()+4;
        result["height"] = elm.height()+6;

        return result;
    };

    /*
     * 设置error tip的位置
     * @param:elmId {string}  目标input的ID
     * @param:tip   {$obj}    提示tip的$元素
     * @param:tipDir {string} tip位置,up,down,left,right之一
     * @param:left   {number} 单个tip标签的左侧偏移量
     * @param:top    {number} 单个tip标签的上方偏移量
     */

    Vld.Util.setTipLoc = function($el, tip, tipDir, left, top, opts) {
        if(opts == null||opts == undefined){
            opts = {
                tipDir:null,
                tipOffset:null
            };
        }
        if (!opts.tipDir && !tipDir) return;
        var elmLoc = Vld.Util.getElmLoc($el);
        var tipWidth = tip[0].offsetWidth;
        var tipHeight = tip[0].offsetHeight;
        var result = {};
        var offsetTop = (opts.tipOffset && opts.tipOffset.top ? opts.tipOffset.top : 0) + (top ? top : 0);
        var offsetLeft = (opts.tipOffset && opts.tipOffset.left ? opts.tipOffset.left : 0) + (left ? left : 0);
        var dir = tipDir ? tipDir : opts.tipDir;
        if (dir == "up") {
            result["top"] = elmLoc["top"] - tipHeight + offsetTop;
            result["left"] = elmLoc["left"] + offsetLeft;
        } else if (dir == "left") {
            result["top"] = elmLoc["top"] + (elmLoc["height"] - tipHeight) / 2 + offsetTop;
            result["left"] = elmLoc["left"] - tipWidth + offsetLeft;
        } else if (dir == "down") {
            result["top"] = elmLoc["top"] + elmLoc["height"] + offsetTop;
            result["left"] = elmLoc["left"] + offsetLeft;
        } else if (dir == "right") {
            result["top"] = elmLoc["top"] + (elmLoc["height"] - tipHeight) / 2 + offsetTop;
            result["left"] = elmLoc["left"] + elmLoc["width"] + offsetLeft;
        } else if(dir == "none"){
            return;
        } else {
            throw new Error("tipDir设置错误！")
            return;
        }
        tip.offset(result);
    };


    //获取元素的z-index坐标
    Vld.Util.getZIndex = function($elm){
        if($elm[0].tagName.toLowerCase() == "body"){
            return 1;
        }
        var z = $elm.css("z-index");
        if(z == "auto") {
            z = Vld.Util.getZIndex($elm.parent());
        }
        return z;
    };

    /* jQUery插件声明 */
    $.Validator = Vld.Validator;

    /* Validator声明 */
    window.Validator = Vld.Validator;
    window.ValidatorDefaults = Vld.setDefaults;

    /**********************************************************************/

    /*
     * 单个input验证
     */

    $.fn.validator = function(validation){
        validation.field = this;
        var vld = new $.Validator([validation],validation);
        return this;
    };

    
}

if(typeof define == "function"){
    define("Validator",function(require,exports,module){
        require("jquery");
        require("VldRulesLib");
        var limiter = require("limiter");

        defineValidator(window,$,VldRulesLib,limiter);

        module.exports = Validator;
    });
} else {
    var limiter = limiter ? limiter : null

    defineValidator(window,$,VldRulesLib,limiter);
}

