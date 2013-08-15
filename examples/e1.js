define(function(require,exports,module){
    require("jquery");
    var Validator = require("Validator");

    $(document).ready(function() {
        ValidatorDefaults({
            vldOnBlur: true, //失去焦点时自动验证,默认为true
            //errorClass: "error", //错误时input应用的样式
            checkOnError: true, //发生错误后进行实时校验
            timer: false, //使用定时器还是keydown,默认使用定时器
            defaultMsg: "默认错误消息",
            limiter:{
                defaultTpl:"还剩{remain}个字节"
            },
            tipOffset:{
                left:150
            },
            //tipDir:"none",//默认右侧，设置为none不显示
            //autoRevise: true
        });
        vld = new Validator([{
            field: $("#testInput1"),
            rule: ["required","number[2]","ge[0]","le[10]"],//规则之间用&表示"与"关系
            //errorLoc: $("#errorMsg1"),
            msg: "错误消息1",
            limiter:{
                wrapper:"#wrapper1",
                max:50
            }
        }, {
            field: $("#testInput2"),
            rule: ["required","number[2]","ge[0]","le[10]"],
            msg: "错误消息2",
            dynamicVld: true, //是否动态验证，不填为否
            limiter:{
                wrapper:"#wrapper2",
                max:50
            }
        }], {});
        $("#check").on("click",function(){
            vld.validateAll();
            alert(vld.isPassed()); //是否全部通过验证
            if(window && window.console){
                console.log(vld.results());
            }
        });
        $("#revise").on("click",function(){
            return vld.revise(true);
        });
    });
});
