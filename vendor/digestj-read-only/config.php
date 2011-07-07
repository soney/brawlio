<?php

if (!isset($CONFIG)) {
  $CONFIG = array(//'debugging'=>1,
  'recaptcha' => array(
    'public' => '',
    'private' => ''
  ),
  'google_key' => ''
  );
}

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

$REVISIONS[__FILE__] = '$URL: http://digestj.googlecode.com/svn/trunk/config.php $ $Date: 2008-08-11 13:31:33 -0700 (Mon, 11 Aug 2008) $';
$ROOT = dirname(__FILE__);
include_once($ROOT.'/session/session.php');

?>
