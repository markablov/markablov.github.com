var LexTypes =
{
    LexComp: 0,
    LexWhitespace: 1,
    LexKeywordPop: 2,
    LexKeywordPush: 3,
    LexKeywordGoto: 4,
    LexKeywordIn: 5,
    LexKeywordOut: 6,
    LexKeywordVar: 7,
    LexBracketSqLeft: 8,
    LexBracketSqRight: 9,
    LexNumber: 10,
    LexIdent: 11,
    LexColon: 12,
    LexAsterisk: 13,
    LexAssign: 14,
    LexRef: 15,
    LexEOL: 16,
    LexError: 17,
    LexPlus: 18,
    LexMinus: 19,
    LexDiv: 20,
    LexMod: 21,
    LexComma: 22,
    LexKeywordIf: 23,
    nameById: function (id)
    {
        for (var key in this)
            if (this[key] == id)
                return key;
    }
};

var CompOp =
{
    CompOpGr: 0,
    CompOpLe: 1,
    CompOpGrEq: 2,
    CompOpLeEq: 3,
    CompOpEq: 4,
    CompOpUnEq: 5
};

var ActionTypes =
{
    ActionShift: 0,
    ActionReduce: 1,
    ActionAccepted: 2
};

var NonTerminals =
{
    line: 0,
    var_decl: 1,
    var_list: 2,
    vars_decl: 3,
    command: 4,
    operation: 5,
    io: 6,
    var_output: 7,
    var_output_array: 8,
    var_ar: 9,
    var_numb: 10,
    var_ptr: 11,
    var_ref: 12,
    var_input_array: 13,
    var_input: 14,
    binary: 15,
    operator: 16,
    control: 17,
    goto: 18,
    if_key: 19,
    assign: 20,
    stack: 21,
    root: 22,
    nameById: function (id)
    {
        for (var key in this)
            if (this[key] == id)
                return key;
    }
};