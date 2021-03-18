/*!
 * ihavecookies - jQuery plugin for displaying cookie/privacy message
 * v0.3.2
 *
 * Copyright (c) 2018 Ketan Mistry (https://iamketan.com.au)
 * Licensed under the MIT license:
 * http://www.opensource.org/licenses/mit-license.php
 *
 */
(function($) {

    /*
    | Displays the cookie message on first visit or 30 days after their
    | last visit.
    | @param event - 'reinit' to reopen the cookie message
    */
    $.fn.ihavecookies = function(options, event) {

        var $element = $(this);

        // Set defaults
        const settings = $.extend({
            cookieTypes: [
                {
                    type: 'Site Preferences',
                    value: 'preferences',
                    description: 'These are cookies that are related to your site preferences, ' +
                        'e.g. remembering your username, site colours, etc.'
                },
                {
                    type: 'Analytics',
                    value: 'analytics',
                    description: 'Cookies related to site visits, browser types, etc.'
                },
                {
                    type: 'Marketing',
                    value: 'marketing',
                    description: 'Cookies related to marketing, e.g. newsletters, social media, etc'
                }
            ],
            title: 'Cookies & Privacy',
            message: 'Cookies enable you to use shopping carts and to personalize your experience on our sites, ' +
                'tell us which parts of our websites people have visited, ' +
                'help us measure the effectiveness of ads and web searches, ' +
                'and give us insights into user behavior so we can improve our communications and products.',
            link: '/privacy-policy',
            delay: 2000,
            expires: 30,
            moreInfoLabel: 'More information',
            acceptBtnLabel: 'Accept Cookies',
            advancedBtnLabel: 'Customise Cookies',
            advancedSaveBtnLabel: 'Save config',
            cookieTypesTitle: 'Select cookies to accept',
            fixedCookieTypeLabel: 'Necessary',
            fixedCookieTypeDesc: 'These are cookies that are essential for the website to work correctly.',
            showAsModal: false,
            onAccept: function () {
            },
            uncheckBoxes: false
        }, options);

        var myCookie = getCookie('cookieControl');
        if (!myCookie || event == 'reinit') {
            // Remove all instances of the cookie message so it's not duplicated
            $('#gdpr-cookie-message').remove();
            $('#gdpr-cookie-message-bg').remove();
            
            // Set the 'necessary' cookie type checkbox which can not be unchecked
            var cookieTypes =
                '<li>' +
                    '<input type="checkbox" name="gdpr[]" value="necessary" checked="checked" disabled="disabled"> ' +
                    '<label title="' + settings.fixedCookieTypeDesc + '">' + settings.fixedCookieTypeLabel + '</label>' +
                '</li>';

            // Generate list of cookie type checkboxes
            $.each(settings.cookieTypes, function(index, field) {
                if (field.type !== '' && field.value !== '') {
                    var cookieTypeDescription = '';
                    if (field.description !== false) {
                        cookieTypeDescription = ' title="' + field.description + '"';
                    }
                    cookieTypes +=
                        '<li>' +
                            '<input type="checkbox" id="gdpr-cookietype-' + field.value + '" name="gdpr[]" value="' + field.value + '" data-auto="on"> ' +
                            '<label for="gdpr-cookietype-' + field.value + '"' + cookieTypeDescription + '>' + field.type + '</label>' +
                        '</li>';
                }
            });

            // Display cookie message on page
            const cookieMessage =
                '<div id="gdpr-cookie-message" class="' + (settings.showAsModal ? 'gdpr-cookie-modal' : 'gdpr-cookie-bottom-right') + '">' +
                    '<p class="gdpr-cookie-message-title">' + settings.title + '</p>' +
                    '<p>' + settings.message + ' <a href="' + settings.link + '">' + settings.moreInfoLabel + '</a></p>' +
                    '<div id="gdpr-cookie-types" style="display:none;">' +
                        '<p class="gdpr-cookie-message-cookie-types">' + settings.cookieTypesTitle + '</h5>' +
                        '<ul>' + cookieTypes + '</ul>' +
                    '</div>' +
                    '<p class="gdpr-cookie-buttons">' +
                        '<button id="gdpr-cookie-advanced" type="button">' + settings.advancedBtnLabel + '</button>' +
                        '<button id="gdpr-cookie-accept" type="button">' + settings.acceptBtnLabel + '</button>' +
                    '</p>' +
                '</div>';
            setTimeout(function(){
                if (! settings.showAsModal) {
                    $($element).append(cookieMessage);
                } else {
                    const cookieMessageOverlay = $('<div id="gdpr-cookie-message-overlay">');
                    cookieMessageOverlay.append(cookieMessage);
                    $($element).append(cookieMessageOverlay);
                    $element = cookieMessageOverlay;
                }
                $('#gdpr-cookie-message').hide().fadeIn('slow', function(){
                    // If reinit'ing, open the advanced section of message
                    // and re-check all previously selected options.
                    if (event == 'reinit') {
                        $('#gdpr-cookie-advanced').trigger('click');
                    }
                });

                $('#gdpr-cookie-accept').on('click', function(){
                    setCookie('cookieControl', true, settings.expires);

                    hideGdprCookieMessage(settings.showAsModal);

                    // If 'data-auto' is set to ON, tick all checkboxes because
                    // the user hasn't clicked the customise cookies button
                    $('input[name="gdpr[]"][data-auto="on"]').prop('checked', true);

                    // Save users cookie preferences (in a cookie!)
                    $.each($('input[name="gdpr[]"]'), function(i, field){
                        setCookie(field.value, $(field).prop("checked"), settings.expires);
                    });

                    settings.onAccept.call(this);
                });

                $('#gdpr-cookie-advanced').on('click', function(){
                    // Uncheck all checkboxes except for the disabled 'necessary'
                    // one and set 'data-auto' to OFF for all. The user can now
                    // select the cookies they want to accept.
                    $('input[name="gdpr[]"]:not(:disabled)').attr('data-auto', 'off');
                    $.each(settings.cookieTypes, function(index, field) {
                        $('input#gdpr-cookietype-' + field.value).prop('checked', getCookie(field.value) == "true");
                    });
                    $('#gdpr-cookie-types').slideDown('fast', function(){
                        $('#gdpr-cookie-advanced').hide();
                        $('#gdpr-cookie-accept').html(settings.advancedSaveBtnLabel);
                        $('.gdpr-cookie-buttons').append('<button id="gdpr-cookie-all" type="button">' + settings.acceptBtnLabel + '</button>');
                        $('#gdpr-cookie-all').on('click', function(){
                            $('input[name="gdpr[]"]:not(:disabled)').attr('data-auto', 'on');
                            $('#gdpr-cookie-accept').trigger("click");
                        });
                    });
                });

            }, settings.delay);

        } else {
            let cookieVal = myCookie !== 'false';
            dropCookie(cookieVal, settings.expires);
        }

        // Uncheck any checkboxes on page load
        if (settings.uncheckBoxes === true) {
            $('input[type="checkbox"].ihavecookies').prop('checked', false);
        }

    };

    function hideGdprCookieMessage(showingAsModal) {
        if (!showingAsModal) {
            $('#gdpr-cookie-message').fadeOut('fast', function () {
                $(this).remove();
            });
        } else {
            $('#gdpr-cookie-message-overlay').fadeOut('fast', function () {
                $(this).remove();
            });
        }
    }

    // Method to get cookie value
    $.fn.ihavecookies.cookie = function() {
        const preferences = getCookie('cookieControlPrefs');
        return JSON.parse(preferences);
    };

    // Method to check if user cookie consent is configured (cookieControl cookie exists)
    $.fn.ihavecookies.configured = function() {
        const control = getCookie('cookieControl');
        return control !== false;
    }

    // Method to check if user cookie preference exists
    $.fn.ihavecookies.preference = function(cookieTypeValue) {
        const control = getCookie('cookieControl');
        if (control === false) {
            return false;
        }
        let preference = getCookie(cookieTypeValue);
        return preference == "true" ? true : false;
    };

    /*
    | Drop the cookie with a boolean value of true.
    */
    var dropCookie = function(value, expiryDays) {
        setCookie('cookieControl', value, expiryDays);
    };

    /*
    | Sets cookie with 'name' and value of 'value' for 'expiry_days'.
    */
    var setCookie = function(name, value, expiry_days) {
        Cookies.set(name, value, { expires: expiry_days, path: '/'});
        return getCookie(name);
    };

    /*
    | Gets cookie called 'name'.
    */
    var getCookie = function (name) {
        let cookie = Cookies.get(name);
        if (cookie == undefined)
            return false;

        return cookie;
    };

}(jQuery));