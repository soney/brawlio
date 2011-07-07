<?php

$REVISIONS[__FILE__] = '$URL: http://digestj.googlecode.com/svn/trunk/session/session.php $ $Date: 2008-08-08 18:16:15 -0700 (Fri, 08 Aug 2008) $';

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

if (!isset($CONFIG)) {
  return;
}

default_config();
initialize_session();

function default_config()
{
  global $CONFIG;
  
  // Always set now to now. Don't allow it to be overridden in config.php
  $CONFIG['now'] = time();
  $CONFIG['scheme'] = 'DigestJ';
  
  $DEFAULTS = array(
    // 
    'title'     => $_SERVER['SERVER_NAME'],

    // 
    'sid'       => 'sid',

    // 
    'expires'   => 86400,
    
    // Digest algorithm
    'algorithm' => 'MD5',

    // Use salt
    // Enabling this renders this digest incompatible with RFC 2617.
    'with_salt' => 0,

    // Digest realm
    'realm'     => 'Authenticate',

    // The cound of how many too_fast requests initiates throttling.
    'throttle'  => 5,

    // The number of seconds that indicates a request was too soon since the last.
    'too_fast'  => 3, 

    // 
    'debugging' => 0
  );
  
  foreach ($DEFAULTS as $k => $v) {
    if (!isset($CONFIG[$k])) {
      $CONFIG[$k] = $v;
    }
  }
}

/**
 *
 */
function is_authenticated()
{
  return !empty($_SESSION['authenticated']);
}

/**
 *
 */
function initialize_session_server_value($name)
{
  if (!empty($name)) {
    initialize_session_value($name,$_SERVER[$name]);
  }
}

/**
 *
 */
function initialize_session_value($name,$value)
{
  if (!empty($name) && isset($value) && !isset($_SESSION[$name])) {
    $_SESSION[$name] = $value;
  }
}

/**
 *
 */
function verify_session_server_value($name)
{
  $verify = (!empty($name) && $_SESSION[$name] == $_SERVER[$name]);
  //print "$name : $_SESSION[$name] : $_SERVER[$name]<br/>\n";
  return $verify;
}

/**
 *
 */
function verify_session($name)
{
  
  // Get any current a session id.
  if (isset($_COOKIE[$name])) {
    $sessid = $_COOKIE[$name];
  } else if (isset($_GET[$name])) {
    $sessid = $_GET[$name];
  }

  if (isset($sessid)) {

    // Verify that the id is actually vadily formatted.
    if (!preg_match('/^[a-z0-9]{32}$/', $sessid)) {
      // Otherwise, remove it
      session_unset();
      if (isset($_COOKIE[$name])) {
        unset($_COOKIE[$name]);
      } else if (isset($_GET[$name])) {
        unset($_GET[$name]);
      }
      return false;
    }

  }
  
  return true;
}


/**
 *
 */
function deauthenticate()
{
  if (is_authenticated())
  {
    session_destroy();
    session_unset();
  }
}

/**
 *
 */
function initialize_session()
{
  global $CONFIG;

  // TODO Need to configure the session to be
  // limited to the path for this "session".

  $name = $CONFIG['sid'];
  
  session_name($name);
  verify_session($name);

  session_start();

  // Throttle requests. Sessions that request again within 3 seconds
  // increases throttle count.
  if (isset($_SESSION['last']) && ($CONFIG['too_fast'] > $CONFIG['now'] - $_SESSION['last'])) {
    if (isset($_SESSION['throttle'])) {
      $_SESSION['throttle'] = $_SESSION['throttle'] + 1;
    } else {
      $_SESSION['throttle'] = 1;
    }
  } else {
    unset($_SESSION['throttle']);
  }

  // Verify that certain session variables are the same.
  // This helps ensure that sessions aren't transported.
  // If
  // - There are too many requests in a row, throttle > 5
  // - They're from different client IP addresses
  // - Using a different client
  // - There is no expiration time
  // - It is now beyond the expiration
  // Then end the session.
  if ($_SESSION['throttle'] > $CONFIG['throttle']
      || (is_authenticated()
         && (!verify_session_server_value('REMOTE_ADDR')
         || !verify_session_server_value('HTTP_USER_AGENT')
         || empty($_SESSION['expires'])
         || $_SESSION['expires'] < time()))) {
          // Expired or replay attempted.
    session_destroy();
    session_unset();
    session_start();
  }
  else if (is_authenticated())
  {
    // There appears to be a valid session so
    // create a new session id so that it's more
    // difficult for malicious users to replay a session.
    session_regenerate_id(true);
  }
    
  $count = 1;
  if (isset($_SESSION['count'])) {
    $count = $_SESSION['count'] + 1;
  }
  $_SESSION['count'] = $count;

  if (isset($_SESSION['REQUEST_TIME'])) {
    $_SESSION['rate'] = round(($CONFIG['now'] - $_SESSION['REQUEST_TIME']) / $count, 2);
  }

  $_SESSION['last'] = $CONFIG['now'];
  $_SESSION['debugging'] = $CONFIG['debugging'];
  $_SESSION['id'] = session_id();
  $_SESSION['name'] = session_name();

  // Do it this way to keep from executing rand in function parameters.
  // Versus calling initialize_session_value.
  if (!isset($_SESSION['nonce']))
  {

    initialize_session_value('session_script',__FILE__);
    
    $_SESSION['nonce'] = dechex(time()).hash('SHA256',uniqid(dechex(mt_rand(4096,65535)),true));

    // This algorithm requires that the algorithm is supported on the server and
    // on the client. The client name for the function should be exactly the
    // same as this algorithm name.
    //initialize_session_value('algorithm','SHA256');
    initialize_session_value('algorithm',$CONFIG['algorithm']);
    
    initialize_session_value('qop','auth');
    initialize_session_value('realm',$CONFIG['realm']);
    initialize_session_value('opaque',hash($_SESSION['algorithm'],$_SESSION['realm']));
    
    // Session expiration
    initialize_session_value('expires',$_SERVER['REQUEST_TIME'] + $CONFIG['expires']);

    // Tracking
    initialize_session_server_value('REMOTE_ADDR');
    initialize_session_server_value('REQUEST_TIME');
    initialize_session_server_value('REQUEST_URI');
    initialize_session_server_value('HTTP_USER_AGENT');
    initialize_session_server_value('HTTP_ACCEPT');
    initialize_session_server_value('HTTP_ACCEPT_LANGUAGE');
    initialize_session_server_value('HTTP_ACCEPT_ENCODING');
   }

  return true;
}

/**
 *
 */
function is_debugging()
{
  return (!empty($_SESSION['debugging']));
}

/**
 *
 */
function print_debug($name, $data, $comments = 1)
{
  if ($comments) {
    print '<!-- ';
  }
  print "$name = ";
  print_r($data);
  if ($comments) {
    print ' ->';
  }
}

/**
 *
 */
function debugging($comments = 1)
{
  global $REVISIONS, $CONFIG;
  
  if (is_debugging())
  {
    print_debug('session_id', $_SESSION['id'], $comments);
    print_debug('CONFIG', $CONFIG, $comments);
    print_debug('REQUEST', $_REQUEST, $comments);
    print_debug('SESSION', $_SESSION, $comments);
    print_debug('SERVER', $_SERVER, $comments);
    print_debug('REVISION', $REVISIONS, $comments);
  }
}

?>