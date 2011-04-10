/*
Собственно лексер, на вход получает объект stream, вида {s: '123', pos: 0, get: function(){}}
get - простая функция получения текушего символа (на позиции pos)
 */

function GetLex(stream)
{
    var len = stream.s.length;
    // End of Line
    if (len == stream.pos)
        return {type: LexTypes.LexEOL};
    var c = stream.get();
    stream.pos++;
    switch (c)
    {
        case ' ': return {type: LexTypes.LexWhitespace};
        case ':': return {type: LexTypes.LexColon};
        case '[': return {type: LexTypes.LexBracketSqLeft};
        case ']': return {type: LexTypes.LexBracketSqRight};
        case '*': return {type: LexTypes.LexAsterisk};
        case '+': return {type: LexTypes.LexPlus};
        case '-': return {type: LexTypes.LexMinus};
        case '/': return {type: LexTypes.LexDiv};
        case '%': return {type: LexTypes.LexMod};
        case ',': return {type: LexTypes.LexComma};
        case '&': return {type: LexTypes.LexRef};
        case '=':
            if (stream.pos == len || stream.get() != '=') return {type: LexTypes.LexAssign};
            stream.pos++;
            return {type: LexTypes.LexComp, op: CompOp.CompOpEq};
        case '!':
            if (stream.pos == len || stream.get() != '=') return {type: LexTypes.LexError};
            stream.pos++;
            return {type: LexTypes.LexComp, op: CompOp.CompOpUnEq};
        case '<':
            if (stream.pos == len || stream.get() != '=') return {type: LexTypes.LexComp, op: CompOp.CompOpLe};
            stream.pos++;
            return {type: LexTypes.LexComp, op: CompOp.CompOpLeEq};
        case '>':
            if (stream.pos == len || stream.get() != '=') return {type: LexTypes.LexComp, op: CompOp.CompOpGr};
            stream.pos++;
            return {type: LexTypes.LexComp, op: CompOp.CompOpGrEq};
    }
    // number?
    if (c <= '9' && c >= '0')
    {
        var num = c;
        while (stream.pos != len)
        {
            c = stream.get();
            if (c > '9' || c < '0')
                break;
            num += c;
            stream.pos++;
        }
        return {type: LexTypes.LexNumber, number: parseInt(num)};
    }
    // все остальные символы кроме a..z - некорректны
    if (c > 'z' || c < 'a')
        return {type: LexTypes.LexError};
    // ident
    var ident = c;
    while (stream.pos != len)
    {
        c = stream.get();
        if ((c > '9' || c < '0') && (c > 'z' || c < 'a'))
            break;
        ident += c;
        stream.pos++;
    }
    // проверяем что идент является ключевым словом
    if (ident == 'pop') return {type: LexTypes.LexKeywordPop};
    if (ident == 'push') return {type: LexTypes.LexKeywordPush};
    if (ident == 'goto') return {type: LexTypes.LexKeywordGoto};
    if (ident == 'in') return {type: LexTypes.LexKeywordIn};
    if (ident == 'out') return {type: LexTypes.LexKeywordOut};
    if (ident == 'var') return {type: LexTypes.LexKeywordVar};
    if (ident == 'if') return {type: LexTypes.LexKeywordIf};
    return {type: LexTypes.LexIdent, ident: ident};
}

/*
    Утилитарная функция, которая выводит в удобочитаемом виде содержимре javascript-переменной, аналог - print_r в php
 */
function dump(arr, level)
{
    var dumped_text = "";
    if (!level) level = 0;

    //The padding given at the beginning of the line.
    var level_padding = "";
    for (var j = 0; j < level + 1; j++) level_padding += "    ";

    if (typeof(arr) == 'object')
    { //Array/Hashes/Objects
        for (var item in arr)
        {
            var value = arr[item];

            if (typeof(value) == 'object')
            { //If it is an array,
                dumped_text += level_padding + "'" + item + "' ...\n";
                dumped_text += dump(value, level + 1);
            } else
            {
                dumped_text += level_padding + "'" + item + "' => \"" + value + "\"\n";
            }
        }
    } else
    { //Stings/Chars/Numbers etc.
        dumped_text = "===>" + arr + "<===(" + typeof(arr) + ")";
    }
    return dumped_text;
} 

