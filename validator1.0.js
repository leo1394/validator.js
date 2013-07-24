/*
 *validator.js 表单验证器
 *@author：maxiupeng
 *@date:2013-7-24
 */

var checkInterval = 100;

/* for debug，使用delegate还是直接绑定，有待商议 */
var delegate = true;

/* 获取浏览器类型 */
var browser = {
	ie: !$.support.boxModel
};

/* Validator命名空间 */
$.Validator = {};

/* 默认参数 */
$.Validator.defaults = {
	vldOnclick: null, //type：$selector,点击某个button时验证
	vldOnBlur: false, //元素失去焦点时验证
	vldOnEnter: false, //input中按下enter时验证
	checkOnError: true, //当前input内的数据不合法时自动验证数据
	timer: true, //是否使用定时器验证，若否，使用keydown和onpaste代替
	errorFiled: null, //集中显示错误信息的区域。
	errorClass: "", //错误时input标签应用的css样式
	errorLocClass: "", //错误时错误提示标签应用的样式，如show
	errTipTpl: "<div class='errorTip' id='{{id}}' style='z-index:{{zindex}};"
	            + "position:absolute;'>{{message}}</div>", //错误Tip模板,三个参数
	tipDir: "right", //错误tip的显示位置，可选up,down left,right,关闭tip的话设置为false
	tipOffset: null, //错误tip显示位置的偏移量，需要包含left和top
	defaultMsg: "输入有误，请重新输入", //默认的错误提示信息
	trigger: null, //验证触发器，数组类型，每个元素包括元素ID和时间名称
	parent: "body" //父节点$selector,为空的话自动指定为body
}

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
$.Validator.validator = function(validations, opts) {
	this.opts = $.extend({}, $.Validator.defaults, opts);
	this.errorMsg = {}; //集中显示的错误信息
	this.hasRel = false; //各个field之间是否存在关联性
	this.relations = {}; //储存各field之间的关联
	this._this = this;
	this.dynamicVlds = []; //需要动态验证的validation列表
	this.validations = validations;
	if (validations.length == 0) return true;
	this.start();
};

var Validator = $.Validator.validator;

/*
 * 启动
 */
Validator.prototype.start = function() {
	/* 映射实例变量为局部变量 */
	var opts = this.opts;
	var errorMsg = this.errorMsg;
	var relations = this.relations;
	var dynamicVlds = this.dynamicVlds;
	var validations = this.validations;
	var _this = this;

	/* jQuery元素拆分 */
	for(var i = 0; i < validations.length; i++){
	    if(validations[i].field.constructor == jQuery && validations[i].field.length > 1){
    		for(var j = 0; j < validations[i].field.length; j++){
    			var vld = $.extend({},validations[i]);
    			if(!validations[i].field[j].getAttribute("id")){
    				validations[i].field[j].setAttribute("id",$.Validator.randomString(10));
    			}
    			vld.field = $(validations[i].field.selector + "#" + validations[i].field[j].getAttribute("id"));
    			validations.push(vld);
    		}
	    	validations.shift(i);
	    }
	}

	/* 设置limiter、passed属性、hasRel属性、$el、id、动态验证 */
	for (var i = 0; i < validations.length; i++) {
	    validations[i].passed = true;
	    if(validations[i].field.constructor == jQuery){
	    	validations[i].$el = validations[i].field;
	    	validations[i].randomId = $.Validator.randomString(10);
	    } else {
	    	validations[i].$el = $("#" + validations[i].field);
	    	validations[i].randomId = $.Validator.randomString(10);
	    }
	    if(!validations[i].$el.attr("id")){
	    	validations[i].$el.attr("id", validations[i].randomId);
	    }
	    
	    /*关联检查功能，暂不可用
	    if (validations[i].rule.constructor == RegExp || (typeof validations[i].rule) == "function") {
	        
	    } else if (validations[i].rule.indexOf("#") != -1) {
	        hasRel = true; //关联检查功能没有开启
	    }
	    //*/
	    
	    if (validations[i].limiter) {
	        validations[i].$el.limiter(validations[i].limiter);
	    }
	    if(validations[i].dynamicVld){
	        dynamicVlds.push(validations[i]);
	    }
	    
	}

	/* 绑定button的onclick */
    if (opts.vldOnclick) {
        $(opts.vldOnclick).bind('click', function(){
        	_this.validateAll()
        });
    }

    /* 绑定input的onblur和回车键 */
    if (opts.vldOnBlur || opts.vldOnEnter) {
        for (var i = 0; i < validations.length; i++) {
            if (opts.vldOnBlur) {
                $(opts.parent).delegate(validations[i].$el.selector, "blur", {
                    index: i,
                    field: validations[i].field
                }, function(e){
                	_this.check(e.data.index);
                });
            }
            if (opts.vldOnEnter) {
                $(opts.parent).delegate(validations[i].$el.selector, "keyup", {
                    index: i,
                    field: validations[i].field
                }, function(e){
                	_this.onEnterHandler(e);
                });
            }
        }
    }

    /* 设置自定义的触发器 */
    if(opts.trigger){
        for(var i = 0; i < opts.trigger.length; i++){
            $(opts.trigger[i].elm).bind(opts.trigger[i].event,function(){
	        	_this.validateAll()
	        });
        }
    }

    /* 设置定时器和动态验证 */
    if (opts.timer) {
    	//动态验证的定时器
        if (dynamicVlds.length != 0) {
            setInterval(function() {
                for (var i = 0; i < dynamicVlds.length; i++) {
                    _this.dynamicCheck(dynamicVlds[i]);
                }
            }, checkInterval);
        }
        //出错时检验的定时器
        if (opts.checkOnError) {
            setInterval(function() {
                for (var i = 0; i < validations.length; i++) {
                    if (validations[i].onError) { //onError专用于定时验证,不用passed是为了焦点不离开输入框时不取消定时器
                        if (_this.hasRel) {
                            _this.validateRel(validations[i]);
                        } else {
                            _this.validate(validations[i]);
                        }
                    }
                }
            }, checkInterval);
        }
    } else { //keydown和paste代替timer
        for (var i = 0; i < validations.length; i++) {
            if(validations[i].dynamicVld){
                _this.initDynamicVld(validations[i]);
            }
        }
    }
}

