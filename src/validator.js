/* 定时器检验间隔 */
var CHECK_INTERVAL = 100;

/* 默认参数 */
var defaults = {
    version: "1.0.2", //版本号
    vldOnBlur: false, //元素失去焦点时验证
    checkOnError: true, //当前input内的数据不合法时自动验证数据
    focus1stErr:true,//发生错误时第一个错误input获取焦点
    timer: true, //是否使用定时器验证，若否，使用事件绑定代替
    errorFiled: null, //集中显示错误信息的区域。
    errorClass: "", //错误时input标签应用的css样式
    errorLocClass: "", //错误时错误提示标签应用的样式，如show
    errTipTpl: "<div class='errorTip' style='z-index:10;"
                + "position:absolute;'>{{message}}</div>", //错误Tip模板,absolute定位
    tipDir: "right", //错误tip的显示位置，可选up,down left,right,设置为false可关闭tip
    tipOffset: null, //错误tip显示位置的偏移量，需要包含left和top
    defaultMsg: "输入有误，请重新输入", //默认的错误提示信息
    parent: "body", //父节点$selector,为空的话自动指定为body
    autoRevise: false /* 动态验证时使用修正后的值替换错误值，若为false，
                         则使用上一次保存的值替换错误值。
                         注:上一次保存的值不一定是正确值，
                         有些错误时没有办法自动修正的，比如email错误
                      */
}

/* 设置默认参数 */
var setDefaults = function(opts){
    defaults = $.extend(true,defaults,opts);
};

/*
 * validator 定义
 * @param:validations {array}  应用到当前form中所有field的规则
 *                                 eg:[{
                                   field:'userName',
                                   rule:['required'],
                                   msg:'userName is required!',
                                   errorLoc:'error_username',
                                   dynamicVld:true
                                },{
                                    ...
                                }]
 * @param:opts {object}        选项
 */
var Validator = function(validations, opts) {
    if (!validations || !validations.length) 
    {
        throw new Error("参数错误");
        return;
    }
        
    var me = this;

    me.opts = $.extend(true,{}, defaults, opts);

    me.validations = []; //validations的副本
    $.each(validations,function(index,val){
        me.validations.push($.extend(true,{},val));
    });

    me._init();
};

/*
 * 启动
 */