/*
Сам синтаксический анализ
 */
function AnalyzeLine(str)
{
    // объект stream для лексического анализатора
    var stream = {s: str, pos: 0, get: function(){return this.s[this.pos];}};
    var stack = Array();
    var tree = Array();
    var acc = false, err = false;
    var lex = GetLex(stream);
    stack.push(0);
    while (!acc && !err)
    {
        var st = stack.pop();
        stack.push(st);
        if (lex.type == LexTypes.LexError)
            break;
        var action = ActionTable[LexTypes.nameById(lex.type)]['st' + st];
        if (typeof action == 'undefined')
            break;
        switch (action.type)
        {
        case ActionTypes.ActionAccepted:
            acc = true;
            break;
        case ActionTypes.ActionShift:
            stack.push(action.state);
            // lex.type = LexTypes.nameById(lex.type); // для отладки
            tree.push({type: 'leaf', lex: lex});
            lex = GetLex(stream);
            break;
        case ActionTypes.ActionReduce:
            var pop_count = action.rule_right;
            var parent = {};
            parent.type = 'node';
            // parent.nonterm = NonTerminals.nameById(action.rule_left); // для отладки
            parent.nonterm = action.rule_left; // release-версия
            parent.childs = new Array();
            while (pop_count > 0)
            {
                parent.childs.push(tree.pop());
                stack.pop();
                pop_count--;
            }
            var st_top = stack.pop();
            stack.push(st_top);
            var trans_col = TransferTable[NonTerminals.nameById(action.rule_left)];
            if (typeof trans_col == 'undefined')
            {
                err = true;
                break;
            }
            var transfer = trans_col['st' + st_top];
            if (typeof transfer == 'undefined')
                err = true;
            else
            {
                stack.push(transfer.state);
                tree.push(parent);
            }
            break;
        }
    }
    if (!acc || err)
        return {correct: false, pos: stream.pos};
    else
        return {correct: true, tree: tree.pop()};
}

/*
Просто добавление переменной в watch-список
 */
function add_watch()
{
    var watch_name = $('#watch_name').val();
    if (watch_name == '')
        return ;
    if ($('#watch_list > [value = "' + watch_name + '"]').length != 0)
        return ;
    $('#watch_list').append($('<option>' + watch_name + '</option>').attr('value', watch_name));
}

/*
Выврим в лог строчку, если !ignoreline, то перед выводимой инфой напечатаем номер текущей строки
 */
function addlog(str, ignoreline)
{
    if (ignoreline)
        $('#log').val($('#log').val() + str + '\n');
    else
        $('#log').val($('#log').val() + 'Line ' + currentline + ': ' + str + '\n');
}

// массив деревьев синтаксического разбора
var lines;
// количество строк
var linecount;
// текущая обрабатываемая строка
var currentline;
// массив меток
var labels;
// массив переменных
var vars;
// число переменных
var varcount;
// стек
var stack;
// объект-хелпер который используется для организации ввода переменных
var input_data = {};
// флажок, который показывает в каком режиме находимся (отладки кода, или просто запуск)
var step_by_step;

/*
Проверяем существует ли метка или переменная с таким именем
 */
function check_ident(ident)
{
    if (!(ident in labels) && !(ident in vars))
        return true;
    addlog('"' + ident + '" is existing ident');
    return false;
}

/*
Обрабатываем ветку <var_decl>, то есть задаём либо переменную, либо массив
Адрес переменной авчисояется очень просто - размер кода + индекс в массиве переменных.
То есть фактически память у нас вылядит так: [code][var1][var2]..[varN], номер переменной определяется временем е добавления - чем раньше добавили, тем меньше номер
 */
function interp_var_decl(var_decl)
{
    var ident;
    // просто переменная?
    if (var_decl.childs.length == 1)
    {
        ident = var_decl.childs[0].lex.ident;
        if (!check_ident(ident))
            return false;
        // добавляем в массив
        vars[ident] = {address: linecount + varcount, type: 'int', value: 0};
        varcount++;
        return true;
    }
    // массив!
    ident = var_decl.childs[3].lex.ident;
    if (!check_ident(ident))
        return false;
    vars[ident] = {address: linecount + varcount, type: 'array', length: var_decl.childs[1].lex.number, value: []};
    varcount++;
    return true;
}

