// TODO: why is dummyAce undefined?
define(['domReady', 'ace'], function(domReady, dummyAce){


    function initAce(){
        var editor = ace.edit("editor");
        editor.setTheme("ace/theme/twilight");
        editor.session.setMode("ace/mode/javascript");

        return editor;
    }




    return {
        initAce : initAce
    };
})
