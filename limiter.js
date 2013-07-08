(function($) {

    var EMPTY = "";
    var Limiter = function(target, options) {
        var self = this;
        self.options = $.extend({}, options);
        self.$target = $(target);
        self.$wrapper = $(self.options.wrapper);
    };


    Limiter.prototype = {
        /**
         * 运行
         */
        render: function() {
            var self = this;
            self.$target = this.$target;
            if (!self.$target)
                return false;
            self.options.tpl = self.options.defaultTpl;
            self.count();
            self.$target.on('keyup blur', function(ev) {
                self.count();
            });
        },

        setOptions: function(options) {
            var self = this;
            self.options = $.extend(self.options, options);
            self.$wrapper = $(self.options.wrapper);
        },

        getlen: function() {
            var self = this;
            var trimer = new RegExp("(^[\\s\\t\\xa0\\u3000]+)|([\\u3000\\xa0\\s\\t]+\x24)", "g");
            var trimString = function(source) {
                var ignore = self.options.ignore;
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
            var trim = self.options.trim;
            if (trim && typeof(trim) == 'function') {
                val = trim(val);
            }
            var isRejectTag = self.options.isRejectTag;
            var isEnToCn = self.options.isEnToCn;
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

        _tr2Simple: function(trStr) {
            var rs = [];
            for (var i = 0; i < trStr.length; i++) {
                var isTr = false;
                for (var j = 0; j < SOGOU_TRADITIONAL_CHAR.length; j++) {
                    if (SOGOU_TRADITIONAL_CHAR.charAt(j) == trStr.charAt(i)) {
                        rs.push(SOGOU_SIMPLIFIED_CHAR.charAt(j));
                        isTr = true;
                        break;
                    }
                }
                if (!isTr) {
                    rs.push(trStr.charAt(i));
                }
            }
            return rs.join('');
        },

        /**
         * 字数统计
         */
        count: function() {
            var self = this;
            self.$target = this.$target;
            if (self.options.tr2Simple) {
                if (self._tr2Simple(self.$target.val()) !== self.$target.val()) {
                    var pos = self.$target.getInputSelectPosition();
                    self.$target.val(self._tr2Simple(self.$target.val()));
                    self.$target.setSelection(pos[0], pos[1]);
                }
            }
            var len = self.getlen();
            var max = self.options.max;
            var defaultTpl = self.options.defaultTpl;
            var exceedTpl = self.options.exceedTpl;
            var tpl = len > max && exceedTpl || defaultTpl;
            //截断处理
            var isCut = self.options.isCut;
            if (isCut) {
                tpl = defaultTpl;
                self._cutText();
            }
            //设置模板
            self.options.tpl = tpl;
            self._create();
        },

        /**
         * 截断文案
         */
        _cutText: function() {
            var self = this;
            var isCut = self.options.isCut;
            if (!isCut) return false;
            var len = self.getlen();
            var max = self.options.max;
            $target = this.$target;
            if (len > max) {
                var val = $target.val();
                while (self.getlen() > max) {
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
            var self = this,
                $wrapper = this.$wrapper,
                $target = this.$target,
                tpl = self.options.tpl,
                len = self.getlen(),
                max = self.options.max,
                html;
            if (!$target.length) return false;

            function substitute(str, o, regexp) {
                return str.replace(regexp || /\\?\{([^{}]+)\}/g, function(match, name) {
                    if (match.charAt(0) === '\\') {
                        return match.slice(1);
                    }
                    return (o[name] === undefined) ? EMPTY : o[name];
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


    /* LIMITER PLUGIN DEFINITION
     * ========================== */

    $.fn.limiter = function(option) {

        return this.each(function() {

            var $this = $(this);
            var options = $.extend({}, $.fn.limiter.defaults, option);

            if (this.textLimiter) {
                this.textLimiter.setOptions(option);
            } else {
                this.textLimiter = new Limiter(this, options);
            }
            this.textLimiter.render();
        });
    };

    $.fn.limiter.defaults = {
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

    $.fn.limiter.constructor = Limiter;


})($);