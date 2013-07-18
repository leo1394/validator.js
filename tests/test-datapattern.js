$(function() {
    $.Validator.dpShowErrClass = "showError";
    $.Validator.timer = false;
    $.Validator.dynamicVld = true;
    $.Validator.initDynamic();
    //单个验证 by id
    $("#dp_submit").bind("click", function(){
        $.Validator.dpValidate("item_text1");
        $.Validator.dpValidate("item_text2");
        $.Validator.dpValidate("item_email");
        $.Validator.dpValidate("item_idCard");
        $.Validator.dpValidate("item_re");
    });

    /******************Unit Test***********************/
    var $el;
    var id;
    var id1;
    var queue = [];
    var $inputs = $("input");

    function reset(){
        $inputs.removeClass("error");
        for(var i = 0; i < $inputs.length; i++){
            $inputs[i].value = "";
            $("#" + $inputs[i].id + "_errTip").remove();
        }
        document.getElementById("dp_submit").value = "提交";
        //next();
    }

    function getValue(){
        return $el[0].value;
    }

    function init(eleId){
        queue.push(function(){
            id = eleId;
            id1 = "#" + eleId;
            $el = $(id1);
            reset();
            module(eleId);
            asyncTest("TestError",function(){
                Syn.click({clientX:10,clientY:10},"dp_submit",function(){
                    ok($el.parent().hasClass("showError"),"Show Error Style");
                    start();
                    next();
                });
            });
        });
    }

    function testStyle(name, isError, input, needReset) {
        queue.push(function() {
            if (needReset === undefined || needReset === true) {
                reset();
            }
            asyncTest(name, function() {
                expect(1);
                type(input, id, function() {
                    Syn.click({},"dp_submit",function(){
                        equal($el.parent().hasClass("showError"), isError, "Error Style");
                        start();
                        next();
                    });
                });
            });
        });
    }

    function testStyleVal(name, isError, input, expectVal, needReset) {
        queue.push(function() {
            if (needReset === undefined || needReset === true) {
                reset();
            }
            asyncTest(name, function() {
                expect(2);
                type(input, id, function() {
                    Syn.click({},"dp_submit",function(){
                        equal($el.parent().hasClass("showError"), isError, "Error Style");
                        equal(getValue(), expectVal, "Revised Value");
                        start();
                        next();
                    });
                });
            });
        });
    }

    //封装Syn.type
    function type(str,id,callback){
        Syn.type(str,id,function(){
            $("#" + id).trigger("input");//触发针对非IE的input事件
            setTimeout(callback,50);
        });
    }

    var click = Syn.click;

    function clickBlank(){
        Syn.click({clientX:10,clientY:10},"blank");
    }

    //必须在每个case异步执行结束的时候调用next
    function next(){ 
        var cur = queue.shift();
        if(cur){
            cur();
        }
    }

    //required
    init("dp_text1");
    testStyle("不为空", false, "123");

    //min max
    init("dp_text2");
    testStyle("长度不足",true,"s");
    testStyleVal("长度超出",false,"01234567890123","0123456789");
    testStyleVal("正确",false,"012345678","012345678");

    //email
    init("dp_email");
    testStyle("通过", false, "abc@sogou-inc.com");
    testStyle("失败", true, "test");

    //idcard
    init("dp_idCard");
    testStyleVal("失败", true, "word123","123");
    testStyle("通过", false, "100010000011111123");

    //reg
    init("dp_re");
    testStyle("失败", true, "tttt");
    testStyle("成功", false, "word");

    //启动
    next();
    
});