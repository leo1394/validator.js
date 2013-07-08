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
