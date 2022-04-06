jQuery(function() {
		
		//Mobile Menu Functionailty
		jQuery('.navicon').on('click', function() {
			jQuery('.mobile-nav .m-nav-container').addClass('open');
		});
		
		jQuery('.mobile-close').on('click', function() {
			jQuery('.mobile-nav .m-nav-container').removeClass('open');
		});
		
		jQuery(document).mouseup(function (e) {
			var container = jQuery('.mobile-nav .m-nav-container.open');
			if (!container.is(e.target) && container.has(e.target).length === 0) {
				jQuery('.mobile-nav .m-nav-container').removeClass('open');
			}
		});
	
		jQuery(document).on('touchstart', function(e) {
			var container = jQuery('.mobile-nav .m-nav-container.open');
			if (!container.is(e.target) && container.has(e.target).length === 0) {
				jQuery('.mobile-nav .m-nav-container').removeClass('open');
			}
		});
		
		jQuery('.menu-container nav ul li').on('mouseenter', function() {
			var w = jQuery(this).width();
			var position = jQuery(this).position();
			jQuery('.menu-container .slider-bar').css({'left':position.left, 'width':w});
		});
		
		// First Level Mobile Menu
		var t = 0;
		
		jQuery('.mobile-nav ul li a').on('click',function(e) {
			if(jQuery(this).parent().hasClass('menu-item-has-children')) {
				if(t == 0) {
					if(jQuery(e.target).is(jQuery(this))){
						e.preventDefault();
						jQuery(this).parent().toggleClass('tap');
						t = 1;
					}else{
						t = 0;
					}
					t = setTimeout(function() {
						t = 0;
					}, 600);
				}else{
					jQuery(this).click();
				}
			}else{
				jQuery(this).click();
			}
			
		});
		
		// Second Level Mobile Menu
		var ts = 0;
		
		jQuery('.mobile-nav ul li ul li a').on('click', function() {
			if(jQuery(this).parent().hasClass('menu-item-has-children')) {
				if(ts == 0) {
					if(jQuery(e.target).is(jQuery(this))){
						e.preventDefault();
						jQuery(this).parent().toggleClass('tap');
						ts = 1;
					}else{
						ts = 0;
					}
					ts = setTimeout(function() {
						ts = 0;
					}, 600);
				}else{
					jQuery(this).click();
				}
			}else{
				jQuery(this).click();
			}
		});
		
		// Sticky menu functionality
		function moveScroller() {
			var move = function() {
				var st = jQuery(window).scrollTop();
				var ot = jQuery('.menu-show').height();
				var s = jQuery('.header-scroll');
				if(st >= ot) {
					s.addClass('active');
				} else {
					if(st < ot) {
						s.removeClass('active');
					}
				}
			};
			jQuery(window).scroll(move);
			move();
		}
		moveScroller();
		
		// Team Video Functionality
		jQuery('.team-piper .video').on('click', function() {
			var vUrl = jQuery(this).data('url');
			if(jQuery('header .mobile-nav').css('display') == 'block') {
				jQuery(this).find(' iframe').attr('src', vUrl);
				jQuery(this).addClass('show');
			}else{
				jQuery('.video-modal .v-container iframe').attr('src', vUrl);
				jQuery('.video-cover, .video-close, .video-modal').addClass('show');
				jQuery('.video-cover').css('z-index',10);
				jQuery('.video-close, .video-modal').css('z-index',11);
			}
			
		});
		
		jQuery('.video-close, .video-cover').on('click', function() {
			jQuery('.video-cover, .video-close, .video-modal, .video-next, .video-prev, .form-modal').removeClass('show');
			setTimeout(function() {
				jQuery('.video-cover, .video-close, .video-modal, .video-next, .video-prev').css('z-index','-1');
				jQuery('.video-modal .v-container iframe').attr('src', '');
			}, 1000);
		});
		
		// Home Slider Functionality
		if(jQuery('.home-industries .mobile-industries ul').length) {
			jQuery('.home-industries .mobile-industries ul').bxSlider({
				auto:false,
				infiniteLoop:true,
				nextSelector:'.home-industries .next',
				prevSelector:'.home-industries .prev',
				speed:1000,
				minSlides:2,
				maxSlides:3,
				moveSlides:1,
				shrinkItems:true,
				slideWidth:230,
				slideMargin:15,
				pager:false,
				randomStart:false, 
				nextText: '',
				prevText: '',
				hideControlOnEnd:false,
				touchEnabled:false,
				useCSS:false,
				useTransform:false
			});
		}
		
		// Partnering with Piper Video Functionality
		jQuery('.partner-with-piper ul li').on('click', function() {
			var vUrl = jQuery(this).data('url');
			jQuery(this).addClass('active');
			if(jQuery('header .mobile-nav').css('display') == 'block') {
				jQuery(this).find('.video-image iframe').attr('src', vUrl);
				jQuery(this).find('.video-image').addClass('show');
			}else{
				jQuery('.video-modal .v-container iframe').attr('src', vUrl);
				jQuery('.video-cover, .video-close, .video-modal, .video-next, .video-prev').addClass('show');
				jQuery('.video-cover').css('z-index',10);
				jQuery('.video-close, .video-modal, .video-next, .video-prev').css('z-index',11);
			}
		});
		
		jQuery('.video-next').on('click', function() {
			if(jQuery('.partner-with-piper ul').length) {
				var current = jQuery('.partner-with-piper ul li.active');
				if(current.next().length) {
					var nUrl = current.next().data('url');
					current.next().addClass('active');
				}else{
					var nUrl = jQuery('.partner-with-piper ul li').first().data('url');
					jQuery('.partner-with-piper ul li').first().addClass('active');
				}
			}else{
				var current = jQuery('.working-join .top .vids-container .video.active');
				if(current.next('.video').length) {
					var nUrl = current.next('.video').data('url');
					current.next('.video').addClass('active');
				}else{
					var nUrl = jQuery('.working-join .top .vids-container .video').first('.video').data('url');
					jQuery('.working-join .top .vids-container .video').first('.video').addClass('active');
				}
			}
			current.removeClass('active');
			jQuery('.video-modal .v-container iframe').attr('src', nUrl);
		});
		
		jQuery('.video-prev').on('click', function() {
			if(jQuery('.partner-with-piper ul').length) {
				var current = jQuery('.partner-with-piper ul li.active');
				if(current.prev().length) {
					var nUrl = current.prev().data('url');
					current.prev().addClass('active');
				}else{
					var nUrl = jQuery('.partner-with-piper ul li').last().data('url');
					jQuery('.partner-with-piper ul li').last().addClass('active');
				}
			}else{
				var current = jQuery('.working-join .top .vids-container .video.active');
				if(current.prev('.video').length) {
					var nUrl = current.prev('.video').data('url');
					current.prev('.video').addClass('active');
				}else{
					var nUrl = jQuery('.working-join .top .vids-container .video').last('.video').data('url');
					jQuery('.working-join .top .vids-container .video').last('.video').addClass('active');
				}
			}
			current.removeClass('active');
			jQuery('.video-modal .v-container iframe').attr('src', nUrl);
		});
		
		// About Page Video Functionality
		if(jQuery('.about-values').length) {
			jQuery('.about-values .vid-container .video').on('click', function() {
				var vUrl = jQuery(this).data('url');
				if(jQuery('header .mobile-nav').css('display') == 'block') {
					jQuery(this).find('iframe').attr('src', vUrl);
					jQuery(this).addClass('show');
				}else{
					jQuery('.video-modal .v-container iframe').attr('src', vUrl);
					jQuery('.video-cover, .video-close, .video-modal').addClass('show');
					jQuery('.video-cover').css('z-index',10);
					jQuery('.video-close, .video-modal').css('z-index',11);
				}
			});
		}
		
		// Testimonials section functionality
		if(jQuery('.testimonials').length) {
			var maxS;
			var touchE;
			if(jQuery(window).width() > 1299) {
				maxS = 2;
				touchE = false;
			}else{
				maxS = 1;
				touchE = true;
			}
			// BX Slider Testimonials
			jQuery('.testimonials ul').bxSlider({
				auto:false,
				infiniteLoop:false,
				nextSelector:'.testimonials .next',
				prevSelector:'.testimonials .prev',
				speed:1000,
				minSlides:1,
				maxSlides:maxS,
				moveSlides:1,
				shrinkItems:true,
				slideWidth:575,
				slideMargin:30,
				pager:false,
				randomStart:false, 
				nextText: '<i class="fal fa-long-arrow-right"></i>',
				prevText: '<i class="fal fa-long-arrow-left"></i>',
				hideControlOnEnd:true,
				touchEnabled:touchE,
				useCSS:false,
				useTransform:false,
				onSlideBefore:function($slideElement, oldIndex, newIndex) {
					jQuery('.testimonials ul').children().removeClass('visible');
					$slideElement.addClass('visible');
					if(maxS == 2) {
						$slideElement.next('li').addClass('visible');
					}
				}
			});
			jQuery('.testimonials ul li:not(.bx-clone):first').addClass('visible');
			if(maxS == 2) {
				jQuery('.testimonials ul li.visible').next('li').addClass('visible');
			}
			
		}
		
		// More Industries section functionality
		if(jQuery('.industries.partial').length) {
			var maxS;
			if(jQuery(window).width() > 1999) {
				maxS = 5;
			}else if(jQuery(window).width() > 1299) {
				maxS = 4
			}else if(jQuery(window).width() > 999) {
				maxS = 3;
			}else if(jQuery(window).width() > 600) {
				maxS = 2;
			}else{
				maxS = 1;
			}
			// BX Slider Industries
			jQuery('.industries ul').bxSlider({
				auto:false,
				infiniteLoop:true,
				nextSelector:'.home-industries .next',
				prevSelector:'.home-industries .prev',
				speed:1000,
				minSlides:1,
				maxSlides:maxS,
				moveSlides:1,
				shrinkItems:true,
				slideWidth:285,
				slideMargin:15,
				pager:false,
				randomStart:false, 
				nextText: '<i class="fal fa-long-arrow-right"></i>',
				prevText: '<i class="fal fa-long-arrow-left"></i>',
				hideControlOnEnd:true,
				touchEnabled:false,
				useCSS:false,
				useTransform:false,
				onSlideBefore:function($slideElement, oldIndex, newIndex) {
					jQuery('.industries ul').children().addClass('op');
					$slideElement.removeClass('op');
					if(maxS == 5) {
						jQuery('.industries ul li:not(.op):first').next('li').removeClass('op');
						jQuery('.industries ul li:not(.op):first').next('li').next('li').removeClass('op');
						jQuery('.industries ul li:not(.op):first').next('li').next('li').next('li').removeClass('op');
						jQuery('.industries ul li:not(.op):first').next('li').next('li').next('li').next('li').removeClass('op');
					}else if(maxS == 4) {
						jQuery('.industries ul li:not(.op):first').next('li').removeClass('op');
						jQuery('.industries ul li:not(.op):first').next('li').next('li').removeClass('op');
						jQuery('.industries ul li:not(.op):first').next('li').next('li').next('li').removeClass('op');
					}else if(maxS == 3) {
						jQuery('.industries ul li:not(.op):first').next('li').removeClass('op');
						jQuery('.industries ul li:not(.op):first').next('li').next('li').removeClass('op');
					}else if(maxS == 2) {
						Query('.industries ul li:not(.op):first').next('li').removeClass('op');
					}
				}
			});
			jQuery('.industries ul li').each(function() {
				jQuery(this).addClass('op');
			});
			jQuery('.industries ul li:not(.bx-clone):first').removeClass('op');
			if(maxS == 5) {
				jQuery('.industries ul li:not(.bx-clone):first').next('li').removeClass('op');
				jQuery('.industries ul li:not(.bx-clone):first').next('li').next('li').removeClass('op');
				jQuery('.industries ul li:not(.bx-clone):first').next('li').next('li').next('li').removeClass('op');
				jQuery('.industries ul li:not(.bx-clone):first').next('li').next('li').next('li').next('li').removeClass('op');
			}else if(maxS == 4) {
				jQuery('.industries ul li:not(.bx-clone):first').next('li').removeClass('op');
				jQuery('.industries ul li:not(.bx-clone):first').next('li').next('li').removeClass('op');
				jQuery('.industries ul li:not(.bx-clone):first').next('li').next('li').next('li').removeClass('op');
			}else if(maxS == 3) {
				jQuery('.industries ul li:not(.bx-clone):first').next('li').removeClass('op');
				jQuery('.industries ul li:not(.bx-clone):first').next('li').next('li').removeClass('op');
			}else if(maxS == 2) {
				jQuery('.industries ul li:not(.bx-clone):first').next('li').removeClass('op');
			}
		}
		
		// Industries Detail Functionality
		var maxID;
		if(jQuery(window).width() > 1299) {
			maxID = 3;
		}else if(jQuery(window).width() > 700) {
			maxID = 2;
		}else{
			maxID = 1;
		}
		jQuery('.industries-detail-proven.enterprise ul').bxSlider({
			auto:false,
			infiniteLoop:false,
			nextSelector:'.industries-detail-proven .next',
			prevSelector:'.industries-detail-proven .prev',
			speed:1000,
			minSlides:1,
			maxSlides:maxID,
			moveSlides:1,
			shrinkItems:true,
			slideWidth:370,
			slideMargin:50,
			pager:false,
			randomStart:false, 
			nextText: '<i class="fal fa-long-arrow-right"></i>',
			prevText: '<i class="fal fa-long-arrow-left"></i>',
			hideControlOnEnd:true,
			touchEnabled:false,
			useCSS:false,
			useTransform:false,
			onSlideBefore:function($slideElement, oldIndex, newIndex) {
				$slideElement.addClass('viewed');
				$slideElement.prev('li').removeClass('viewed');
				if(maxID == 2) {
					$slideElement.next('li').addClass('viewed');
				}else if(maxID == 3) {
					$slideElement.next('li').addClass('viewed');
					$slideElement.next('li').next('li').addClass('viewed');
				}
			}
		});
		jQuery('.industries-detail-proven li:not(.bx-clone):first').addClass('viewed');
		if(maxID == 2) {
			jQuery('.industries-detail-proven  li.viewed').next('li').addClass('viewed');
		}else if(maxID == 3) {
			jQuery('.industries-detail-proven  li.viewed').next('li').addClass('viewed');
			jQuery('.industries-detail-proven  li.viewed').next('li').next('li').addClass('viewed');
		}
		
		// Partnering mobile click functionality
		if(jQuery('.partnering-with-piper ul').length) {
			jQuery('.partnering-with-piper ul li').on('click', function() {
				jQuery(this).toggleClass('active');
			});
		}
		
		// Custom Scrollbar Advanced Partial
		jQuery('.fields-container ul').mCustomScrollbar({
			autoHideScrollbar:false,
			theme:"dark",
			axis:"y",
			mouseWheel: {
				enable:true
			},
		});
		
		// Job Seekers Icon Functionality
		jQuery('.job-seekers-process ul.icons li').on('click', function() {
			var current = jQuery('ul.icons li.active').data('tab');
			var newClick = jQuery(this).data('tab');
			jQuery('ul.icons li.active').removeClass('active');
			jQuery(this).addClass('active');
			jQuery('ul.tabs li.active').removeClass('active next').addClass('prev');
			jQuery('ul.tabs li.'+newClick).removeClass('prev next').addClass('active');
		});
		
		jQuery('.job-seekers-process .mobile ul li').on('click', function() {
			jQuery(this).toggleClass('active');
		});
		
		// Working at Piper Instagram Feed Functionality
		if(jQuery('.working-career .social ul.insta-slider').length) {
			var maxWP;
			if(jQuery(window).width() > 1699) {
				maxWP = 5;
			}else if(jQuery(window).width() > 1299) {
				maxWP = 4
			}else if(jQuery(window).width() > 999) {
				maxWP = 3;
			}else if(jQuery(window).width() > 600) {
				maxWP = 2;
			}else{
				maxWP = 1;
			}
			// BX Slider Instagram
			jQuery('.working-career .social ul.insta-slider').bxSlider({
				auto:false,
				infiniteLoop:true,
				nextSelector:'.working-career .social .next',
				prevSelector:'.working-career .social .prev',
				speed:1000,
				minSlides:1,
				maxSlides:maxWP,
				moveSlides:1,
				shrinkItems:true,
				slideWidth:265,
				slideMargin:50,
				pager:false,
				randomStart:false, 
				nextText: '<i class="fal fa-long-arrow-right"></i>',
				prevText: '<i class="fal fa-long-arrow-left"></i>',
				hideControlOnEnd:true,
				touchEnabled:true,
				useCSS:false,
				useTransform:false,
				onSlideBefore:function($slideElement, oldIndex, newIndex) {
					jQuery('.working-career .social ul.insta-slider').children().addClass('op');
					$slideElement.removeClass('op');
					if(maxWP == 5) {
						jQuery('.working-career .social ul.insta-slider li:not(.op):first').next('li').removeClass('op');
						jQuery('.working-career .social ul.insta-slider li:not(.op):first').next('li').next('li').removeClass('op');
						jQuery('.working-career .social ul.insta-slider li:not(.op):first').next('li').next('li').next('li').removeClass('op');
						jQuery('.working-career .social ul.insta-slider li:not(.op):first').next('li').next('li').next('li').next('li').removeClass('op');
					}else if(maxWP == 4) {
						jQuery('.working-career .social ul.insta-slider li:not(.op):first').next('li').removeClass('op');
						jQuery('.working-career .social ul.insta-slider li:not(.op):first').next('li').next('li').removeClass('op');
						jQuery('.working-career .social ul.insta-slider li:not(.op):first').next('li').next('li').next('li').removeClass('op');
					}else if(maxWP == 3) {
						jQuery('.working-career .social ul.insta-slider li:not(.op):first').next('li').removeClass('op');
						jQuery('.working-career .social ul.insta-slider li:not(.op):first').next('li').next('li').removeClass('op');
					}else if(maxWP == 2) {
						Query('.working-career .social ul.insta-slider li:not(.op):first').next('li').removeClass('op');
					}
				}
			});
			jQuery('.working-career .social ul.insta-slider li').each(function() {
				jQuery(this).addClass('op');
			});
			jQuery('.working-career .social ul.insta-slider li:not(.bx-clone):first').removeClass('op');
			if(maxWP == 5) {
				jQuery('.working-career .social ul.insta-slider li:not(.bx-clone):first').next('li').removeClass('op');
				jQuery('.working-career .social ul.insta-slider li:not(.bx-clone):first').next('li').next('li').removeClass('op');
				jQuery('.working-career .social ul.insta-slider li:not(.bx-clone):first').next('li').next('li').next('li').removeClass('op');
				jQuery('.working-career .social ul.insta-slider li:not(.bx-clone):first').next('li').next('li').next('li').next('li').removeClass('op');
			}else if(maxWP == 4) {
				jQuery('.working-career .social ul.insta-slider li:not(.bx-clone):first').next('li').removeClass('op');
				jQuery('.working-career .social ul.insta-slider li:not(.bx-clone):first').next('li').next('li').removeClass('op');
				jQuery('.working-career .social ul.insta-slider li:not(.bx-clone):first').next('li').next('li').next('li').removeClass('op');
			}else if(maxWP == 3) {
				jQuery('.working-career .social ul.insta-slider li:not(.bx-clone):first').next('li').removeClass('op');
				jQuery('.working-career .social ul.insta-slider li:not(.bx-clone):first').next('li').next('li').removeClass('op');
			}else if(maxWP == 2) {
				jQuery('.working-career .social ul.insta-slider li:not(.bx-clone):first').next('li').removeClass('op');
			}
		}
		
		// Employee Benefits Functionality
		jQuery('.working-perks ul li').on('mouseover', function() {
			var perk = jQuery(this).data('perk');
			jQuery('.working-perks ul li:first').removeClass('active');
			jQuery('.working-perks .img-container img.active').removeClass('active');
			jQuery('.working-perks .img-container img.'+perk).addClass('active');
		});
		
		// Working Video Functionality
		jQuery('.working-join .top .vids-container .video').on('click', function() {
			var vUrl = jQuery(this).data('url');
			jQuery(this).addClass('active');
			if(jQuery('header .mobile-nav').css('display') == 'block') {
				jQuery(this).find('iframe').attr('src', vUrl);
				jQuery(this).find('iframe').addClass('show');
			}else{
				jQuery('.video-modal .v-container iframe').attr('src', vUrl);
				jQuery('.video-cover, .video-close, .video-modal, .video-next, .video-prev').addClass('show');
				jQuery('.video-cover').css('z-index',10);
				jQuery('.video-close, .video-modal, .video-next, .video-prev').css('z-index',11);
			}
		});
		
		// Clinical Industries Skills Functionality
		if(jQuery('.industries-detail-skills.clinical').length) {
			jQuery('.industries-detail-skills.clinical ul > li').on('click', function() {
				if(jQuery(this).find('ul').hasClass('open')) {
					jQuery('.industries-detail-skills.clinical ul').removeClass('open');
				}else{
					jQuery('.industries-detail-skills.clinical ul').removeClass('open');
					jQuery(this).find('ul').addClass('open');
				}
			});
			
		}
		
		// Footer Form Functionality
		jQuery('button.footer-submit').on('click', function() {
			jQuery('.form-modal, .video-cover').addClass('show');
			jQuery('.video-cover').css('z-index', '11');
		});
		
		jQuery('.form-modal .form-close').on('click', function() {
			jQuery('.form-modal, .video-cover').removeClass('show');
			jQuery('.video-cover').css('z-index', '-1');
		});
		
		
		
});