/*
<var_list>, рекурсивное объявление переменных
 */
function interp_var_list(var_list)
{
    if (var_list.childs.length == 4)
        if (!interp_var_list(var_list.childs[3]))
            return false;
    return interp_var_decl(var_list.childs[0]);
}

/*
Проверяем то что переменная существует и является обычной переменной, а не массивом
 */
function check_var(ident)
{
    if (!(ident in vars))
    {
        addlog('"' + ident + '" is unknown variable');
        return false;
    }
    if (vars[ident].type != 'int')
    {
        addlog('"' + ident + '" is array');
        return false;
    }
    return true;
}

/*
Получаем идентификатор переменной, которая находится по заданному адресу
 */
function get_var_at_address(address)
{
    for (varname in vars)
    {
        if (vars[varname].address == address)
        {
            if (vars[varname].type == 'int')
                return varname;
            addlog('variable ad address ' + address + ' is array');
            return null;
        }
    }
    addlog('could not find variable at address ' + address);
    return null;
}

/*
Получаем значение переменной
 */
function interp_read_var(ident)
{
    if (!check_var(ident))
        return {result: false};
    return {result: true, value: vars[ident].value};
}

/*
<var_numb>, получаем индекс для массива - либо имя переменной, либо численное значение
*/
function interp_read_index(node)
{
    var lex = node.childs[0].lex;
    if (lex.type == LexTypes.LexNumber)
        return {result: true, value: lex.number};
    return interp_read_var(lex.ident);
}

/*
Пишем значение в <var_output>, который является либо переменной либо указателем на переменную
 */
function interp_write_out(node, val)
{
    var ident;
    // просто переменная?
    if (node.childs[0].type == 'leaf')
    {
        ident = node.childs[0].lex.ident;
        if (!check_var(ident))
            return false;
        vars[ident].value = val;
        return true;
    }
    // укащатель
    ident = node.childs[0].childs[0].lex.ident;
    if (!check_var(ident))
        return false;
    // разименовываем его
    ident = get_var_at_address(vars[ident].value);
    if (!ident)
        return false;
    vars[ident].value = val;
    return true;
}

/*
<var_output_array> - расширение <var_output>, которое позволяет писать и в массив
 */
function interp_write_out_ex(node, val)
{
    // <var_output>?
    if (node.childs[0].nonterm == NonTerminals.var_output)
        return interp_write_out(node.childs[0], val);
    // массив!
    var var_ar = node.childs[0];
    var ident = var_ar.childs[3].lex.ident;
    // читаем индекс массива
    var index = interp_read_index(var_ar.childs[1]);
    if (!index.result)
        return false;
    if (!(ident in vars))
    {
        addlog('"' + ident + '" is unknown variable');
        return false;
    }
    var ar = vars[ident];
    if (ar.type != 'array')
    {
        addlog('"' + ident + '" is not array');
        return false;
    }
    if (index.value >= ar.length)
    {
        addlog('array "' + ident + '" out of range');
        return false;
    }
    ar.value['idx' + index.value] = val;
    return true;
}

/*
Функция, которая вызывается после того как пользователь ввёл данные, и мы можем продолжить анализ
 */
function interp_operation_io_in_cont(e)
{
    // данные, которые передаются через jQuery-bind: указатель на узел, который описывает приёмник введенного значения
    var node = e.data.node;
    var val = $('#input_value').val();
    $.fn.microModal.dialogs['#input_dialog'].close();
    // записываем полученное значение
    if (!interp_write_out_ex(node, parseInt(val)))
        input_data.error = true;
    // сигнализируем о том, что можем продолжить выполнение кода
    input_data.active = 0;
}

/*
Показываем форму, для ввода значения
 */
