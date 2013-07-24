$(document).ready(function() {
	vld = new Validator([{
		field: "testInput1",
		rule: "required&number[2]&ge[0]&le[10]",//规则之间用&表示"与"关系
		msg: "错误消息1",
	}, {
		field: "testInput2",
		rule: "required&number[2]&ge[0]&le[10]",
		msg: "错误消息2",
		dynamicVld: true //是否动态验证，不填为否
	}], {
		vldOnclick: "#check", //点击哪个button时触发验证
		vldOnBlur: false, //失去焦点时自动验证
		errorClass: "error", //错误时input应用的样式
		errorLocClass: "showError", //错误时errorMsg应用的样式
		timer: false //使用定时器还是keydown
	});
});