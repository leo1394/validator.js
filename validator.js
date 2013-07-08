/*
 *validator.js 表单验证器
 *@author：maxiupeng
 *@date:2013-7-3
 */

(function($) {

    var checkInterval = 100;
    $.Validator = {};
    /*
     * validator 定义
     * @param:validations {array}  应用到当前form中所有field的规则
     *                                 eg:[{
                                         field:'userName',
                                         rule:'required',
                                          msg:'userName is required!',
                                          errorLoc:'error_username'
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
                        $(document).delegate("#" + validations[i].field, "blur", {
                            index: i,
                            field: validations[i].field
                        }, check);
                    }
                    if (opts.vldOnEnter) {
                        $(document).delegate("#" + validations[i].field, "keyup", {
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

            //设置limiter、passed属性、hasRel属性
            for (var i = 0; i < validations.length; i++) {
                validations[i].passed = true;
                if (validations[i].rule.constructor == RegExp || (typeof validations[i].rule) == "function") {
                    
                } else if (validations[i].rule.indexOf("#") != -1) {
                    hasRel = true; //关联检查功能没有开启
                }
                if (validations[i].limiter) {
                    $("#" + validations[i].field).limiter(validations[i].limiter);
                }
            }
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
            var input = $("#" + field)[0];
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
            if(rule.contains("#")){
                rule = rule.replace(/#[a-zA-Z0-9_]+/ig,function(val,index,original){
                    return $(val)[0].value + "";
                });
            }
            VldRulesLib.validate(value, rule, "", msg, ok, error);

            //验证成功后执行的操作

            function ok() {
                validation.passed = true;
                if (errorLoc) {
                    if (errorLoc.indexOf('#') != -1) {
                        $(errorLoc).html("");
                    } else {
                        $('#' + errorLoc).html("");
                    }
                }
                if (tipDir || opts.tipDir) {
                    $("#" + field + "_errTip").remove();
                }
                errorMsg[field] = "";
                $("#" + field).removeClass(opts.errorClass);

                showInErrorField();
            }

            //验证失败后执行的操作

            function error() {
                validation.passed = false;
                if (errorLoc) {
                    if (errorLoc.indexOf('#') != -1) {
                        $(errorLoc).html(msg);
                    } else {
                        $('#' + errorLoc).html(msg);
                    }
                } else {
                    errorMsg[field] = msg;
                }
                $("#" + field).addClass(opts.errorClass);
                if(opts.checkOnError){
                    if(!validation.interval){
                        validation.interval = setInterval(checkValue,checkInterval,validation);
                    }
                }

                if (tipDir || opts.tipDir) {
                    $("#" + field + "_errTip").remove();
                    var errTip = $(Mustache.render(opts.errTipTpl, {
                        id: field + "_errTip",
                        zindex:$.Validator.getZIndex($("#" + field)),
                        message: msg
                    }));
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
            if(validations[e.data.index].interval){
                validations[e.data.index].interval = null;
                window.clearInterval(validations[e.data.index].interval);
            }
            if (hasRel == false) {
                return validate(validations[e.data.index]);
            } else {
                return validateRel(validations[e.data.index]);
            }
        }

        /*
         * 用于定时检验input的value函数
         * @param validation {object} 验证设置
         */

        function checkValue(validation) {
            if (hasRel == false) {
                return validate(validation);
            } else {
                return validateRel(validation);
            }
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

    /*
     * 规则解析函数，将复合规则解析成object
     * @param:rule        {string} 规则语句
     * @return:results {array}  第一个元素表示规则之间的关系，or或者and；剩余元素为独立的规则。
     *                          如果是单一规则，则直接返回包含该规则的单元素数组
     *                          eg:[{rel:or},{rule:min,args:5},{rule:max,args:10}]
     */

    $.Validator.parseRule = function(rule) {
        if (rule.constructor == RegExp || typeof rule == "function") {
            return null;
        }
        var results = [];
        var rules = [];
        if (rule.indexOf("&") != -1) {
            rules = rule.split("&");
            results.push({
                rel: "and"
            });
        } else if (rule.indexOf("|") != -1) {
            rules = rule.split("|");
            results.push({
                rel: "or"
            })
        } else {
            rules.push(rule);
        }
        for (var i = 0; i < rules.length; i++) {
            var temp = rules[i].match(/(\w+)(\[([\s\S]+)\])?/);
            var name = temp[1];
            var args = temp[3];
            if (!$.Validator.rulesTable[name]) {
                console.log("规则错误！");
                return false;
            }
            results.push({
                rule: name,
                args: args
            });
        }
        return results;

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
        errorFiled: null, //集中显示错误信息的区域。
        errorClass: "", //错误时input标签应用的css样式
        errTipTpl: "<div class='errorTip' id='{{id}}' style='z-index:{{zindex}};position:absolute;'>{{message}}</div>", //错误Tip模板
        tipDir: "right", //错误tip的显示位置，可选up,down left,right,关闭tip的话设置为false
        tipOffset: null, //错误tip显示位置的偏移量，需要包含left和top
        defaultMsg: "输入有误，请重新输入", //默认的错误提示信息
        trigger:null, //验证触发器，数组类型，每个元素包括元素ID和时间名称
        parent:null//父节点$selector,为空的话自动指定为body
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
     *                                    tipDir:errorTip位置,
     *                                    tipOffset:{
     *                                        top:
     *                                        left:
     *                                    },
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
        //_this.ele=ele.attr("id");
        var id = ele.attr("id");

        //var rules = $.Validator.parseRule(validation.rule);
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
            if(rule.contains("#")){
                rule = rule.replace(/#[a-zA-Z0-9_]+/ig,function(val,index,original){
                    return $(val)[0].value + "";
                });
            }
            VldRulesLib.validate(value, rule, "", msg, ok, error);

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
                if (errorLoc) {
                    if (errorLoc.indexOf('#') != -1) {
                        $(errorLoc).html(msg);
                    } else {
                        $('#' + errorLoc).html(msg);
                    }
                }

                ele.addClass(validation.errorClass);

                if(validation.checkOnError){
                    if(!validation.interval){
                        validation.interval = setInterval(_this.validate,checkInterval);
                    }
                }

                if (tipDir) {
                    $("#" + id + "_errTip").remove();
                    var errTip = $(Mustache.render(validation.errTipTpl, {
                        id: id + "_errTip",
                        zindex: $.Validator.getZIndex($("#" + id)),
                        message: msg
                    }));
                    validation.errTip = errTip;
                    var parent = validation.parent?validation.parent:"body";
                    $(parent).append(errTip);
                    $.Validator.setTipLoc(id, errTip, validation.tipDir, offsetLeft, offsetTop);
                }
            }
        }

        this.check = function(){
            if(validation.interval){
                validation.interval = null;
                window.clearInterval(validation.interval);
            }
            _this.validate();
        }

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
    }

    //默认参数
    $.fn.validator.defaults = {
        tipDir: "right",
        checkOnError:true,
        tipOffset: {
            top: 0,
            left: 0
        },
        errTipTpl: "<div class='errorTip' id='{{id}}' style='z-index:{{zindex}};position:absolute;'>{{message}}</div>",
        msg: "输入有误，请重新输入"
    }

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
    $.Validator.dpAutoListen = true;

    /*
     * 监听间隔
     */
    $.Validator.dpInterval = 100;

    /*
     * 记录当前哪个item在被监听
     */
    $.Validator.dpItemsInterval = {};

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
                return validateSingle(elms);
            }
            //批量验证标签,数组形式传参
            else if(typeof elms == "object" && elms instanceof Array){
                for(var i = 0; i < elms.length; i++){
                    results[elms[i]] = validateSingle(elms[i]);
                }
                return results;
            }
        }
        //批量验证标签，批量传参
        else if(arguments.length > 1){
            for(var i = 0; i < arguments.length; i++){
                if(typeof arguments[i] == "string"){
                    results[arguments[i]] = validateSingle(arguments[i]);
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
    function validateSingle(itemId){
        var item;
        var input;
        var data_pattern;
        var rules;
        var value;

        item = $("#" + itemId);
        if(!item){
            return true;
        }

        input = item.find("input");
        if(!input){
            return true;
        }

        data_pattern = input.attr("data-pattern");
        if(!data_pattern){
            return true;
        }

        //rules = $.Validator.parseRule(data_pattern);
        value = input[0].value;

        //验证
        var rule = data_pattern;
        if (rule.contains("#")) {
            rule = rule.replace(/#[a-zA-Z0-9_]+/ig, function(val, index, original) {
                return $(val)[0].value + "";
            });
        }
        VldRulesLib.validate(value, rule, "", "", ok, error);
        //验证通过后执行的操作
        function ok(){
            if($.Validator.dpItemsInterval[itemId]){
                window.clearInterval($.Validator.dpItemsInterval[itemId]);
                $.Validator.dpItemsInterval[itemId] = null;
            }
            item.removeClass($.Validator.dpShowErrClass);
        }

        //验证失败后执行的操作
        function error(){
            if(!$.Validator.dpItemsInterval[itemId]){
                $.Validator.dpItemsInterval[itemId] = setInterval(validateSingle,$.Validator.dpInterval,itemId);
            }
            item.addClass($.Validator.dpShowErrClass);
        }
    }

})(jQuery);