/*
 * 初始化动态验证
 */
Validator.prototype.initDynamicVld = function(vld){
	var _this = this;
    if(browser.ie){//IE
        if(delegate){
            //delegate
            $(_this.opts.parent).delegate(vld.$el.selector, "keydown", {vld: vld}, function(e) {
                setTimeout(function() {
                    // _this.dynamicCheck(_this.getValidation(e.target.id));
                    _this.dynamicCheck(e.data.vld);
                }, 0);
            });
        } else {
            //on
            vld.$el.on("keydown", {vld: vld}, function(e) {
                setTimeout(function() {
                    // _this.dynamicCheck(_this.getValidation(e.target.id));
                    _this.dynamicCheck(e.data.vld);
                }, 0);
            });
        }
    } else {//非IE
        if(delegate){
            //delegate
            $(_this.opts.parent).delegate(vld.$el.selector, "input", {vld: vld}, function(e) {
                setTimeout(function() {
                    // _this.dynamicCheck(_this.getValidation(e.target.id));
                    _this.dynamicCheck(e.data.vld);
                }, 0);
            });
        } else {
            //on
            vld.$el.on("input", {vld: vld}, function(e) {
                setTimeout(function() {
                    // _this.dynamicCheck(_this.getValidation(e.target.id));
                    _this.dynamicCheck(e.data.vld);
                }, 0);
            });
        }
        
    }
    
    if(delegate){
        //delegate
        $(_this.opts.parent).delegate(vld.$el.selector, "paste", {vld: vld}, function(e){
            setTimeout(function(){
                // _this.dynamicCheck(_this.getValidation(e.target.id));
                _this.dynamicCheck(e.data.vld);
            }, 0);
        });
    } else {
        //on
        vld.$el.on("paste", {vld: vld}, function(e){
            setTimeout(function(){
                // _this.dynamicCheck(_this.getValidation(e.target.id));
                _this.dynamicCheck(e.data.vld);
            }, 0);
        });
    }
}

/*
 * 根据元素id从validations获取其对应的validation
 */
// Validator.prototype.getValidation = function(id){
// 	var validations = this.validations;
//     for(var i = 0, len = validations.length; i < len; i++){
//         if(validations[i].field == id){
//             return validations[i];
//         }
//     }
//     return null;
// }

/*
 * 动态验证,方便callee识别
 */
Validator.prototype.dynamicCheck = function(vld){
    this.validate(vld);
}

/*
 * 用于绑定单个input的blur、change事件
 * @param e {object} 事件
 */

Validator.prototype.check = function(index) {
    if(this.validations[index].onError){
        this.validations[index].onError = false;
    }
    if (this.hasRel == false) {
        return this.validate(this.validations[index]);
    } else {
        return this.validateRel(this.validations[index]);
    }
}

/*
 * onEnter handler
 */
Validator.prototype.onEnterHandler = function(e) {
    if (e.keyCode == 13) {
        return this.check(e.data.index);
    }
}

/*
 * 验证是否通过
 */
Validator.prototype.isPassed = function() {
    for (var i = 0; i < this.validations.length; i++) {
        if (!this.validations[i].passed) {
            return false;
        }
    }
    return true;
}



/*
 * 验证全部field
 */
Validator.prototype.validateAll = function() {
	var validations = this.validations;
    var flag = true;
    for (var i = 0; i < validations.length; i++) {
        var result = this.validate(validations[i]);
        flag = result == false ? false : flag;
    }

	//第一个错误标签获得焦点
	if(!flag){
		for (var i = 0; i < validations.length; i++) {
		    if (validations[i].passed == false) {
		        $(validations[i].$el).focus();
		        return false;
		    }
		}
	}

    return flag;
}

