// $Date: 2008-08-12 19:04:58 -0700 (Tue, 12 Aug 2008) $

// Copyright 2008, nicerobot.org
// DigestJ is licensed under the (GPL-LICENSE.txt) license.

// References:
// http://tools.ietf.org/html/rfc2617
// http://crypto.stanford.edu/PwdHash/pwdhash.pdf

;(function($) {
  
  //
  //
  //
  $.fn.login = function()
  {
    $(this).click(toggleDialog);

    // login_dialog
    $(this).after('\n<!-- login_dialog -->\n<span id="login_dialog" style="display:none"></span>\n<!-- login_dialog -->');

    // login_form
    $('#login_dialog').append('\n <form id="login_form" action="javascript:void(0);" method=""></form>');

    // login_(username|secret|submit)_content
    $('#login_form').append('\n  <span id="login_username_content"></span>');
    $('#login_form').append('\n  <span id="login_secret_content"></span>');
    $('#login_form').append('\n  <span id="login_submit_content"></span>');

    // login_username_(label)
    $('#login_username_content').append('\n   <span id="login_username_label">Username</span>');
    $('#login_username_label').after('\n   <input id="login_username" type="text" name="username"/>');

    // login_secret_(label)
    $('#login_secret_content').append('\n   <span id="login_secret_label">Password</span>');
    $('#login_secret_label').after('\n   <input id="login_secret" type="password" name="secret"/>');

    // login_submit
    $('#login_submit_content').append('\n  <input id="login_submit_login" type="submit" name="Login" value="Login"/>');
    // login_reigster
    $('#login_submit_content').append('\n  <span id="recaptcha"></span>');
    $('#login_submit_content').append('\n  <input id="login_register_login" type="button" name="Register" value="Register"/>');
    $('#login_register_login').css('display','none');

    // login_response
    $('#login_form').append('\n  <span id="login_response">\n</span>');

    // Perform login on submit.
    $("#login_submit_login").click(function() { clearRecaptcha(); auth.mode = 'response'; });
    $("#login_form").submit(beginAuthentication);

    // Actively inform the user that these fields are required.
    $("#login_username").keyup(function() {
      colorize($(this),$('#login_username_label'));
      openid();
    });

    $("#login_username").change(toggleLoginOrRegister);

    $("#login_secret").keyup(function() {
      if (typeof( auth.secret ) == 'undefined' || !auth.secret) {
        colorize($(this),$('#login_secret_label'));
      }
    });
  };

  var auth = {
    nc : 0,
    uri : 'login.php',
    method : 'POST',
    status : 0,
    scheme : 'DigestJ',
    headers : {}
  };


  //
  //
  //
  function toggleLoginOrRegister()
  {
    $('#login_submit_login').css('display','none');
    $('#login_register_login').css('display','none');
    var u = $('#login_username').val();

    if (u) {
      $.post(auth.uri, { check: u },
            function(data, text) {
              if (!data) {
                $('#login_register_login').css('display','inline');
                buildRecaptcha();
                $('#login_secret').focus();
              } else {
                $('#login_submit_login').css('display','inline');
                clearRecaptcha();
              }
            });
    } else {
      $('#login_submit_login').css('display','inline');
      clearRecaptcha();
    }
  }
  
  //
  //
  //
  function buildRecaptcha()
  {    
    clearRecaptcha();

    $("#login_register_login").unbind('click');
    $("#login_register_login").click(function() {
      auth.mode = 'register';
      $('#login_form').submit();
    });

    auth.mode = 'recaptcha';
    $('#recaptcha').append('\n  <span id="recaptcha_widget"></span>');
    $('#recaptcha_widget').append('\n  <span id="recaptcha_image" style="cursor:pointer"></span>');
    $('#recaptcha_widget').append('\n  <span id="recaptcha_prompt"></span>');
    $('#recaptcha_prompt').append('\n  <span class="recaptcha_only_if_image">Enter the words above </span>');
    $('#recaptcha_prompt').append('\n  <span class="recaptcha_only_if_audio">Enter the numbers you hear </span>');
    $('#recaptcha_widget').append('\n  <input type="text" id="recaptcha_response_field" name="recaptcha_response_field" />');
    $('#login_response').append('\n  <span class="recaptcha_only_if_incorrect_sol"></span>');

    $("#recaptcha_image").click(Recaptcha.reload);

    Recaptcha.create(config.recaptch,
    "recaptcha", {
       theme: "custom"
    });
    
  }


  //
  //
  //
  function clearRecaptcha()
  {    
    $("#login_register_login").unbind('click');
    $("#login_register_login").click(buildRecaptcha);
    $('#recaptcha').empty();
  }  

  //
  //
  //
  function toggleDialog()
  {    
    var u = $('#login_username');
    var dialog = $('#login_dialog');

    if (dialog.css('display') == 'none') {
      dialog.css('display','inline');
      $(this).addClass('login_button');
      if (0 == u.val().length || openid()) {
        u.focus();
      } else {
        $('#login_secret').focus().select();
      }
    } else {
      dialog.css('display','none');
      $('#login_username').val('');
      $('#login_secret').val('');
      $('#login_submit_login').css('display','inline');
      $('#login_register_login').css('display','none');
      auth.mode = '';
      clearRecaptcha();
      $(this).removeClass('login_button');
      $(this).blur();
    }

    auth.mode = '';

  }  

  ///
  //
  //
  function resetHeaders() {

    if ( typeof( auth.headers) != "undefined" ) {
      delete auth.headers;
    }

    if ( typeof( auth.digest) != "undefined" ) {
      delete auth.digest;
    }

    var ncx = '00000000' + ((++auth.nc)-0).toString(16);
    ncx = ncx.substring(ncx.length-8);

    auth.cnonce = (Math.random()).toString();
    
    auth.headers = {
      'uri' : auth.uri,
      'nc' : ncx,
      'debug' : 0,
      'username' : $('#login_username').val()
    };

  }

  ///
  //
  //
  function toggleSubmitButton(displayed) {
    if (displayed) {
      $('#login_submit_content').css('display','inline');
    } else {
      $('#login_submit_content').css('display','none');
    }
  }

  //
  //
  //
  function openid()
  {
    return false; // TODO

    var u = $('#login_username');
    var uc = $('#login_username_content');

    var s = $('#login_secret');
    var sc = $('#login_secret_content');

    var is_openid = u.hasClass('openid');

    var uv = u.val();

    if (uv.length > 0
        && uv.indexOf('http://') >= 0 ) {

      if (!is_openid) {
        var tw = uc.attr('offsetWidth') + sc.attr('offsetWidth');
        var uw = u.attr('offsetWidth');

        var lul = $('#login_username_label');
        lul.attr('original_text',lul.text()).text('OpenID');

        sc.css('display','none');

        u.addClass('openid').attr('original_width',uw);
        u.width(tw - lul.attr('offsetWidth'));
        $('#login_submit_login').val('unsupported');

      }
      return true;

    } else if (is_openid) {

      sc.css('display','inline');
      u.removeClass('openid').width(u.attr('original_width')).removeAttr('original_width');
      $('#login_submit_login').val('Go');

      var lul = $('#login_username_label');
      lul.text(lul.attr('original_text')).remoteAttr('original_text');

    }
    return false;
  }

  //
  //
  //
  function digest(s)
  {
    // Fallback to MD5 if requested algorithm is unavilable.
    if (typeof ( window[auth.headers.algorithm] ) != 'function') {
      if (typeof ( $['md5'] ) != 'function') {
        respond('MD5 digest unavialable. ');
        return false;
      } else {
        return $.md5(s);
      }
    }

    return window[auth.headers.algorithm](s);
  }

  //
  //
  //
  function buildResponseHash()
  {
    if (auth.headers.salt) {
      auth.secret = auth.secret + ':' + auth.headers.salt;
      delete auth.headers.salt;
    }
    if (auth.headers.migrate) {
      auth.secret = digest(auth.secret);
    }

    var A1 = digest(auth.headers.username + ':' + auth.headers.realm + ':' + auth.secret);
    delete auth.secret;
    var A2 = digest(auth.method + ':' + auth.headers.uri);
    var R = digest(A1+':'
                   + auth.headers.nonce + ':'
                   + auth.headers.nc + ':'
                   + auth.headers.cnonce + ':'
                   + auth.headers.qop + ':'
                   + A2);

    if (auth.headers.debug) {
      $('#login_response').append('REQUEST: ('
      + '( ' + auth.headers.username + ':'
      + auth.headers.realm + ':XXXX:' + auth.headers.salt
      + ') = A1:' + A1 + ':'
      + auth.headers.nonce + ':'
      + auth.headers.nc + ':'
      + auth.headers.cnonce + ':'
      + auth.headers.qop + ':'
      + A2 + ' =(' + auth.method + ' : ' + auth.headers.uri + ')'
      + ' = R:' + R);
    }

    if (auth.mode == 'register') {
      return A1;
    }
    return R;
  }

  //
  //
  //
  function buildAuthenticationRequest() {
    var request = auth.scheme;
    delete auth.scheme;

    auth.headers.cnonce = digest(auth.cnonce);

    var comma = ' ';
    for (name in auth.headers) {
      request += comma + name + '="' + escape(auth.headers[name]) + '"';
      comma = ',';
    }
    
    // don't continue further if there is no algorithm yet.
    if (typeof( auth.headers.algorithm ) == 'undefined') {
      return request;
    }
    
    var r = buildResponseHash();
    if (r) {
      request += comma + auth.mode + '="' + escape(r) + '"';
      return request;
    }

    return false;
  }

  //
  //
  //
  function parseAuthenticationResponse(h) {

    var scre = /^\w+/;
    var scheme = scre.exec(h);
    auth.scheme = scheme[0];

    var nvre = /(\w+)=['"]([^'"]+)['"]/g;
    var pairs = h.match(nvre);

    var vre = /(\w+)=['"]([^'"]+)['"]/;
    var i = 0;
    for (; i<pairs.length; i++) {
      var v = vre.exec(pairs[i]);
      if (v) {

        // global headers object
        auth.headers[v[1]] = v[2];

      }
    }

/*
    // TODO
    // Load the algorithm on-demand.
    // Probably requires some sychronization/semaphores to ensure the digest
    // isn't attempted until the algorithm is fully loaded.
    // Until this is working, either all possible algorithms have to be loaded
    // manually or only the session-defined algorithm will be used.
    if (typeof( auth.headers.algorithm ) != 'undefined'
      && typeof( window[auth.headers.algorithm] ) == 'undefined') {
      $.getScript("3rdparty/webtoolkit/" + auth.headers.algorithm + ".js",
        function(data, text) {
          auth.digest = eval(auth.headers.algorithm);
        }
      );
    }
*/
  }

  //
  //
  //
  function beginAuthentication()
  {
    if (openid()) {
      $('#login_username').focus().select();
      return false;
    }

    var username = $('#login_username').val();
    var secret = $('#login_secret').val();

    if (!openid() && !secret) {
      $('#login_secret_label').css('color','red');
    }
    if (!username) {
      $('#login_username_label').css('color','red');
    }

    var recaptcha = 'ok';
    if (auth.mode == 'register') {
      recaptcha = $('#recaptcha_response_field').val();
      $('#recaptcha_prompt').css('color','red');
    }
    if ((!openid() && !secret) || !username || !recaptcha) {
      return false;
    }

    toggleSubmitButton(false);
    if (auth.mode == 'register') {
      respond('Registering...');
    } else {
      respond('Authenticating...');
    }

    resetHeaders();

    if (auth.mode == 'register') {
      auth.headers.salt = $('#recaptcha_challenge_field').val();
      auth.headers.recaptcha_response = $('#recaptcha_response_field').val();
    }

    auth.secret = secret;
    $('#login_secret').val('');

    auth.status = 0;
    authenticate();
  }

  //
  //
  //
  function authenticate()
  {
    $.ajax({
      url: auth.uri,
      cache: false,
      type: auth.method,

      beforeSend: function(client) {
        var h = buildAuthenticationRequest();
        if (h) {
          client.setRequestHeader('Authenticate', h);
          return true;
        } else {
          return false;
        }
      },

      success: function(result) {
        auth.status = 0;
        resetHeaders();
        if (!auth.headers.debug) {
          window.location.href = 'login';
        }
      },

      complete: function(result) {
        switch (result.status) {
          case 200:
            break;
          case 401:
            if (auth.status != 401) {
              var h = result.getResponseHeader('WWW-Authenticate');
              parseAuthenticationResponse(h);
              if (auth.headers.debug) {
                $("#login_response").append('RESPONSE: ' + h);
              }
              auth.status = 401;
              authenticate();
              break;
            }
          default:
            toggleSubmitButton(true);
            if (auth.headers.debug) {
              $("#login_response").append(result.responseText);
            } else {
              respond(result.responseText);
            }
            if (auth.mode == 'register') {
              Recaptcha.reload();
            }
            break;
        }
      }
     });
  }

  //
  //
  //
  function respond(s,append) {
    var r = $('#login_response');
    if (!s && r.text().length != 0) {
      r.text('');
      return;
    }
  	if (r.is(":animated")) {
  		r.stop();
    }
    r.fadeTo(0,1).show();
    if (append) {
      r.append(s);
    } else {
      r.text(s);
    }
    if (!auth.headers.debug) {
      //r.fadeOut(5000);
    }
  }

  //
  //
  //
  function colorize(on,what) {
    respond();
    what.css('color',(on.val().length == 0 ? 'red' : 'black'));
  }
  
})(jQuery);