function interp_operation_io_in(op_io_in)
{
    // начали ввод, приостанавливаем выполнение кода
    input_data.active = 1;
    $.fn.microModal.dialogs['#input_dialog'].open();
    $('#input_linenubmer').html(currentline);
    $('#input_submit').click({node: op_io_in}, interp_operation_io_in_cont);
    return true;
}

/*
<var_input> - переменные, числа, ссылки, разименованные указатели
Функция возвращает нужное нам значение, которое в ходе представленно <var_input>
 */
function interp_read_in(node)
{
    var child = node.childs[0];
    // число
    if (child.type == 'leaf')
        return {result: true, value: child.lex.number};
    var ident;
    // ссылка, возвращаем адрес переменной
    if (child.nonterm == NonTerminals.var_ref)
    {
        ident = child.childs[0].lex.ident;
        if (!check_var(ident))
            return {result: false};
        return {result: true, value: vars[ident].address};
    }
    child = child.childs[0];
    // идентификатор
    if (child.type == 'leaf')
    {
        ident = child.lex.ident;
        if (!(ident in vars))
        {
            // может хотим получить адрес метки?
            if (!(ident in labels))
            {
                addlog('"' + ident + '" is unknown ident');
                return {result: false};
            }
            return {result: true, value: labels[ident]};
        }
        if (vars[ident].type != 'int')
        {
            addlog('"' + ident + '" is array');
            return false;
        }
        return {result: true, value: vars[ident].value};
    }
    // указатель
    ident = child.childs[0].lex.ident;
    if (!check_var(ident))
        return {result: false};
    ident = get_var_at_address(vars[ident].value);
    if (!ident)
        return {result: false};
    return {result: true, value: vars[ident].value};
}

/*
<var_input_array> = <var_input> + поддержка получение элементов массива
 */
function interp_read_in_ex(node)
{
    // var_input ?
    if (node.childs[0].nonterm == NonTerminals.var_input)
        return interp_read_in(node.childs[0]);
    var var_ar = node.childs[0];
    var ident = var_ar.childs[3].lex.ident;
    var index = interp_read_index(var_ar.childs[1]);
    if (!index.result)
        return {result: false};
    if (!(ident in vars))
    {
        addlog('"' + ident + '" is unknown variable');
        return {result: false};
    }
    var ar = vars[ident];
    if (ar.type != 'array')
    {
        addlog('"' + ident + '" is not array');
        return {result: false};
    }
    if (index.value >= ar.length)
    {
        addlog('array "' + ident + '" out of range');
        return {result: false};
    }
    index = 'idx' + index.value;
    if (!(index in ar.value))
    {
        // если такого элемента пока нет в объекте, то создаём его и инициируем нулём
        ar.value[index] = 0;
        return {result: true, value: 0};
    } else
        return {result: true, value: ar.value[index]};
}

/*
Команда out, просто выводим <var_input_array>
 */
function interp_operation_io_out(op_io_out)
{
    val = interp_read_in_ex(op_io_out);
    if (!val.result)
        return false;
    addlog('output ' + val.value);
    return true;
}

/*
Команда in, запрашиваем пользователя, и записываем полученные данные в Команда out, просто выводим <var_output_array>
 */
function interp_operation_io(op_io)
{
    if (op_io.childs[2].lex.type == LexTypes.LexKeywordIn)
        return interp_operation_io_in(op_io.childs[0]);
    return interp_operation_io_out(op_io.childs[0]);
}

/*
Арифметические операции - a = b <op> c
 */
function interp_operation_binary(op_binary)
{
    var inp2 = interp_read_in(op_binary.childs[0]);
    var op = op_binary.childs[1].childs[0].lex.type;
    var inp1 = interp_read_in(op_binary.childs[2]);
    if (!inp1.result || !inp2.result)
        return false;
    var val;
    switch (op)
    {
    case LexTypes.LexPlus:
        val = inp1.value + inp2.value;
        break;
    case LexTypes.LexMinus:
        val = inp1.value - inp2.value;
        break;
    case LexTypes.LexAsterisk:
        val = inp1.value * inp2.value;
        break;
    case LexTypes.LexDiv:
        val = Math.floor(inp1.value / inp2.value);
        break;
    case LexTypes.LexMod:
        val = inp1.value % inp2.value;
        break;
    }
    return interp_write_out(op_binary.childs[4], val);
}

