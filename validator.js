/*
 *validator.js 表单验证器
 *@author：maxiupeng
 *@date:2013-7-3
 */

(function($) {

    var checkInterval = 100;

    //debug
    var delegate = false;

    //获取浏览器类型
    var browser = {};
    browser.ie = $.support.boxModel;

    $.Validator = {};

    /*
     * validate 定义
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
    $.Validator.validate = function(validations, opts) {
        var opts = $.extend({}, $.Validator.defaults, opts);
        var errorMsg = {}; //集中显示的错误信息
        var hasRel = false; //各个field之间是否存在关联性
        var relations = {}; //储存各field之间的关联
        var _this = this;
        var dynamicVlds = []; //需要动态验证的validation列表
        if (validations.length == 0) return true;
        
        /*
         * 启动
         */
        var start = function() {
            if (opts.vldOnclick) {
                $(opts.vldOnclick).bind('click', function() {
                    var result = _this.validateAll();
                    if (result == false) {
                        for (var i = 0; i < validations.length; i++) {
                            if (validations[i].passed == false) {
                                $("#" + validations[i].field).focus();
                                return false;
                            }
                        }
                    }
                    return result;
                });
            }

            if (opts.vldOnBlur || opts.vldOnEnter) {
                for (var i = 0; i < validations.length; i++) {
                    if (opts.vldOnBlur) {
                        $(opts.parent).delegate("#" + validations[i].field, "blur", {
                            index: i,
                            field: validations[i].field
                        }, check);
                    }
                    if (opts.vldOnEnter) {
                        $(opts.parent).delegate("#" + validations[i].field, "keyup", {
                            index: i,
                            field: validations[i].field
                        }, onEnterHandler);
                    }
                }
            }

            //设置自定义的触发器
            if(opts.trigger){
                for(var i = 0; i < opts.trigger.length; i++){
                    $(opts.trigger[i].elm).bind(opts.trigger[i].event,_this.validateAll);
                }
            }

            //设置limiter、passed属性、hasRel属性、$el、动态验证
            for (var i = 0; i < validations.length; i++) {
                validations[i].passed = true;
                validations[i].$el = $("#" + validations[i].field);
                if (validations[i].rule.constructor == RegExp || (typeof validations[i].rule) == "function") {
                    
                } else if (validations[i].rule.indexOf("#") != -1) {
                    hasRel = true; //关联检查功能没有开启
                }
                if (validations[i].limiter) {
                    validations[i].$el.limiter(validations[i].limiter);
                }
                if(validations[i].dynamicVld){
                    dynamicVlds.push(validations[i]);
                }
                
            }

            //设置定时器
            if (opts.timer) {
                if (dynamicVlds.length != 0) {
                    setInterval(function() {
                        for (var i = 0; i < dynamicVlds.length; i++) {
                            dynamicCheck(dynamicVlds[i]);
                        }
                    }, checkInterval);
                }
                //出错时检验的定时器
                if (opts.checkOnError) {
                    setInterval(function() {
                        for (var i = 0; i < validations.length; i++) {
                            if (validations[i].onError) { //onError专用于定时验证,不用passed是为了焦点不离开输入框时不取消定时器
                                if (hasRel) {
                                    validateRel(validations[i]);
                                } else {
                                    validate(validations[i]);
                                }
                            }
                        }
                    }, checkInterval);
                }
            } else { //keydown和paste代替timer
                for (var i = 0; i < validations.length; i++) {
                    if(validations[i].dynamicVld){
                        dynamicVld(validations[i]);
                    }
                }
            }

        }

        /*
         * 动态验证
         */
        function dynamicVld(vld){
            if(browser.ie){//IE
                if(delegate){
                    //delegate
                    $(opts.parent).delegate("#" + vld.field, "keydown", function(e) {
                        setTimeout(function() {
                            dynamicCheck(getValidation(e.target.id));
                        }, 0);
                    });
                } else {
                    //on
                    vld.$el.on("keydown",function(e) {
                        setTimeout(function() {
                            dynamicCheck(getValidation(e.target.id));
                        }, 0);
                    });
                }
            } else {//非IE
                if(delegate){
                    //delegate
                    $(opts.parent).delegate("#" + vld.field, "input", function(e) {
                        setTimeout(function() {
                            dynamicCheck(getValidation(e.target.id));
                        }, 0);
                    });
                } else {
                    //on
                    vld.$el.on("input",function(e) {
                        setTimeout(function() {
                            dynamicCheck(getValidation(e.target.id));
                        }, 0);
                    });
                }
                
            }
            
            if(delegate){
                //delegate
                $(opts.parent).delegate("#" + vld.field, "paste",function(e){
                    setTimeout(function(){
                        dynamicCheck(getValidation(e.target.id));
                    }, 0);
                });
            } else {
                //on
                vld.$el.on("paste",function(e){
                    setTimeout(function(){
                        dynamicCheck(getValidation(e.target.id));
                    }, 0);
                });
            }
            
        }

        /*
         * 根据元素id从validations获取其对应的validation
         */
        function getValidation(id){
            for(var i = 0, len = validations.length; i < len; i++){
                if(validations[i].field == id){
                    return validations[i];
                }
            }
            return null;
        }

        /*
         * 动态验证,方便callee识别
         */
        function dynamicCheck(vld){
            validate(vld);
        }

        /*
         * 验证是否通过
         */
        this.isPassed = function() {
            for (var i = 0; i < validations.length; i++) {
                if (!validations[i].passed) {
                    return false;
                }
            }
            return true;
        }

        /*
         * onEnter handler
         */
        function onEnterHandler(e) {
            if (e.keyCode == 13) {
                return check(e);
            }
        }

        /*
         * 验证全部field
         */

        this.validateAll = function() {
            var flag = true;
            for (var i = 0; i < validations.length; i++) {
                var result = validate(validations[i]);
                flag = result == false ? false : flag;
            }
            return flag;
        }

        /*
         * 验证与某个field相关联的所有field
         * @param validation {object} 目标验证规则，通过此validation.field指定目标field
         */

        function validateRel(validation) {
            if (!relations[validation.field]) { //创建关系数组
                relations[validation.field] = [validation];
                for (var i = 0; i < validations.length; i++) {
                    if (validations[i].rule.constructor != RegExp && (typeof validations[i].rule) != "function" && validations[i].rule.indexOf("#" + validation.field) != -1) {
                        relations[validation.field].push(validations[i]);
                    }
                }
            }
            var result = true;
            for (var j = 0; j < relations[validation.field].length; j++) {
                var result = validate(relations[validation.field][j]) == false ? false : result;
            }
            return result;
        }

        /*
         * 验证单个field
         * @param validation {object} 验证规则
         */

        function validate(validation) {
            var field = validation.field;
            //var rules = $.Validator.parseRule(validation.rule);
            var msg = validation.msg ? validation.msg : opts.defaultMsg;
            var errorLoc = validation.errorLoc;
            var $el = validation.$el;
            var input = validation.$el[0];
            var value = input.value;
            var offsetLeft = validation.tipOffset && validation.tipOffset.left ? validation.tipOffset.left : 0;
            var offsetTop = validation.tipOffset && validation.tipOffset.top ? validation.tipOffset.top : 0;
            var tipDir = validation.tipDir;

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
            if(rule.indexOf("#") != -1){
                rule = rule.replace(/#[a-zA-Z0-9_]+/ig,function(val,index,original){
                    return "0" + $(val)[0].value + "";
                });
            }
            if(arguments.callee.caller == dynamicCheck){
                var result = VldRulesLib.validate(value, rule, "", msg, ok, error);
                if(!result.result){
                    input.value = result.revisedVal;
                }
            }else{
                VldRulesLib.validate(value, rule, "", msg, ok, error);
            }

            //验证成功后执行的操作

            function ok() {
                validation.passed = true;
                if (errorLoc) {
                    var $errorLoc = null;
                    if (errorLoc.indexOf('#') != -1) {
                        $errorLoc = $(errorLoc);
                    } else {
                        $errorLoc = $('#' + errorLoc);
                    }
                    $errorLoc.html("");
                    if(opts.errorLocClass){
                        $errorLoc.removeClass(opts.errorLocClass);
                    }else{
                        $errorLoc.hide();
                    }
                }
                if (tipDir || opts.tipDir) {
                    $("#" + field + "_errTip").remove();
                }
                errorMsg[field] = "";
                $el.removeClass(opts.errorClass);

                showInErrorField();
            }

            //验证失败后执行的操作

            function error() {
                validation.passed = false;
                validation.onError = true;
                if (errorLoc) {
                    var $errorLoc = null;
                    if (errorLoc.indexOf('#') != -1) {
                        $errorLoc = $(errorLoc);
                    } else {
                        $errorLoc = $('#' + errorLoc);
                    }
                    $errorLoc.html(msg);
                    if(opts.errorLocClass){
                        $errorLoc.addClass(opts.errorLocClass);
                    }else{
                        $errorLoc.show();
                    }
                } else {
                    errorMsg[field] = msg;
                }
                $el.addClass(opts.errorClass);

                if(opts.checkOnError && !opts.timer && !validation.binded){
                    validation.binded = true;
                    if(browser.ie){//IE
                        if(delegate){
                            //delegate
                            $(opts.parent).delegate("#" + field, "keydown", function(e) {
                                setTimeout(function() {
                                    checkOnError(e);
                                }, 0);
                            });
                        } else {
                            //on
                            $el.on("keydown", function(e) {
                                setTimeout(function() {
                                    checkOnError(e);
                                }, 0);
                            });
                        }
                        
                    } else {//非IE
                        if(delegate){
                            //delegate
                            $(opts.parent).delegate("#" + field, "input", function(e) {
                                setTimeout(function() {
                                    checkOnError(e);
                                }, 0);
                            });
                        } else {
                            //on
                            $el.on("input", function(e) {
                                setTimeout(function() {
                                    checkOnError(e);
                                }, 0);
                            });
                        }
                    }
                    
                    if(delegate){
                        //delegate
                        $(opts.parent).delegate("#" + field, "paste", function(e) {
                            setTimeout(function() {
                                checkOnError(e);
                            }, 0);
                        });
                    } else {
                        //on
                        $el.on("paste", function(e) {
                            setTimeout(function() {
                                checkOnError(e);
                            }, 0);
                        });
                    }
                }

                if (tipDir || opts.tipDir) {
                    $("#" + field + "_errTip").remove();
                    var errTip = $(opts.errTipTpl.replace("{{id}}",field + "_errTip")
                                 .replace("{{zindex}}",$.Validator.getZIndex($el))
                                 .replace("{{message}}",msg));
                    var parent = opts.parent?opts.parent:"body";
                    $(parent).append(errTip);
                    $.Validator.setTipLoc(field, errTip, tipDir, offsetLeft, offsetTop, opts);
                }

                showInErrorField();
            }
        }

        /*
         * 用于绑定单个input的blur、change事件
         * @param e {object} 事件
         */

        function check(e) {
            if(validations[e.data.index].onError){
                validations[e.data.index].onError = false;
            }
            if (hasRel == false) {
                return validate(validations[e.data.index]);
            } else {
                return validateRel(validations[e.data.index]);
            }
        }

        function checkOnError(e){
            var vld = getValidation(e.target.id);
            //vld.binded = true;
            validate(vld);
        }


        /*
         * 集中显示错误信息
         */

        function showInErrorField() {
            var msg = "";
            for (var key in errorMsg) {
                if (errorMsg[key] != "") {
                    msg += errorMsg[key];
                    msg += "<br/>";
                }
            }
            if (opts.errorField) {
                $("#" + opts.errorField).html(msg);
            } 
        }

        start();
    };

    /*
     * 获取元素位置
     * @param elmId {string}   元素id
     * @return result {object} 包含left,top,width,height
     */

    $.Validator.getElmLoc = function(elmId) {
        var result = {};
        var elm = $("#" + elmId);
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
    }

    /*
     * 设置error tip的位置
     * @param:elmId {string}  目标input的ID
     * @param:tip   {$obj}    提示tip的$元素
     * @param:tipDir {string} tip位置,up,down,left,right之一
     * @param:left   {number} 单个tip标签的左侧偏移量
     * @param:top    {number} 单个tip标签的上方偏移量
     */

    $.Validator.setTipLoc = function(elmId, tip, tipDir, left, top, opts) {
        //为了协调$.fn.Validator和$.Validator的使用。应该有更好的办法
        if(opts == null||opts == undefined){
            opts = {
                tipDir:null,
                tipOffset:null
            };
        }
        if (!opts.tipDir && !tipDir) return;
        var elmLoc = $.Validator.getElmLoc(elmId);
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
        } else {
            console.log("tipDir设置错误！")
            return;
        }
        tip.offset(result);
    }

    
    //获取元素的z-index坐标
    $.Validator.getZIndex = function($elm){
        if($elm[0].tagName == "BODY"){
            return 1;
        }
        var z = $elm.css("z-index");
        if(z == "auto") {
            z = $.Validator.getZIndex($elm.parent());
        }
        return z;
    }


    //默认参数
    $.Validator.defaults = {
        vldOnclick: null, //type：$selector,点击某个button时验证
        vldOnBlur: false, //元素失去焦点时验证
        vldOnEnter: false, //input中按下enter时验证
        checkOnError: true, //当前input内的数据不合法时自动验证数据
        timer: true, //是否使用定时器验证，若否，使用keydown和onpaste代替
        errorFiled: null, //集中显示错误信息的区域。
        errorClass: "", //错误时input标签应用的css样式
        errorLocClass: "", //错误时错误提示标签应用的样式，如show
        errTipTpl: "<div class='errorTip' id='{{id}}' style='z-index:{{zindex}};position:absolute;'>{{message}}</div>", //错误Tip模板,三个参数
        tipDir: "right", //错误tip的显示位置，可选up,down left,right,关闭tip的话设置为false
        tipOffset: null, //错误tip显示位置的偏移量，需要包含left和top
        defaultMsg: "输入有误，请重新输入", //默认的错误提示信息
        trigger: null, //验证触发器，数组类型，每个元素包括元素ID和时间名称
        parent: "body"//父节点$selector,为空的话自动指定为body
    }