Validator.prototype._init = function() {
    /* 映射实例变量为局部变量 */
    var me = this,
        opts = me.opts,
        dynamicVlds = me.dynamicVlds = [],//需要动态验证的validation列表
        validations = me.validations;

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
        } else {
            newValidations.push(validations[i]);
        }
    }

    //originalValidations 与 validations存在映射关系,可以互相找到对方
    me.originalValidations = validations; //originalValidations用于最后统计结果
    me.validations = newValidations; //validations用于验证
    validations = me.validations;

    /* 设置limiter、passed属性、checked属性、$el、$errorLoc、动态验证、记录光标位置 */
    for (var i = 0; i < validations.length; i++) {
        /* 是否通过验证 */
        validations[i].passed = true;

        /* 记录是否被检验过 */
        validations[i].checked = false;

        /* 设置$el,field对应的jQuery对象 */
        validations[i].$el = $(validations[i].field);

        /* 设置$errorLoc */
        validations[i].$errorLoc = $(validations[i].errorLoc);
        
        /* 设置limiter */
        if (validations[i].limiter) {
            validations[i].textLimiter = new Limiter(validations[i].$el
                ,$.extend(true, {}, defaults.limiter, opts.limiter, validations[i].limiter));
        }

        /* 记录是否需要动态验证 */
        if(validations[i].dynamicVld){
            dynamicVlds.push(validations[i]);
        }
        
        /* 绑定input的onblur */
        if (opts.vldOnBlur) {
            validations[i].$el.on("blur", {
                vld: validations[i]
            }, function(e){
                me._check(e.data.vld);
                if(me.textLimiter){
                    me.textLimiter.count();
                }
            });
        }
    }
    
    /* 自动触发:使用定时器还是事件绑定 */
    if (opts.timer) { //使用定时器
        //动态验证的定时器
        if (dynamicVlds.length != 0) {
            setInterval(function() {
                for (var i = 0; i < dynamicVlds.length; i++) {
                    me._dynamicCheck(dynamicVlds[i]);
                    if(dynamicVlds[i].limiter){
                        dynamicVlds[i].textLimiter.count();
                    }
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
                    if(validations[i].limiter){
                        validations[i].textLimiter.count();
                    }
                }
            }, CHECK_INTERVAL);
        }

        /* limiter更新 */
        for (var i = 0; i < validations.length; i++) {
               (function(lockedIndex){          
                   if (validations[i].textLimiter) {               
                        validations[i].$el.on("keydown, paste, blur, input", function(){
                                                validations[lockedIndex].textLimiter.count();
                        });
                   }
                 })(i);               
          }
    } else { //使用事件绑定
        for (var i = 0; i < validations.length; i++) {
            if($.browser.msie){ //IE
                //绑定keydown事件
                validations[i].$el.on("keydown", {vld:validations[i]}, function(e){
                    setTimeout(function(){
                        var vld = e.data.vld;

                        //设置光标位置记录器
                        vld.oldPosition = Util.getCursorPosition(vld.$el);

                        //设置动态验证
                        if(vld.dynamicVld){
                            me._dynamicCheck(e.data.vld);
                        }

                        //出错后检验
                        if(opts.checkOnError && vld.onError){
                            me.validate(vld);
                        }

                        //更新limiter
                        if(vld.textLimiter){
                            vld.textLimiter.count();
                        }
                    },0);
                });
            } else {
                //绑定input事件
                validations[i].$el.on("input", {vld:validations[i]}, function(e){
                    setTimeout(function(){
                        var vld = e.data.vld;

                        //设置光标位置记录器
                        vld.oldPosition = Util.getCursorPosition(vld.$el);

                        //设置动态验证
                        if(vld.dynamicVld){
                            me._dynamicCheck(e.data.vld);
                        }

                        //出错后检验
                        if(opts.checkOnError && vld.onError){
                            me.validate(vld);
                        }

                        //更新limiter
                        if(vld.textLimiter){
                            vld.textLimiter.count();
                        }
                    },0);
                });
            }

            //绑定paste事件
            validations[i].$el.on("paste", {vld:validations[i]}, function(e){
                setTimeout(function(){
                    var vld = e.data.vld;

                    //设置动态验证
                    if(vld.dynamicVld){
                        me._dynamicCheck(e.data.vld);
                    }

                    //出错后检验
                    if(opts.checkOnError && vld.onError){
                        me.validate(vld);
                    }

                    //更新limiter
                    if(vld.textLimiter){
                        vld.textLimiter.count();
                    }
                },0);
            });
        }
    }     
};

/*
 * 动态验证,方便callee识别
 */
Validator.prototype._dynamicCheck = function(vld){
    this.validate(vld);
};

/*
 * 单个input的blur事件handler
 */

Validator.prototype._check = function(vld) {
    if(vld.onError){
        vld.onError = false;
    }
    return this.validate(vld);
};

