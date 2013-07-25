define(function(require,exports,module){
	require("jquery");
	require("Validator");

	$(document).ready(function() {
		vld = new Validator([{
			field: $("#testInput1"),
			rule: "required&number[2]&ge[0]&le[10]",//规则之间用&表示"与"关系
			msg: "错误消息1"
		}, {
			field: $("#testInput2"),
			rule: "required&number[2]&ge[0]&le[10]",
			msg: "错误消息2",
			dynamicVld: true //是否动态验证，不填为否
		}], {
			vldOnclick: "#check", //点击哪个button时触发验证,jQuery selector格式
			vldOnBlur: false, //失去焦点时自动验证,默认为true
			errorClass: "error", //错误时input应用的样式
			checkOnError: true, //发生错误后进行实时校验
			//errorLocClass: "showError", //错误时errorMsg应用的样式
			timer: false, //使用定时器还是keydown,默认使用定时器
			defaultMsg: "默认错误消息"
		});
		$("#check").on("click",function(){
			alert(vld.isPassed()); //是否全部通过验证
			$.each(vld.results(), function(index,val){	//vld.passed,结果数组,[{field,result},...]
			    if(window.console){
			    	window.console.log(val);
			    }
			}) 
		});
	});
});