/**********************************************************************/

    /*
     * 单个input验证
     * @param validation {object} 选项,格式为:
     *                                  {
     *                                    rule:验证规则,
     *                                    trigger:[{
     *                                       elm:元素ID,若省略则是当前input
     *                                       event:事件名称
     *                                    },{
     *                                       ...
     *                                    }],
     *                                    checkOnError:验证时候以后将验证绑定到keyup事件,
     *                                    timer: true, //是否使用定时器验证，若否，使用keydown和onpaste代替
     *                                    tipDir:errorTip位置,
     *                                    tipOffset:{
     *                                        top:
     *                                        left:
     *                                    },
     *                                    dynamicVld:true,
     *                                    errorClass:错误时input标签应用的css样式,
     *                                    errTipTpl:错误Tip模板
     *                                    errorLoc:显示错误信息的DOM元素ID
     *                                    msg:错误提示信息
     *                                    parent:父节点$selector,为空的话自动指定为body
     *                                  }
     * @return result {boolean} 如果是立即验证的话返回是否通过验证
     */

    $.fn.validator = function(validation){
        return new validator(this,validation);
    };
    function validator(ele,validation) {
        validation = $.extend({}, $.fn.validator.defaults,validation);
        var _this = this;
        var id = ele.attr("id");

        var msg = validation.msg;
        var errorLoc = validation.errorLoc;
        
        var offsetLeft = validation.tipOffset && validation.tipOffset.left ? validation.tipOffset.left : 0;
        var offsetTop = validation.tipOffset && validation.tipOffset.top ? validation.tipOffset.top : 0;
        var tipDir = validation.tipDir;

        validation.errTip = null;

        _this.validate = function() {
            var value = ele[0].value;
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
            if(rule.indexOf("#") != -1){
                rule = rule.replace(/#[a-zA-Z0-9_]+/ig,function(val,index,original){
                    return $(val)[0].value + "";
                });
            }
            if(arguments.callee.caller == dynamicCheck){
                var result = VldRulesLib.validate(value, rule, "", msg, ok, error);
                if(!result.result){
                    ele[0].value = result.revisedVal;
                }
            } else {
                VldRulesLib.validate(value, rule, "", msg, ok, error);
            }

            //设置验证通过时的错误信息

            function ok() {
                validation.passed = true;
                if (errorLoc) {
                    if (errorLoc.indexOf('#') != -1) {
                        $(errorLoc).html("");
                    } else {
                        $('#' + errorLoc).html("");
                    }
                }
                if (tipDir) {
                    $("#" + id + "_errTip").remove();
                }

                ele.removeClass(validation.errorClass);
                $(errorLoc).html(validation.msg);
            }

            //设置验证失败时的错误信息
            function error() {
                validation.passed = false;
                //validation.onError = true;
                if (errorLoc) {
                    if (errorLoc.indexOf('#') != -1) {
                        $(errorLoc).html(msg);
                    } else {
                        $('#' + errorLoc).html(msg);
                    }
                }

                ele.addClass(validation.errorClass);

                if(validation.checkOnError && !validation.binded){
                    validation.binded = true;
                    if(!validation.timer){
                        if(browser.ie){//IE
                            if(delegate){
                                //delegate
                                $(validation.parent).delegate("#" + id, "keydown", function(e) {
                                    setTimeout(_this.validate,0);
                                });
                            } else {
                                //on
                                ele.on("keydown",function(e) {
                                    setTimeout(_this.validate,0);
                                });
                            }
                        } else {//非IE
                            if(delegate){
                                //delegate
                                $(validation.parent).delegate("#" + id, "input", function(e) {
                                    setTimeout(_this.validate,0);
                                });
                            } else {
                                //on
                                ele.on("input",function(e) {
                                    setTimeout(_this.validate,0);
                                });
                            }
                        }
                        
                        if(delegate){
                            //delegate
                            $(validation.parent).delegate("#" + id, "paste",function(e){
                                setTimeout(_this.validate, 0);
                            });
                        } else {
                            //on
                            ele.on("paste",function(e){
                                setTimeout(_this.validate, 0);
                            });
                        }
                    } else if(!validation.interval){
                        validation.interval = setInterval(_this.validate,checkInterval);
                    }
                }

                if (tipDir) {
                    $("#" + id + "_errTip").remove();
                    var errTip = $(validation.errTipTpl.replace("{{id}}",id + "_errTip")
                                 .replace("{{zindex}}",$.Validator.getZIndex(ele))
                                 .replace("{{message}}",msg));
                    validation.errTip = errTip;
                    var parent = validation.parent ? validation.parent : "body";
                    $(parent).append(errTip);
                    $.Validator.setTipLoc(id, errTip, validation.tipDir, offsetLeft, offsetTop);
                }
            }
        }

        _this.check = function(){
            // validation.binded = false;

            // if(validation.interval){
            //     validation.interval = null;
            //     window.clearInterval(validation.interval);
            // }
            _this.validate();
        };

        //重置TIP位置
        _this.resetTip = function(){
            if(validation.errTip){
                $.Validator.setTipLoc(id, validation.errTip, validation.tipDir, offsetLeft, offsetTop);
            }
        };

        //设置触发器
        if(validation.trigger){
            for(var i = 0; i < validation.trigger.length; i++) {
                var elm = validation.trigger[i].elm?validation.trigger[i].elm:"#" + ele.attr("id");
                $(elm).bind(validation.trigger[i].event,_this.check);
            }
        }

        //动态验证
        if(validation.dynamicVld) {
            if(validation.timer){
                setInterval(dynamicCheck, checkInterval);
            } else {
                if(browser.ie){//IE
                    if(delegate){
                        //delegate
                        $(validation.parent).delegate("#" + id, "keydown", function(e) {
                            setTimeout(dynamicCheck,0);
                        });
                    } else {
                        //on
                        ele.on("keydown",function(e) {
                            setTimeout(dynamicCheck,0);
                        });
                    }
                } else {//非IE
                    if(delegate){
                        //delegate
                        $(validation.parent).delegate("#" + id, "input", function(e) {
                            setTimeout(dynamicCheck,0);
                        });
                    } else {
                        //on
                        ele.on("input",function(e) {
                            setTimeout(dynamicCheck,0);
                        });
                    }
                    
                }
                
                if(delegate){
                    //delegate
                    $(validation.parent).delegate("#" + id, "paste",function(e){
                        setTimeout(dynamicCheck, 0);
                    });
                } else {
                    //on
                    $("#" + id).on("paste",function(e){
                        setTimeout(dynamicCheck, 0);
                    });
                }
            }
        }

        function dynamicCheck(){
            var result = VldRulesLib.validate(ele[0].value, validation.rule, "", msg);
            if(!result.result){
                ele[0].value = result.revisedVal;
            }
        }


    }

    //默认参数
    $.fn.validator.defaults = {
        tipDir: "right",
        checkOnError:true,
        tipOffset: {
            top: 0,
            left: 0
        },
        dynamicVld: false,
        errTipTpl: "<div class='errorTip' id='{{id}}' style='z-index:{{zindex}};position:absolute;'>{{message}}</div>",
        msg: "输入有误，请重新输入",
        parent: "body"
    };

