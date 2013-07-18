$(function() {

    $("#popup").bind("click",function(){
        var popup = $(".popup");
        var bodyWidth = $("body").width();
        var bodyHeight = $("body").height();
        var width = popup.width();
        var height = popup.height();
        var top = "100px";
        var left = (bodyWidth - width) / 2;
        popup.css({
            display: "block",
            "top": top,
            "left": left
        });
    })
    $("#sClose").bind("click",function(){
        $(".popup").css("display","none");
    });

    var t1 = $("#sText1").validator({
        rule: "required",
        trigger: [{
                event: "blur"
            },{
                elm:"#sSubmit",
                event: "click"
            }
        ],
        tipOffset:{
            left:5
        },
        msg:"此项必填",
        errorClass: "error",
        parent: ".popup"
    });
    var t2 = $("#sText2").validator({
        rule: "required&min[3]&max[10]",
        trigger: [{
                event: "blur"
            },{
                elm:"#sSubmit",
                event: "click"
            }
        ],
        errorClass: "error",
        parent: ".popup",
        dynamicVld: true
    });
    var t3 = $("#sText3").validator({
        rule: /word/ig,
        trigger: [{
                event: "blur"
            },{
                elm:"#sSubmit",
                event: "click"
            }
        ],
        tipOffset:{
            left:5
        },
        msg:"不满足自定义的正则表达式",
        errorClass: "error",
        parent: ".popup"
    });
    var t4 = $("#sText4").validator({
        rule: function() {
            return $("#sText4")[0].value == "test" ? true : false;
        },
        trigger: [{
                event: "blur"
            },{
                elm:"#sSubmit",
                event: "click"
            }
        ],
        tipOffset:{
            left:5
        },
        msg:"不满足自定义的函数",
        errorClass: "error",
        parent: ".popup"
    });

    $("#sSubmit").bind("click",function(){
        //手动验证
        t1.check();
        t2.check();
        t3.check();
        t4.check();
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
        document.getElementById("sSubmit").value = "提交";
        document.getElementById("sClose").value = "关闭";
        document.getElementById("popup").value = "弹出";
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
                Syn.click({clientX:10,clientY:10},"sSubmit",function(){
                    ok($el.hasClass("error"),"Show Error Style");
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
                    equal($el.hasClass("error"), isError, "Error Style");
                    start();
                    next();
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
                    equal($el.hasClass("error"), isError, "Error Style");
                    equal(getValue(), expectVal, "Revised Value");
                    start();
                    next();
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

    Syn.click({},"popup");

    //required
    init("sText1");
    testStyle("不为空", false, "123");

    //min max
    init("sText2");
    testStyle("长度不足",true,"s");
    testStyleVal("长度超出",false,"01234567890123","0123456789");
    testStyleVal("正确",false,"012345678","012345678");

    //regexp
    init("sText3");
    testStyle("通过", false, "word111");
    testStyle("失败", true, "test");

    //func
    init("sText4");
    testStyle("失败", true, "word");
    testStyle("通过", false, "test");

    //启动
    next();
    
});