/* 是否所有的validation都被检验过 */
Validator.prototype._allChecked = function(){
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
Validator.prototype.results = function getResults(validations){
    validations = validations ? validations : this.originalValidations;
    var results = [];
    $.each(validations,function(index,val){
        if(val.children){ //children为jQuery对象拆分后的子规则
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
Validator.prototype.isPassed = function() {
    if(!this._allChecked()){ //确保所有的规则都被至少检验过一次
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
Validator.prototype.validateAll = function() {
    var validations = this.validations,
        flag = true;
    for (var i = 0; i < validations.length; i++) {
        var result = this.validate(validations[i]);
        flag = result.passed == false ? false : flag;
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

Validator.prototype.validate = function(validation) {
    /* 映射实例变量为局部变量 */
    var me = this,
        opts = me.opts,
        dynamicVlds = me.dynamicVlds,
        validations = me.validations,
        msg = validation.msg ? validation.msg : (opts.defaultMsg ? opts.defaultMsg : ""),
        field = validation.field,
        errorLoc = validation.$errorLoc,
        $el = validation.$el,
        input = validation.$el[0],
        value = input.value,
        result;

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
    if(reg.test(rule)){ //如果参数为$选择器，则首先用相应DOM元素的value替换参数
        rule = rule.replace(reg,function(matched,val,index,original){
            return $(val).val();
        });
    }


    //验证
    result = VldRulesLib.validate(value, rule);

    validation.details = result.details;
    validation.passed = result.passed;
    validation.rules = result.rules;

    //是否动态验证，便于动态验证和非动态验证分别处理
    var dynamic = arguments.callee.caller == me._dynamicCheck;
    
    if(validation.passed == true){
        ok();
        return {
           details: validation.details,
           passed: validation.passed,
           rules: validation.rules
        }
    } else {
        error();
        return {
           details: validation.details,
           passed: validation.passed,
           rules: validation.rules
        }
    }

    //验证成功后执行的操作

    function ok() {
        //记录最后一次正确的值和光标位置
        validation.oldVal = validation.$el.val();

        //设置errorLoc
        if (errorLoc) {
            errorLoc.html("");
            if(opts.errorLocClass){
                errorLoc.removeClass(opts.errorLocClass);
            }else{
                errorLoc.hide();
            }
        }

        //删除旧的tip
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
            if(opts.autoRevise){ //使用revisedVal的值进行替换
                validation.$el.val(result.revisedVal);
                if(me.validate(validation)){ //再次验证替换后的值
                    return;
                }
            } else { //使用oldValue
                if(result.revisedVal != value){ //验证方法具有可替换性
                    validation.$el.val(validation.oldVal);
                    Util.setCursorPosition(validation.$el,validation.oldPosition - 1);
                    if(me.validate(validation)){ //再次验证替换后的值
                        return;
                    }
                } else { //不具有可替换性，将错误值设置为oldvalue
                    validation.oldVal = value;
                }
            }
            return; //动态验证只涉及到值修正，不涉及样式更改
        }
        
        validation.onError = true; //在onblur中取消设置

        //设置errorLoc
        if (errorLoc) {
            validation.$errorLoc.html(msg);
            if(opts.errorLocClass){
                validation.$errorLoc.addClass(opts.errorLocClass);
            }else{
                validation.$errorLoc.show();
            }
        } 
        $el.addClass(opts.errorClass);

        //这是tip
        if ((tipDir && tipDir != "none") || (opts.tipDir && opts.tipDir != "none")) {
            if(validation.errTipSet){
                validation.errTipSet.remove();
            }
            var errTip = $(opts.errTipTpl.replace("{{message}}",msg));
            opts.$parent.append(errTip);
            Util.setTipLoc($el, errTip, tipDir, offsetLeft, offsetTop, opts);
            validation.errTipSet = errTip;
        }

        me._showInErrorField();
    }
};

/*
 * 手动修正数据
 */
Validator.prototype.revise = function(all){
    var me = this;
    $.each(this.validations,function(index,val){
        if(all || val.dynamicVld){
            me._dynamicCheck(val);
            if(val.textLimiter){
                val.textLimiter.count();
            }
        }
    });
    return me.validateAll();//修正后再验证一次
}

/* 
 * 手动验证指定index的validation
 */
Validator.prototype.validateOne = function(index){
    if(index >= this.validations.length){
        throw new Error("index越界");
        return;
    }
    return this.validate(this.validations[index]);
}

/*
 * 集中显示错误信息
 */

Validator.prototype._showInErrorField = function() {
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



/* jQUery插件声明 */
$.Validator = Validator;

/* Validator声明 */
window.Validator = Validator;
window.ValidatorDefaults = setDefaults;

/**********************************************************************/

/*
 * 单个input验证
 */

$.fn.validator = function(validation){
    validation.fields = this;
    var vld = new $.Validator([validation],validation);
    return this;
};