/**********************************************************************/
    /*
     * data-pattern方式验证
     */

    /*
     * 验证失败时为item添加的class
     */
    $.Validator.dpShowErrClass = null;

    /*
     * 验证失败后是否自动监听
     */
    $.Validator.checkOnError = true;

    /*
     * 是否动态验证
     */
    $.Validator.dynamicVld = false;

    /*
     * 监听间隔
     */
    $.Validator.dpInterval = 100;

    /* 
     * 使用timer还是keydown和paste
     */
    $.Validator.timer = true;

    /*
     * 记录当前哪个item在被监听
     */
    $.Validator.dpItemsOnCheck = {};

    /*
     * 初始化函数
     */
    $.Validator.initDynamic = function(){
        var $parent = $(this).parent();
        //绑定动态验证
        if($.Validator.dynamicVld){
            var items = $("div[data-pattern]");
            var input = items.find("input");
            if($.Validator.timer){
                setInterval(function(){
                    $.each(items,function(index,val){
                        $.Validator.dynamicCheck(val.id);
                    });
                },$.Validator.dpInterval);
            } else {
                if (browser.ie) { //IE
                    if (delegate) {
                        //delegate
                        $parent.delegate(input, "keydown", function(e) {
                            setTimeout(function(){
                                $.Validator.dynamicCheck(e.target.parentNode.id);
                            }, 0);
                        });
                    } else {
                        //on
                        input.on("keydown", function(e) {
                            setTimeout(function(){
                                $.Validator.dynamicCheck(e.target.parentNode.id);
                            }, 0);
                        });
                    }
                } else { //非IE
                    if (delegate) {
                        //delegate
                        $parent.delegate(input, "input", function(e) {
                            setTimeout(function(){
                                $.Validator.dynamicCheck(e.target.parentNode.id);
                            }, 0);
                        });
                    } else {
                        //on
                        input.on("input", function(e) {
                            setTimeout(function(){
                                $.Validator.dynamicCheck(e.target.parentNode.id);
                            }, 0);
                        });
                    }
                }

                if (delegate) {
                    //delegate
                    $parent.delegate(input, "paste", function(e) {
                        setTimeout(function(){
                            $.Validator.dynamicCheck(e.target.parentNode.id);
                        }, 0);
                    });
                } else {
                    //on
                    input.on("paste", function(e) {
                        setTimeout(function(){
                            $.Validator.dynamicCheck(e.target.parentNode.id);
                        }, 0);
                    });
                }
            }
            
        }
    }
    
    
    $.Validator.dynamicCheck = function(itemId){
        var item, input, data_pattern, rule, value;
        item = $("#" + itemId);
        if(!item){
            return true;
        }

        input = item.find("input");
        if(!input){
            return true;
        }

        data_pattern = item.attr("data-pattern");
        if(!data_pattern){
            return true;
        }

        value = input[0].value;

        //验证
        rule = data_pattern;
        if (rule.indexOf("#") != -1) {
            rule = rule.replace(/#[a-zA-Z0-9_]+/ig, function(val, index, original) {
                return $(val)[0].value + "";
            });
        }

        var result = VldRulesLib.validate(value, rule, "", "");
        if(!result.result){
            input[0].value = result.revisedVal;
        }
    }

    /*
     * 验证接口
     * @para elms {string|Array|String,String...} 待验证的item的id，或id的数组，或id的枚举
     * @return {boolean|object} 若验证单个item，返回true或false，若验证多个，返回包含各个结果object,key为item名，value为结果
     */
    $.Validator.dpValidate = function(elms){
        var results = {};
        if(arguments.length == 1){
            //验证单个标签
            if(typeof elms == "string"){
                return $.Validator.validateSingle(elms);
            }
            //批量验证标签,数组形式传参
            else if(typeof elms == "object" && elms instanceof Array){
                for(var i = 0; i < elms.length; i++){
                    results[elms[i]] = $.Validator.validateSingle(elms[i]);
                }
                return results;
            }
        }
        //批量验证标签，批量传参
        else if(arguments.length > 1){
            for(var i = 0; i < arguments.length; i++){
                if(typeof arguments[i] == "string"){
                    results[arguments[i]] = $.Validator.validateSingle(arguments[i]);
                }else{
                    results[arguments[i]] = undefined;
                }
            }
            return results;
        }
    };

    /*
     * 验证单个item
     * @param itemId {string} 待验证的item的ID
     * @return {boolean} 验证通过与否
     */
    $.Validator.validateSingle = function(itemId){
        var item, input, data_pattern, rule, value;
        var $parent = $("#" + itemId).parent();
        item = $("#" + itemId);
        if(!item){
            return true;
        }

        input = item.find("input");
        if(!input){
            return true;
        }

        data_pattern = item.attr("data-pattern");
        if(!data_pattern){
            return true;
        }

        value = input[0].value;

        //验证
        rule = data_pattern;
        if (rule.indexOf("#") != -1) {
            rule = rule.replace(/#[a-zA-Z0-9_]+/ig, function(val, index, original) {
                return $(val)[0].value + "";
            });
        }
        VldRulesLib.validate(value, rule, "", "", ok, error);
        //验证通过后执行的操作
        function ok(){
            // if($.Validator.checkOnError){
            //     if($.Validator.time){
            //         if($.Validator.dpItemsOnCheck[itemId]){
            //             window.clearInterval($.Validator.dpItemsOnCheck[itemId]);
            //             $.Validator.dpItemsOnCheck[itemId] = null;
            //         }
            //     } else if(!$.Validator.dynamicCheck && dpItemsOnCheck[itemId]) {
            //             //取消事件绑定
            //         }
            //     }
            // }
            item.removeClass($.Validator.dpShowErrClass);
            
        }

        //验证失败后执行的操作
        function error(){
            if ($.Validator.checkOnError) {
                if ($.Validator.timer) {
                    if (!$.Validator.dpItemsOnCheck[itemId]) {
                        $.Validator.dpItemsOnCheck[itemId] = setInterval($.Validator.validateSingle, $.Validator.dpInterval, itemId);
                    }
                } else if(!$.Validator.dpItemsOnCheck[itemId]){
                    $.Validator.dpItemsOnCheck[itemId] = true;
                    if(browser.ie){//IE
                        if(delegate){
                            //delegate
                            $parent.delegate("#" + itemId + " input", "keydown", function(e) {
                                setTimeout(check,0);
                            });
                        } else {
                            //on
                            input.on("keydown",function(e) {
                                setTimeout(check,0);
                            });
                        }
                    } else {//非IE
                        if(delegate){
                            //delegate
                            $parent.delegate("#" + itemId + " input", "input", function(e) {
                                setTimeout(check,0);
                            });
                        } else {
                            //on
                            input.on("input",function(e) {
                                setTimeout(check,0);
                            });
                        }
                    }
                    
                    if(delegate){
                        //delegate
                        $parent.delegate("#" + itemId + " input", "paste",function(e){
                            setTimeout(check, 0);
                        });
                    } else {
                        //on
                        input.on("paste",function(e){
                            setTimeout(check, 0);
                        });
                    }
                }
            }
            
            item.addClass($.Validator.dpShowErrClass);
        }

        function check(){
            VldRulesLib.validate(value, rule, "", "", ok, error);
        }
    }

})(jQuery);