/*
 * 验证与某个field相关联的所有field
 * @param validation {object} 目标验证规则，通过此validation.field指定目标field
 */
Validator.prototype.validateRel = function(validation) {
	/* 暂时不可用
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
    // */
}

/*
 * 验证单个field
 * @param validation {object} 验证规则
 */

Validator.prototype.validate = function(validation) {
	/* 映射实例变量为局部变量 */
	var opts = this.opts;
	var errorMsg = this.errorMsg;
	var relations = this.relations;
	var dynamicVlds = this.dynamicVlds;
	var validations = this.validations;
	var _this = this;

    var field = validation.field;
    var randomId = validation.randomId;
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
    if(arguments.callee.caller == _this.dynamicCheck){
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
            $("#" + randomId + "_errTip").remove();
        }
        errorMsg[randomId] = "";
        $el.removeClass(opts.errorClass);

        _this.showInErrorField();
    }

    //验证失败后执行的操作

    function error() {
        validation.passed = false;
        validation.onError = true; //在onblur中设置
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
            errorMsg[randomId] = msg;
        }
        $el.addClass(opts.errorClass);

        if(opts.checkOnError && !opts.timer && !validation.binded){
            validation.binded = true;
            if(browser.ie){//IE
                if(delegate){
                    //delegate
                    $(opts.parent).delegate($el.selector, "keydown", {vld: validation}, function(e) {
                        setTimeout(function() {
                            _this.validate(e.data.vld);
                        }, 0);
                    });
                } else {
                    //on
                    $el.on("keydown", {vld: validation}, function(e) {
                        setTimeout(function() {
                            _this.validate(e.data.vld);
                        }, 0);
                    });
                }
                
            } else {//非IE
                if(delegate){
                    //delegate
                    $(opts.parent).delegate($el.selector, "input", {vld: validation}, function(e) {
                        setTimeout(function() {
                            _this.validate(e.data.vld);
                        }, 0);
                    });
                } else {
                    //on
                    $el.on("input", {vld: validation}, function(e) {
                        setTimeout(function() {
                            _this.validate(e.data.vld);
                        }, 0);
                    });
                }
            }
            
            if(delegate){
                //delegate
                $(opts.parent).delegate($el.selector, "paste", {vld: validation}, function(e) {
                    setTimeout(function() {
                        _this.validate(e.data.vld);
                    }, 0);
                });
            } else {
                //on
                $el.on("paste", {vld: validation}, function(e) {
                    setTimeout(function() {
                        _this.validate(e.data.vld);
                    }, 0);
                });
            }
        }

        if (tipDir || opts.tipDir) {
            $("#" + randomId + "_errTip").remove();
            var errTip = $(opts.errTipTpl.replace("{{id}}",randomId + "_errTip")
                         .replace("{{zindex}}",$.Validator.getZIndex($el))
                         .replace("{{message}}",msg));
            var parent = opts.parent?opts.parent:"body";
            $(parent).append(errTip);
            $.Validator.setTipLoc($el, errTip, tipDir, offsetLeft, offsetTop, opts);
        }

        _this.showInErrorField();
    }
}




/*
 * 集中显示错误信息
 */

Validator.prototype.showInErrorField = function() {
	var errorMsg = this.errorMsg;
	var opts = this.opts;
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

/*
 * 获取元素位置
 * @param elmId {string}   元素id
 * @return result {object} 包含left,top,width,height
 */

$.Validator.getElmLoc = function($el) {
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
}

/*
 * 设置error tip的位置
 * @param:elmId {string}  目标input的ID
 * @param:tip   {$obj}    提示tip的$元素
 * @param:tipDir {string} tip位置,up,down,left,right之一
 * @param:left   {number} 单个tip标签的左侧偏移量
 * @param:top    {number} 单个tip标签的上方偏移量
 */

$.Validator.setTipLoc = function($el, tip, tipDir, left, top, opts) {
    //为了协调$.fn.Validator和$.Validator的使用。应该有更好的办法
    if(opts == null||opts == undefined){
        opts = {
            tipDir:null,
            tipOffset:null
        };
    }
    if (!opts.tipDir && !tipDir) return;
    var elmLoc = $.Validator.getElmLoc($el);
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

$.Validator.randomString = function(length) {
    var chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz'.split('');
   
    if (! length) {
        length = Math.floor(Math.random() * chars.length);
    }
   
    var str = '';
    for (var i = 0; i < length; i++) {
        str += chars[Math.floor(Math.random() * chars.length)];
    }
    return str;
}


/**********************************************************************/

/*
 * 单个input验证
 */

$.fn.validator = function(validation){
	validation.field = this;
    return new $.Validator.validator(validation,validation);
};