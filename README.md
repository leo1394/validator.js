#validator.js

依赖库

  - jQuery
  - Mustache
  - limiter

## 使用说明

### 集合验证
```js
$(function() {
    vld=new $.Validator([
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
	vld.start();
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