/*
Goto, здесь изменяем глобальную переменную currentline, с учетом того чот после выполнения текущей линии она будет инкриментирована
Нужно это учесть и заранее записать значение на еденицу меньшее чем нам необходимо
 */
function interp_control_goto(node)
{
    // переход на метку?
    var ident = node.childs[0].lex.ident;
    if (ident in labels)
    {
        currentline = labels[ident] - 1;
        return true;
    }
    // переход по значению переменной
    if (!check_var(ident))
        return false;
    var val = vars[ident];
    if (val >= linecount)
    {
        addlog('invalid address of code');
        return false;
    }
    currentline = val.value - 1;
    return true;
}

/*
Переходы
 */
function interp_operation_control(op_control)
{
    var child = op_control.childs[0];
    // безусловный
    if (child.nonterm == NonTerminals.goto)
        return interp_control_goto(child);
    var inp2 = interp_read_in(child.childs[2]);
    var op = child.childs[3].lex.op;
    var inp1 = interp_read_in(child.childs[4]);
    if (!inp1.result || !inp2.result)
        return false;
    var val;
    // проверяем нужно ли совершать условный переход
    switch (op)
    {
    case CompOp.CompOpEq:
        val = (inp1.value == inp2.value);
        break;
    case CompOp.CompOpGrEq:
        val = (inp1.value >= inp2.value);
        break;
    case CompOp.CompOpLeEq:
        val = (inp1.value <= inp2.value);
        break;
    case CompOp.CompOpLe:
        val = (inp1.value < inp2.value);
        break;
    case CompOp.CompOpGr:
        val = (inp1.value > inp2.value);
        break;
    case CompOp.CompOpUnEq:
        val = (inp1.value != inp2.value);
        break;
    }
    // если нет - то просто завершаемся
    if (!val)
        return true;
    // если да, то выполняем переход
    return interp_control_goto(child.childs[0]);
}

/*
Команда присваивания, из-за ограничения на 3хоперандность у нас 2 формы - a[i] = b и a = b[i]
 */
function interp_operation_assign(op_assign)
{
    var val;
    if (op_assign.childs[0].nonterm == NonTerminals.var_input_array)
    {
        val = interp_read_in_ex(op_assign.childs[0]);
        if (!val.result)
            return false;
        return interp_write_out(op_assign.childs[2], val.value);
    }
    val = interp_read_in(op_assign.childs[0]);
    if (!val.result)
        return false;
    return interp_write_out_ex(op_assign.childs[2], val.value);
}

/*
Операции со стеком - push/pop
 */
function interp_operation_stack(op_stack)
{
    var val;
    if (op_stack.childs[2].lex.type == LexTypes.LexKeywordPop)
    {
        val = stack.pop();
        return interp_write_out_ex(op_stack.childs[0], val);
    }
    val = interp_read_in_ex(op_stack.childs[0]);
    if (!val.result)
        return false;
    stack.push(val.value);
    return true;
}

function interp_operation(operation)
{
    switch (operation.childs[0].nonterm)
    {
    case NonTerminals.io:
        return interp_operation_io(operation.childs[0]);
    case NonTerminals.binary:
        return interp_operation_binary(operation.childs[0]);
    case NonTerminals.control:
        return interp_operation_control(operation.childs[0]);
    case NonTerminals.assign:
        return interp_operation_assign(operation.childs[0]);
    case NonTerminals.stack:
        return interp_operation_stack(operation.childs[0]);
    }
    return false;
}

/*
Функция, которая исполняет текущую линию кода
 */
