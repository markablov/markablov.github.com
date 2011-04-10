(function($)
{
    var methods = {
        addline: function(pos, start)
        {
            var _self = this[0];
            var linebox;
            if (pos == -1)
            {
                // в конец списка
                linebox = $('<div />').addClass('codeeditor_linebox').appendTo(this);
                linebox.append('<div class = "codeeditor_lineno">' + _self.lineCount + '</div>');
            }
            else
            {
                // вставляем после указанной позиции
                linebox = $('<div />').addClass('codeeditor_linebox').insertAfter(this.children(':eq(' + pos + ')'));
                linebox.append('<div class = "codeeditor_lineno">' + (pos + 1) + '</div>');
            }
            var line = $('<input type = text class = "codeeditor_line" autocomplete = "off"/>');
            if (start)
                line.val(start);
            line.appendTo(linebox);
            line.keyup(function(e)
            {
                var sel, len;
                switch (e.keyCode)
                {
                // enter
                case 13:
                    var newLine = $(this).parent().parent().codeEditor('addline', _self.currentLine);
                    // перебираем все строки, после нововставленной
                    newLine.parent().nextAll().children('.codeeditor_lineno').each(function()
                    {
                        $(this).text(parseInt($(this).text()) + 1);
                    });
                    sel = this.selectionStart;
                    newLine.val($(this).val().substr(sel));
                    $(this).val($(this).val().substr(0, sel));
                    newLine[0].setSelectionRange(0, 0);
                    newLine.focus();
                    _self.currentLine++;
                    break;
                // стрелка вниз
                case 40:
                    if (_self.currentLine < _self.lineCount - 1)
                    {
                        sel = this.selectionStart;
                        nextLine = $(this).parent().next().children('.codeeditor_line');
                        len = nextLine.val().length;
                        if (len < sel)
                            sel = len;
                        nextLine[0].setSelectionRange(sel, sel);
                        nextLine.focus();
                        _self.currentLine++;
                    }
                    break;
                // стрелка вверх
                case 38:
                    if (_self.currentLine > 0)
                    {
                        sel = this.selectionStart;
                        var prevLine = $(this).parent().prev().children('.codeeditor_line');
                        len = prevLine.val().length;
                        if (len < sel)
                            sel = len;
                        prevLine[0].setSelectionRange(sel, sel);
                        prevLine.focus();
                        _self.currentLine--;
                    }
                    break;
                }
            });

            var keyaction = function(e)
            {
                // подавляем tab
                if (e.keyCode == 9)
                {
                    e.preventDefault();
                } else if (e.keyCode == 8)
                {
                    // backkspace
                    if (_self.currentLine == 0)
                        return true;
                    if (this.selectionStart == 0 && this.selectionEnd == 0)
                    {
                        // удаляем строку
                        var deletedLine = $(this).parent();
                        // перебираем все строки, после удаленной
                        deletedLine.nextAll().children('.codeeditor_lineno').each(function()
                        {
                            $(this).text(parseInt($(this).text()) - 1);
                        });
                        var prevLine = deletedLine.prev().children('.codeeditor_line');
                        var prevLineVal = prevLine.val();
                        var sel = prevLineVal.length;
                        prevLine.val(prevLineVal + $(this).val());
                        prevLine.focus();
                        prevLine[0].setSelectionRange(sel, sel);
                        deletedLine.remove();
                        _self.currentLine--;
                        _self.lineCount--;
                        e.preventDefault();
                        return false;
                    }
                } else if (e.keyCode == 46)
                {
                    // delete
                    if (_self.currentLine == _self.lineCount - 1)
                        return true;
                    var val = $(this).val();
                    var text_len = val.length;
                    if (this.selectionStart == text_len && this.selectionEnd == text_len)
                    {
                        // удаляем строку
                        var nextLine = $(this).parent().next().children('.codeeditor_line');
                        // перебираем все строки, после удаленной
                        nextLine.parent().nextAll().children('.codeeditor_lineno').each(function()
                        {
                            $(this).text(parseInt($(this).text()) - 1);
                        });
                        $(this).val(val + nextLine.val());
                        this.setSelectionRange(text_len, text_len);
                        nextLine.parent().remove();
                        _self.lineCount--;
                        e.preventDefault();
                        return false;
                    }
                }
            };

            line.keydown(keyaction);
            _self.lineCount++;
            return line;
        },
        init : function(options)
        {
            var defaults =
            {
                start: ''
            };
            if (!options)
                options = defaults;
            var _self = this[0];
            _self.lineCount = 0;
            _self.currentLine = 0;
            _self.currentSelected = -1;
            this.addClass('codeeditor_area');
            this.codeEditor('addline', -1, options.start);
            _self.lineHeight = this.children().height();
            this.click(function(e)
            {
                // 5 - padding, 1 - border
                var lineNo = Math.round((e.pageY - $(this).offset().top + 5 - 1) / _self.lineHeight) - 1;
                if (lineNo >= _self.lineCount || lineNo < 0)
                    return ;
                _self.currentLine = lineNo;
            });
        },
        select: function(lineNo)
        {
            var current = this[0].currentSelected;
            if (current == lineNo)
                return ;
            this[0].currentSelected = lineNo;
            var linebox;
            if (current != -1)
            {
                linebox = $(this).children(':eq(' + current + ')');
                linebox.children('.codeeditor_line').removeClass('codeeditor_line_selected');
                linebox.removeClass('codeeditor_linebox_selected');
            }
            if (lineNo == -1)
                return ;
            linebox = $(this).children(':eq(' + lineNo + ')');
            linebox.children('.codeeditor_line').addClass('codeeditor_line_selected');
            linebox.addClass('codeeditor_linebox_selected');
        },
        getline: function(lineNo)
        {
            return this.children(':eq(' + lineNo + ')').children('.codeeditor_line').val();
        },
        linecount: function()
        {
            return this[0].lineCount;
        }
    };
    $.fn.codeEditor = function(method)
    {
        if (methods[method])
        {
          return methods[ method ].apply(this, Array.prototype.slice.call(arguments, 1));
        } else if (typeof method === 'object' || !method)
        {
          return methods.init.apply(this, arguments);
        }
    };
})(jQuery);