var Util = {};

/* 获取光标位置 */
Util.getCursorPosition = function($el) {
    if ($el.length == 0) return -1;
    return Util.getSelectionStart($el);
};
Util.setCursorPosition = function($el,position) {
    if ($el.length == 0) return $el;
    return Util.setSelection($el, position, position);
};
Util.getSelectionStart = function($el) {
    if (Util.length == 0) return -1;
    var input = $el[0];

    var pos = input.value.length;

    if (input.createTextRange) {
        var r = document.selection.createRange().duplicate();
        r.moveEnd('character', input.value.length);
        if (r.text == '')
            pos = input.value.length;
        pos = input.value.lastIndexOf(r.text);
    } else if (typeof(input.selectionStart) != "undefined")
        pos = input.selectionStart;

    return pos;
};
Util.setSelection = function($el, selectionStart, selectionEnd) {
    if ($el.length == 0) return $el;
    input = $el[0];

    if (input.createTextRange) {
        var range = input.createTextRange();
        range.collapse(true);
        range.moveEnd('character', selectionEnd);
        range.moveStart('character', selectionStart);
        range.select();
    } else if (input.setSelectionRange) {
        input.focus();
        input.setSelectionRange(selectionStart, selectionEnd);
    }
    return $el;
};

/*
 * 获取元素位置
 * @param elmId {string}   元素id
 * @return result {object} 包含left,top,width,height
 */

Util.getElmLoc = function($el) {
    var result = {};
    var elm = $el;

    result["left"] = elm.offset().left;
    result["top"] = elm.offset().top;
    result["width"] = elm.width()+4;
    result["height"] = elm.height()+6;

    return result;
};

/*
 * 设置error tip的位置
 * @param:elmId {string}  目标input的ID
 * @param:tip   {$obj}    提示tip的$元素
 * @param:tipDir {string} tip位置,up,down,left,right之一
 * @param:left   {number} 单个tip标签的左侧偏移量
 * @param:top    {number} 单个tip标签的上方偏移量
 */

Util.setTipLoc = function($el, tip, tipDir, left, top, opts) {
    if(opts == null||opts == undefined){
        opts = {
            tipDir:null,
            tipOffset:null
        };
    }
    if (!opts.tipDir && !tipDir) return;
    var elmLoc = Util.getElmLoc($el);
    var tipWidth = tip[0].offsetWidth;
    var tipHeight = tip[0].offsetHeight;
    var result = {};
    var offsetTop = (opts.tipOffset && opts.tipOffset.top ? opts.tipOffset.top : 0) + (top ? top : 0);
    var offsetLeft = (opts.tipOffset && opts.tipOffset.left ? opts.tipOffset.left : 0) + (left ? left : 0);
    var dir = tipDir ? tipDir : opts.tipDir;
    if (dir == "up") {
        result["top"] = elmLoc["top"] - tipHeight + offsetTop;
        result["left"] = elmLoc["left"] + offsetLeft;
    } else if (dir == "left") {
        result["top"] = elmLoc["top"] + (elmLoc["height"] - tipHeight) / 2 + offsetTop;
        result["left"] = elmLoc["left"] - tipWidth + offsetLeft;
    } else if (dir == "down") {
        result["top"] = elmLoc["top"] + elmLoc["height"] + offsetTop;
        result["left"] = elmLoc["left"] + offsetLeft;
    } else if (dir == "right") {
        result["top"] = elmLoc["top"] + (elmLoc["height"] - tipHeight) / 2 + offsetTop;
        result["left"] = elmLoc["left"] + elmLoc["width"] + offsetLeft;
    } else if(dir == "none"){
        return;
    } else {
        throw new Error("tipDir设置错误！")
        return;
    }
    tip.offset(result);
};

//获取元素的z-index坐标
Util.getZIndex = function($elm){
    if($elm[0].tagName.toLowerCase() == "body"){
        return 1;
    }
    var z = $elm.css("z-index");
    if(z == "auto") {
        z = Util.getZIndex($elm.parent());
    }
    return z;
};