function executeLine()
{
    // ждём когда пользователь введёт данные, запрошенные командой in
    // чекаем 10 раз в секунду
    if (input_data.active)
    {
        setTimeout(executeLine, 100);
        return ;
    }
    // ошибка при вводе данных?
    if (input_data.error)
    {
        if (step_by_step)
            $('#step_button').attr('disabled', 'disabled');
        return ;
    }
    var line = lines[currentline];
    var ret;
    // синтаксическая ошибка
    if (!line.correct)
    {
        addlog('syntax error at position ' + line.pos);
        if (step_by_step)
            $('#step_button').attr('disabled', 'disabled');
        return ;
    }
    var general = line.tree.childs[0];
    // либо это команда, либо это объявленеи перемнных
    if (general.nonterm == NonTerminals.vars_decl)
        ret = interp_var_list(general.childs[0]);
    else
        ret = interp_operation(general.childs[0]);
    if (!ret)
    {
        if (step_by_step)
            $('#step_button').attr('disabled', 'disabled');
        return ;
    }
    currentline++;
    // кончился исходник?
    if (currentline == linecount)
    {
        addlog('Finish!', true);
        if ($('#dump_mode').is(':checked'))
        {
            addlog('Vars dump:\n' + dump(vars), true);
        }
        if (step_by_step)
            $('#step_button').attr('disabled', 'disabled');
        return ;
    }
    // если мы в режиме запуска, а не отладки, то ставим наши функцию на выполнение следующий строки как можно быстрее
    if (!step_by_step)
        setTimeout(executeLine, 0);
    else
    {
        // выделяем текущую линию в редакторе, для наглядности
        $('#code_source').codeEditor('select', currentline);
        // обновляем значение в watch-списке
        $('#watch_list').children().each(function()
        {
            var var_name = $(this).val();
            if (check_var(var_name))
            {
                $(this).text(var_name + ' = ' + vars[var_name].value);
            }
        })
    }
}

function run_code()
{
    $('#step_button').attr('disabled', 'disabled');
    $('#log').val('');
    lines = new Array();
    var editor = $('#code_source');
    editor.codeEditor('select', 0);
    linecount = editor.codeEditor('linecount');
    varcount = 0;
    currentline = 0;
    input_data.active = 0;
    input_data.error = false;
    step_by_step = 0;
    labels = new Array();
    vars = new Array();
    stack = new Array();
    for (i = 0; i < linecount; i++)
    {
        var line = AnalyzeLine(editor.codeEditor('getline', i));
        lines.push(line);
        if (!line.correct)
            continue;
        var command = line.tree.childs[0];
        if (command.type != 'node' || command.nonterm != NonTerminals.command || command.childs.length != 4)
            continue;
        var ident = command.childs[3].lex.ident;
        if (!check_ident(ident))
            return ;
        labels[ident] = i;
    }
    if ($('#step_mode').is(':checked'))
    {
        step_by_step = 1;
        $('#step_button').removeAttr('disabled');
        return ;
    }
    setTimeout(executeLine, 0);
}

$(function()
{
    // модальные диалоги
    $('.micromodal').microModal({autoPositioning: true});
    // биндим codeEditor на нужный див
    var editor = $('#code_source');
    // editor.codeEditor(); // release mode

    // отладка
    editor.codeEditor({start: 'var a, c, g, e, f'});
    editor.codeEditor('addline', -1, 'c=1');
    editor.codeEditor('addline', -1, 'in a');
    editor.codeEditor('addline', -1, 'var d[10]');
    editor.codeEditor('addline', -1, 'd[c]=c');
    editor.codeEditor('addline', -1, 'push printresult');
    editor.codeEditor('addline', -1, 'push &c');
    editor.codeEditor('addline', -1, 'factfunct: pop g');
    editor.codeEditor('addline', -1, 'if *g>=a goto retaddr');
    editor.codeEditor('addline', -1, 'f=*g');
    editor.codeEditor('addline', -1, 'e=d[f]');
    editor.codeEditor('addline', -1, '*g=*g+1');
    editor.codeEditor('addline', -1, 'e=e**g');
    editor.codeEditor('addline', -1, 'f=f+1');
    editor.codeEditor('addline', -1, 'd[f]=e');
    editor.codeEditor('addline', -1, 'push retaddr');
    editor.codeEditor('addline', -1, 'push g');
    editor.codeEditor('addline', -1, 'goto factfunct');
    editor.codeEditor('addline', -1, 'retaddr: pop g');
    editor.codeEditor('addline', -1, 'goto g');
    editor.codeEditor('addline', -1, 'printresult: out d[c]');
    $('#watch_list').append($('<option>c</option>').attr('value', 'c'));
});
