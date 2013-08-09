define(function(require,exports,model){
    require("Validator");
    require("jquery");

    $(function() {
        /*
         * 设置Validator
         */
        $("#popup").bind("click", function() {
            var popup = $(".popup");
            var bodyWidth = $("body").width();
            var bodyHeight = $("body").height();
            var width = popup.width();
            var height = popup.height();
            var top = (bodyHeight - height) / 2;
            var left = (bodyWidth - width) / 2;
            popup.css({
                display: "block",
                "top": top,
                "left": left
            });
        })
        $("#sClose").bind("click", function() {
            $(".popup").css("display", "none");
        });

        vld = new Validator([{
            field: "#text1",
            rule: ["required","max[10]"],
            msg: "该项必填",
            tipDir: "left",
            tipOffset: {
                left: -50,
            },
            dynamicVld: true
        }, {
            field: "#text2",
            rule: ["min[3]","max[10]"],
            msg: "长度必须在3到10之间",
            tipOffset: {
                left: 50,
            },
            dynamicVld: true
        }, {
            field: "#email",
            rule: ["required","email","max[20]"],
            msg: "Email地址不合法",
            tipOffset: {
                left: 50
            },
        }, {
            field: "#phone",
            rule: ["phone","required"],
            msg: "电话号码格式错误",
            dynamicVld: true
        }, {
            field: "#mobile",
            rule: ["mobile","required"],
            msg: "手机号码格式错误",
            dynamicVld: true
        }, {
            field: "#url",
            rule: ["required","url"],
            msg: "url格式错误"
        }, {
            field: "#number",
            rule: ["required","number"],
            msg: "只能是数字",
            dynamicVld: true
        }, {
            field: "#alpha",
            rule: ["required","alpha"],
            msg: "只能是字母",
            dynamicVld: true
        }, {
            field: "#alpha_underline",
            rule: ["required","alpha_underline"],
            msg: "只能是字母或空格",
            dynamicVld: true
        }, {
            field: "#alphanumeric",
            rule: ["required","alphanumeric"],
            msg: "只能是数字或字母",
            dynamicVld: true
        }, {
            field: "#alphanumeric_underline",
            rule: ["required","alphanumeric_underline"],
            msg: "只能是数字、字母、空格、下划线",
            dynamicVld: true
        }, {

            field: "#lt",
            rule: ["required","lt[100]"],
            msg: "必须小于100",
            dynamicVld: true
        }, {
            field: "#gt",
            rule: ["required","gt[100]"],
            msg: "必须大于100",
            dynamicVld: true
        }, {
            field: "#equal",
            rule: ["required","equal[0.5]"],
            msg: "必须等于0.5",
            dynamicVld: true
        }, {
            field: "#le",
            rule: ["required","le[-100]"],
            msg: "必须小于等于-100",
            dynamicVld: true
        }, {
            field: "#ge",
            rule: ["required","ge[-100]"],
            msg: "必须大于等于-100",
            dynamicVld: true
        // }, {
        //     field: "only",
        //     rule: ["only[a-zA-Z0-9.,:!@#$%^&*()\\\'\"]","required"],
        //     msg: "必须填入指定字符",
        //     dynamicVld: true
        // }, {
        //     field: "exclude",
        //     rule: ["exclude[a-zA-Z0-9.,:!@#$%^&*()\\\'\"]","required"],
        //     msg: "不能填入非法字符，且不能为空",
        //     dynamicVld: true
        }, {
            field: "#trad2simp",
            rule: ["trad2simp","required"],
            msg: "包含繁体字",
            dynamicVld: true
        }, {
            field: "#regexp",
            rule: /word/ig,
            msg: "不满足自定义的正则表达式"
        }, {
            field: "#custom_func",
            rule: function() {
                return $("#custom_func")[0].value == "test" ? true : false;
            },
            msg: "不满足自定义的函数"
        }, {
            field: "#text",
            rule: ["required","textarea[rows5&length20&noBlankLine&noRepeat&noBlankHead&noBlankRear]"],
            msg: "不满足textarea格式要求",
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
            revisedVal: true
            //listenScroll:false,
        });

        //vld.validateAll();

        $("#submit").bind("click", function() {
            if (!vld.isPassed()) {
                return;
            }
            alert("通过检验!");
        });


        /****************************Unit Test******************************/
        var $el;
        var id;
        var id1;
        var original = $(".outer").html();
        var jobs = 0;
        var queue = [];
        var $inputs = $("input[type='text']");

        function reset() {
            $inputs.removeClass("error");
            for (var i = 0; i < $inputs.length; i++) {
                $inputs[i].value = "";
            }
            //next();
        }

        function getValue() {
            return $el.val();
        }

        function init(eleId) {
            queue.push(function() {
                id = eleId;
                id1 = "#" + eleId;
                $el = $(id1);
                reset();
                module(eleId);
                asyncTest("TestError", function() {
                    Syn.click({}, id, function() {
                        Syn.click({
                            clientX: 10,
                            clientY: 10
                        }, "blank", function() {
                            ok($el.hasClass("error"), "Show Error Style");
                            start();
                            next();
                        });
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

        function type(str, id, callback) {
            Syn.type(str, id, function() {
                $("#" + id).trigger("input"); //触发针对非IE的input事件
                setTimeout(callback, 50);
            });
        }

        var click = Syn.click;

        function clickBlank() {
            Syn.click({
                clientX: 10,
                clientY: 10
            }, "blank");
        }

        //必须在每个case异步执行结束的时候调用next

        function next() {
            var cur = queue.shift();
            if (cur) {
                cur();
            }
        }

        //Test cases

        //required
        init("text1");
        testStyle("required", false, "s");
        testStyle("cut exceeding char", false, "omething123", false);

        //min max
        init("text2");
        testStyle("长度不足", true, "s");
        testStyleVal("长度超出", false, "01234567890123", "0123456789");
        testStyleVal("正确", false, "012345678", "012345678");

        //Email
        init("email");
        testStyle("错误格式", true, "12345678");
        testStyle("正确格式", false, "abc@sogou-inc.com");


        //phone
        init("phone");
        testStyle("长度不足", true, "1234");
        testStyle("长度超出", true, "1234567890123");
        testStyleVal("非法字符", true, "012-3<>4567//.890123", "012-34567890123");
        testStyleVal("正确", false, "010-52436665-4665", "010-52436665-4665");

        //mobile
        init("mobile");
        testStyle("长度不足", true, "1234");
        testStyle("长度超出", true, "1234567890123");
        testStyleVal("非法字符", true, "012-3<>4567//.890123", "012-34567890123");
        testStyleVal("正确", false, "010-13456789000", "010-13456789000");

        //url
        init("url");
        testStyle("错误", true, "1234");
        testStyle("正确", false, "http://www.baidu.com");

        //number
        init("number");
        testStyleVal("非法字符", false, "1234!@#$ADFC", "1234");

        //alpha
        init("alpha");
        testStyleVal("非法字符", false, "1234!@#$ADFC", "ADFC");

        //alpha_underline
        init("alpha_underline");
        testStyleVal("非法字符", false, "1234!@#$AD_FC__", "AD_FC__");

        //alphanumeric
        init("alphanumeric");
        testStyleVal("非法字符", false, "1234!@#$AD_FC__", "1234ADFC");

        //alphanumeric_underline
        init("alphanumeric_underline");
        testStyleVal("非法字符", false, "1234!@#$AD_FC__", "1234AD_FC__");

        //lt
        init("lt");
        testStyleVal("非法字符", true, "1234!@#$AD_FC__", "1234");
        testStyleVal("正确", false, "98", "98");

        //gt
        init("gt");
        testStyleVal("非法字符", true, "12!@#$AD_FC__", "12");
        testStyleVal("正确", false, "101", "101");

        //equal
        init("equal");
        testStyleVal("非法字符,数值正确", false, "0.5AAAA!@#$^&*", "0.5AAAA!@#$^&*");

        //le
        init("le");
        testStyle("非法字符,数值正确", false, "-101AAAA!@#$^&*", "-101");

        //ge
        init("ge");
        testStyleVal("非法字符,数值正确", false, "-99AAAA!@#$^&*", "-99");
        testStyleVal("相等", false, "-100", "-100");

        //include
        // init("include");
        // testStyleVal("非法字符", false, "abcdefg1234567!@#$%^&<>?", "abcdefg1234567!@#$%^&");

        // //exclude
        // init("exclude");
        // testStyleVal("非法字符", false, "abcdefg1234567!@#$%^&<>?", "<>?");

        //trad2simp
        init("trad2simp");
        testStyleVal("转换", false, "中華人民共和國", "中华人民共和国");

        //regexp
        init("regexp");
        testStyle("通过", false, "word111");
        testStyle("失败", true, "test");

        //custom_func
        init("custom_func");
        testStyle("失败", true, "word");
        testStyle("通过", false, "test");

        init("text")
        var testValue = "  sogou-inc.com  \n" + " Haidian District \n" + "    \n" + "   \n" + "Beijing\n" + "China\n" + "\n" + "\n" + "Beijing\n" + "\n" + "\n" + "0123456789012345678901234567890\n" + "BIZTECH\n" + "\n";
        var resultValue = "sogou-inc.com\n" + "Haidian District\n" + "Beijing\n" + "China\n" + "01234567890123456789";
        testStyleVal("综合测试", false, testValue, resultValue)

        //启动
        next();
    });

});
