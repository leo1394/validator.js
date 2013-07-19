$(function() {

    $("#popup").bind("click",function(){
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
    $("#sClose").bind("click",function(){
        $(".popup").css("display","none");
    });

    vld = new $.Validator.validate([{
            field: "text1",
            rule: "required&max[10]",
            msg: "该项必填",
            tipDir: "left",
            tipOffset: {
                left: -50,
            },
            limiter: {
                wrapper: "#limiter_text1",
                max: 10
            },
            dynamicVld:true
        }, {
            field: "text2",
            rule: "min[3]&max[10]",
            msg: "长度必须在3到10之间",
            tipOffset: {
                left: 50,
            },
            limiter: {
                wrapper: "#limiter_text2",
                max: 10
            },
            dynamicVld:true
        }, {
            field: "email",
            rule: "required&email&max[20]",
            msg: "Email地址不合法",
            tipOffset: {
                left: 50
            },
            limiter: {
                wrapper: "#limiter_email",
                max: 20
            }
        }, {
            field: "phone",
            rule: "phone&required",
            msg: "电话号码格式错误",
        }, {
            field: "mobile",
            rule: "mobile&required",
            msg: "手机号码格式错误"
        }, {
            field: "url",
            rule: "required&url",
            msg: "url格式错误"
        }, {
            field: "number",
            rule: "required&number",
            msg: "只能是数字",
            dynamicVld:true
        }, {
            field: "alpha",
            rule: "required&alpha",
            msg: "只能是字母",
            dynamicVld:true
        }, {
            field: "alpha_underline",
            rule: "required&alpha_underline",
            msg: "只能是字母或空格",
            dynamicVld:true
        }, {
            field: "alphanumeric",
            rule: "required&alphanumeric",
            msg: "只能是数字或字母",
            dynamicVld:true
        }, {
            field: "alphanumeric_underline",
            rule: "required&alphanumeric_underline",
            msg: "只能是数字、字母、空格、下划线",
            dynamicVld:true
        }, {

            field: "lt",
            rule: "required&lt[100]",
            msg: "必须小于100"
        }, {
            field: "gt",
            rule: "required&gt[#lt]",
            msg: "必须大于'小于'的值"
        }, {
            field: "equal",
            rule: "required&equal[0.5]",
            msg: "必须等于0.5"
        }, {
            field: "le",
            rule: "required&le[#gt]",
            msg: "必须小于等于'大于'的值"
        }, {
            field: "ge",
            rule: "required&ge[#gt]",
            msg: "必须大于等于'大于'的值",
            dynamicVld: true
        }, {
            field: "only",
            rule: "only[a-zA-Z0-9.,:!@#$%^&*()\\\'\"]&required",
            msg: "必须填入指定字符",
            dynamicVld: true
        },{
            field: "exclude",
            rule: "exclude[a-zA-Z0-9.,:!@#$%^&*()\\\'\"]&required",
            msg: "不能填入非法字符，且不能为空",
            dynamicVld: true
        },{
            field: "trad2simp",
            rule: "trad2simp&required",
            msg: "包含繁体字",
            dynamicVld: true
        },{
            field: "regexp",
            rule: /word/ig,
            msg: "不满足自定义的正则表达式"
        }, {
            field: "custom_func",
            rule: function() {
                return $("#custom_func")[0].value == "test" ? true : false;
            },
            msg: "不满足自定义的函数"
        },{
            field:"text",
            rule:"required&textarea[rows5&length20&noBlankLine&noRepeat&noBlankHead&noBlankRear]",
            msg:"不满足textarea格式要求",
            dynamicVld:true
        }
    ], {
        vldOnclick: "#submit",
        vldOnBlur: true,
        vldOnEnter: true,
        errorField: "errField",
        errorClass: "error",
        tipDir: "right",
        tipOffset: {
            left: 5,
        },
        trigger: [{
            elm: "#submit2",
            event: "mousemove"
        }],
        timer:false
        //listenScroll:false,
    });

    //vld.validateAll();

    $("#submit").bind("click", function() {
        if (!vld.isPassed()) {
            return;
        }
        alert("通过检验!");
    });


    /*************************************/
    /*单个验证*/

    $("#sText1").validator({
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
        errorClass: "error",
        parent: ".popup",
        dynamicVld: true
    });
    var t3 = $("#sText3").validator({
        rule: /word/ig,
        trigger: [{
                event: "blur"
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
        t2.check();
        t3.check();
        t4.check();
    });

    /*************************************/
    /*data-pattern验证*/
    
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

    //集合验证 by name
    // $("#dp_submit").bind("click", function(){
    //     var results = $.Validator.dpValidate("item_text1","item_text2","item_email","item_re");
    // });

    //数组验证 by name
    // $("#dp_submit").bind("click", function(){
    //     var results = $.Validator.dpValidate(["item_text1","item_text2","item_email","item_re"]);
    // });
    // 
    
});