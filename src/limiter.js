/* Limiter定义 */
function Limiter(target, options) {
    var me = this;
    me.options = $.extend({}, Limiter.prototype.defaults, options);
    me.$target = $(target);
    me.$wrapper = $(me.options.wrapper);
    me.render();
};

Limiter.prototype = {
    /**
     * 运行
     */
    render: function() {
        var me = this;
        me.$target = this.$target;
        if (!me.$target)
            return false;
        me.options.tpl = me.options.defaultTpl;
        me.count();
    },

    setOptions: function(options) {
        var me = this;
        me.options = $.extend(me.options, options);
        me.$wrapper = $(me.options.wrapper);
    },

    getlen: function() {
        var me = this;
        var trimer = new RegExp("(^[\\s\\t\\xa0\\u3000]+)|([\\u3000\\xa0\\s\\t]+\x24)", "g");
        var trimString = function(source) {
            var ignore = me.options.ignore;
            if (ignore) {
                for (var i = 0; i < ignore.length; i++) {
                    var rs = [];
                    for (j = 0; j < source.length; j++) {
                        if (source.charAt(j) !== ignore.charAt(i)) {
                            rs.push(source.charAt(j));
                        }
                    }
                    source = rs.join('');
                }
            }
            return String(source).replace(trimer, "");
        };
        var $target = this.$target;
        var val = trimString($target.val());
        var trim = me.options.trim;
        if (trim && typeof(trim) == 'function') {
            val = trim(val);
        }
        var isRejectTag = me.options.isRejectTag;
        var isEnToCn = me.options.isEnToCn;
        //过滤html标签
        if (isRejectTag) val = val.replace(/<[^>]*>/g, "");
        var len = val.length;
        val.replace(/[\u0080-\ufff0]/g, function() {
            len++;
        });
        //中文转换
        if (isEnToCn) {
            val = val.replace(/[^\x00-\xff]/g, "**");
            len = Math.ceil(val.length / 2);
        }
        return len;
    },

    /**
     * 字数统计
     */
    count: function() {
        var me = this;
        me.$target = this.$target;
        var len = me.getlen();
        var max = me.options.max;
        var defaultTpl = me.options.defaultTpl;
        var exceedTpl = me.options.exceedTpl;
        var tpl = len > max && exceedTpl || defaultTpl;
        //截断处理
        var isCut = me.options.isCut;
        if (isCut) {
            tpl = defaultTpl;
            me._cutText();
        }
        //设置模板
        me.options.tpl = tpl;
        me._create();
    },

    /**
     * 截断文案
     */
    _cutText: function() {
        var me = this;
        var isCut = me.options.isCut;
        if (!isCut) return false;
        var len = me.getlen();
        var max = me.options.max;
        $target = this.$target;
        if (len > max) {
            var val = $target.val();
            while (me.getlen() > max) {
                val = $target.val();
                val = val.substr(0, val.length - 1);
                $target.val(val);
            }
        }
    },

    /**
     * 创建字数统计文字
     **/
    _create: function() {
        var me = this,
            $wrapper = this.$wrapper,
            $target = this.$target,
            tpl = me.options.tpl,
            len = me.getlen(),
            max = me.options.max,
            html;
        if (!$target.length) return false;

        function substitute(str, o, regexp) {
            return str.replace(regexp || /\\?\{([^{}]+)\}/g, function(match, name) {
                if (match.charAt(0) === '\\') {
                    return match.slice(1);
                }
                return (o[name] === undefined) ? "" : o[name];
            });
        }
        html = substitute(tpl, {
            len: len,
            max: max,
            remain: Math.abs(max - len)
        });
        $wrapper.html(html);
    }


};

Limiter.prototype.defaults = {
    /**
     * 字数统计的容器元素
     * @type NodeList
     * @default ""
     */
    wrapper: "",

    /**
     * 目标元素，比如文本框
     * @type NodeList
     * @default ""
     */
    target: "",
    /**
     * 元素
     * @type NodeList
     * @default ""
     */
    el: "",
    /**
     * 字数统计使用的模板（未超出字数和超出字数的情况是不一样的）
     * @type String
     * @default ""
     */
    tpl: "",
    /**
     * 字数统计默认模板
     * @type String
     * @default "<span class="ks-letter-count">您还可以输入<em class="J_LetterRemain">{remain}</em>个字</span>"
     */
    defaultTpl: '<span class="ks-letter-count"><em class="J_LetterRemain">{remain}</em>字节</span>',
    /**
     * 超出字数后的模板
     * @type String
     *  @default "<span class="ks-letter-count">已经超出<em class="J_LetterRemain exceed-letter">{remain}</em>个字</span>"
     */
    exceedTpl: '<span class="ks-letter-count-exceed">超出<em class="J_LetterRemain exceed-letter">{remain}</em>字节</span>',
    /**
     * 最大允许输入的字数，超出的临界点
     * @type Number
     * @default 50
     */
    max: 50,
    /**
     * 字数，只读属性
     * @type Number
     * @default 0
     */
    len: 0,

    /**
     * 算字数时是否排除html标签（富编辑器一般需要把html标签所占的字数去掉）
     * @type Boolean
     * @default false
     */
    isRejectTag: false,
    /**
     * 将英文算成半个汉字
     * @type Boolean
     * @default false
     */
    isEnToCn: false,
    /**
     * 超过最大字数时予以截断
     * @type Boolean
     * @default false
     */
    isCut: false
};
