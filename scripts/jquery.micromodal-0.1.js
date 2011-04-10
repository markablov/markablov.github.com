// Plugin created by Daenu Probst http://codebrewery.blogspot.com/
(function ($) {
    $.fn.microModal = function (options) {
        var opts = $.extend(true, {}, $.fn.microModal.defaults, options);
        return this.each(function () {
			var obj = $(this);
			var target = '#' + getLast('target-', obj);
			var overlay = $('<div style="width:100%;height:100%;position:fixed;margin:0;padding:0;z-index:99999;top:0px;left:0px;right:0px;bottom:0px" />');
			overlay.css('background-color', opts.overlay.color);
			overlay.css('opacity', opts.overlay.opacity);
			$(target).css('position', 'absolute').css('z-index', 999999);
			var dlg = null;
			
			if(opts.overlay.show)
				dlg = new dialog($(target).clone(true), overlay.clone(true), opts.autoPositioning);
			else
				dlg = new dialog($(target).clone(true), null, opts.autoPositioning);
			$(target).remove();
			overlay.remove();
			
			$.fn.microModal.dialogs[target] = dlg;
			
			obj.click(function(e) {
				$.fn.microModal.dialogs[target].open();
				return false;
			});
        });
    };
	
	function getLast(part, element) {
        var classes = element.attr('class').split(' ');
        for (var i = 0; i < classes.length; i++) {
            if (classes[i].indexOf(part) > -1) {
                var parts = classes[i].split('-');
                return parts[parts.length - 1];
            }
        }
        return null;
    };
	
	var dialog = function(_content, _overlay, _autoPositioning) {
		this.isVisible = false;
		var content = _content;
		var overlay = _overlay;
		var autoPositioning = _autoPositioning;
		var id = '#' + content.attr('id');
		
		this.close = function() {
			$(id).remove();
			$(id + '-overlay').remove();
			this.isVisible = false;
		};
		this.open = function() {
			if(overlay != null) {
				var newOverlay = overlay.clone(true);
				newOverlay.attr('id', content.attr('id') + '-overlay');
				$('body').append(newOverlay);
			}
			var newContent = content.clone(true);
			
			$('body').append(newContent);
			
			if(autoPositioning) {
				position(newContent);
				$(window).resize(function() {
					position(newContent);
				});
				
				$(window).scroll(function() {
					position(newContent);
				});
			}

            newContent.children('.modal-focus').focus();

			this.isVisible = true;
		};
		
		var position = function(element) {
			element.css("top", ( $(window).height() - element.outerHeight() ) / 2 + $(window).scrollTop() + "px");
			element.css("left", ( $(window).width() - element.outerWidth() ) / 2 + $(window).scrollLeft() + "px");
		};
	};
	
    $.fn.microModal.defaults = {
		autoPositioning: true,
		overlay: {
			show: true,
			color: '#fff',
			opacity: 0.8
		}
    };
	
	$.fn.microModal.dialogs = new Object();
})(jQuery);
