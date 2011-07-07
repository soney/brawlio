<?php

$REVISIONS[__FILE__] = '$URL: http://digestj.googlecode.com/svn/trunk/index.php $ $Id: index.php 96 2008-07-05 14:21:55Z nicerobot $';

// Copyright 2008, nicerobot.org

// This file is part of DigestJ.
// 
// DigestJ is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
// 
// DigestJ is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
// 
// You should have received a copy of the GNU General Public License
// along with DigestJ.  If not, see <http://www.gnu.org/licenses/>.

// References:
// http://tools.ietf.org/html/rfc2617
// http://crypto.stanford.edu/PwdHash/pwdhash.pdf

include_once('config.php');

?><!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en" lang="en"><head>
<meta http-equiv="Content-Type" content="text/html; charset=iso-8859-1" />
<meta name="revised" content="$Date: 2008-08-11 13:31:33 -0700 (Mon, 11 Aug 2008) $" />
<title><?php print $CONFIG['title']; ?></title>
<script src="http://www.google.com/jsapi?key=<?php print $CONFIG['google_key']; ?>" type="text/javascript"></script>
<script language="Javascript" type="text/javascript">//<![CDATA[
google.load("jquery", "1.2.6");
var config = { recaptch:'<?php print $CONFIG['recaptcha']['public']; ?>' }; //]]></script>
<?php if (!is_authenticated()) { ?><link href="login/jquery.login.css" rel="stylesheet" type="text/css"/><?php } ?>
</head><body><div>
<span style="float:left; margin-right:5px"><?php print $CONFIG['title']; ?></span>
<?php

if (!is_authenticated()) {

  if (empty($CONFIG['google_key'])) {
    print "\n".'<br/>This requires a <a href="http://code.google.com/apis/ajaxsearch/signup.html">Google AJAX Search API Key</a>';
  }
  if (empty($CONFIG['recaptcha']['public'])) {
    print "\n".'<br/>This requires a <a href="http://recaptcha.net/whyrecaptcha.html">reCAPTCHA Keys</a><br/>';
  }

  if (!empty($CONFIG['google_key']) && !empty($CONFIG['recaptcha']['public'])) { ?>
<a href="#" id="login_button">log in</a>
<script type="text/javascript" src="login/jquery.login.js"></script>
<script type="text/javascript" > //<![CDATA[
  $(document).ready(function() { $('#login_button').login(); });
//]]></script>
<script type="text/javascript"  src="http://api.recaptcha.net/js/recaptcha_ajax.js"></script>
<script type="text/javascript" src="3rdparty/webtoolkit/<?php print $_SESSION['algorithm']; ?>.js"></script><?php
  }
} else {
  
?>
<span id="logout_content">
  <span id="logout_button"><a href="logout">log out</a></span>
</span><?php

}

?></div></body></html>
