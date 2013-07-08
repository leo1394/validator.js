#validator.js

依赖库

  - jQuery
  - Mustache
  - limiter

## 使用说明

### 集合验证
```js
$(function() {
    validator = new $.Validator([
	    {
		    field: "text1",
			rule: "required",
			msg: "该项必填",
	    }, 
	    {
			field: "text2",
			rule: "min[3]&max[10]",
			msg: "长度必须在3到10之间",
			tipOffset: {
				left: 50,
	    	},
			limiter: {
				wrapper: "#limiter_text2",
				max: 10
			}
	    }], 
	    {
	      	vldOnclick: "submit",
			vldOnBlur: true,
			vldOnEnter: true,
			errorField: "errField",
			errorClass: "error",
			tipDir: "right",
			tipOffset: {
				left: 5,
		    } 
	    });
	validator.start();
});
```
#### Validator构造函数
Validator构造函数接受两个参数,第一个为数组,表示需要验证的规则集合,第二个为object类型的options,表示全局的设置.

#### 数组的设置
每一个数组元素为如下格式的object：
```js
{
	field: '', //需要验证的input的标签的id
	rule: '', //验证规则
	msg: '', //验证失败后的错误提示信息
	tipDir:'', //Error Tip的位置,up,down,left,right之一
	tipOffset: {
		left: '', //Error Tip距离原始位置的左偏移量
		top: '' //Error Tip距离原始位置的上偏移量
	},
	limiter: {
		//limiter.js设置
	}
}
```

#### options的设置及默认值
```js
{
	vldOnclick: null, //type：DOM元素，点击某个button时验证
	vldOnBlur: false, //元素失去焦点时验证
	vldOnEnter: false, //input中按下enter时验证
	errorFiled: null, //集中显示错误信息的区域。
	errorClass: "", //错误时input标签应用的css样式
	errTipTpl: "<div class='errorTip' id='{{id}}' style='z-index:0;position:absolute;'>{{message}}</div>", //错误Tip模板
	tipDir: "right", //错误tip的显示位置，可选up,down left,right,关闭tip的话设置为false
	tipOffset: null, //错误tip显示位置的偏移量，需要包含left和top
	trigger: [{      //检验功能的触发器
		elm: "#submit2",
		event: "mousemove"
	}]
}
```

> 通过检验Validator.isPassed()确认验证是否通过.

> 除了设定的事件被触发时会进行验证，也可通过代码调用验证功能：`vld.validateAll()`.

### 单个Input验证

最佳实践

```js
$("#sText1").validator({
    rule: "required",
    trigger: [
    {
        event: "blur"
    },
    {
        elm:"#sSubmit",
        event: "click"
    }],
    tipOffset:{
        left:5
    },
    msg:"此项必填",
    errorClass: "error",
    parent: ".popup"
});
```
validator接受一个参数作为验证规则。格式如下：

```js
{
    rule: '', //验证规则,
    trigger: [{
        elm:'', //元素ID,若省略则是当前input
        event:'', //事件名称
    },
    {
        ...
    }],
    checkOnError: '', //验证时候以后将验证绑定到keyup事件,
    tipDir: '', //errorTip位置,
    tipOffset: {
        top:
        left:
    },
    errorClass: '' ,//错误时input标签应用的css样式,
    errTipTpl: '', //错误Tip模板
    errorLoc: '', //显示错误信息的DOM元素ID
    msg: '', //错误提示信息
    parent: '', //父节点$selector,为空的话自动指定为body
}
```

对于一些共用的参数，可以通过设置$.fn.validator.defaults的相应字段来进行统一设置（即设置默认值）。例如：
```js
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
```

除了设定的事件被触发时会进行验证，也可通过代码调用验证功能：
```js
var t2 = $("#sText2").validator({
    rule: "required&min[3]&max[10]",
    errorClass: "error",
    parent: ".popup"
});
t2.check();
```

### data-pattern方式验证
```js
<div id="item_email">
	<label for="dp_email">email:</label>
	<input type="text" id="dp_email" name="dp_email" data-pattern="required&email"/>
	<p class="errmsg">email格式错误</p>
</div>
	
$.Validator.dpShowErrClass = "showError";
$.Validator.dpValidate("item_email");
```

该方法对HTML格式有所要求：验证对象为一个item，该item有包含有一个input和一个p的DIV组成，其中input为待验证的标签，p为错误提示信息，p初始被隐藏

使用时首先指定一个$.Validator.dpShowErrClass，值为一个css类名，并需要指定如下形式的css样式：
```js
.showError .errmsg{
	display:block;
}
```
其中showError为$.Validator.dpShowErrClass，errmsg为div中p标签的样式.
该css表示当验证失败时为div添加的class，因此可以将其他的验证失败效果添加其中。如：
```
.showError input{
	background-color: #FFFFCC;
	border:1px dotted red;
}
```
表示了验证失败时input的样式

$.Validator.dpValidate()方法接受div的id作为参数

其他可设置的属性为：
```js
$.Validator.dpAutoListen = true;//验证失败后是否自动监听
$.Validator.dpInterval = 100;//监听间隔
```

### 附:支持的rule
```js
required: 必填
min: 最小长度,用方括号表示阈值,min[5]
max: 最大长度,用方括号表示阈值,max[5]
email: Email
phone: 座机
mobile: 手机
url: URL
alphanumeric: 只能为字母或数字
alphanumeric_space: 只能为字母数字空格下划线
number: 只能为数字
alpha: 只能为字母
alpha_space: 只能为字母空格下划线
lt: 小于,参数用方括号表示,参数可以为具体值,也可以为某个label,用jQuery方式表示,如lt[5],lt[#text1]
gt: 大于,参数用方括号表示,参数可以为具体值,也可以为某个label,用jQuery方式表示,如gt[5],gt[#text1]
equal: 等于,参数用方括号表示,参数可以为具体值,也可以为某个label,用jQuery方式表示,如equal[5],equal[#text1]
le: 小于等于,参数用方括号表示,参数可以为具体值,也可以为某个label,用jQuery方式表示,如le[5],le[#text1]
ge: 大于等于,参数用方括号表示,参数可以为具体值,也可以为某个label,用jQuery方式表示,如ge[5],ge[#text1]
idCard: 身份证格式
regexp: 自定义的正则表达式（string类型）
```
除了上面列举的各个内置判断规则，集合验证和单个input验证还可以使用自定义的正则表达式(RegExp类型)或者自定义判别函数.如:
```
{
    field: "regexp",
    rule: /word/ig,
    msg: "不满足自定义的正则表达式"
}
或
{
    field: "custom_func",
    rule: function(){
        return $("#custom_func")[0].value=="test"?true:false;
    },
    msg: "不满足自定义的函数"
}
```