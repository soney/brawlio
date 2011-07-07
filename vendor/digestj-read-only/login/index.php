<?php

$REVISIONS[__FILE__] = '$URL: http://digestj.googlecode.com/svn/trunk/login/index.php $ $Date: 2008-08-11 22:04:18 -0700 (Mon, 11 Aug 2008) $';

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

// http://tools.ietf.org/html/rfc2617

#$CONFIG['debugging'] = 1;

include_once('../config.php');
include('users.php');

if (isset($_REQUEST['check'])) {
  header('HTTP/1.1 200 OK');
  $user = get_user($_REQUEST['check']);
  if (isset($user)) {
    print $user['username'];
  }
  exit(0);
}

if (is_authenticated()) {
  header('HTTP/1.1 200 OK');
  header('Location: ..');
  exit(0);
}

authenticate();

function authenticate()
{
  global $CONFIG;

  $error= '';

  $data = array(
    // Default the algorithm to the session's
    'algorithm' => $_SESSION['algorithm'],
    'HTTP_AUTHENTICATE' => $_SERVER['HTTP_AUTHENTICATE']
  );

  if (empty($data['HTTP_AUTHENTICATE'])) {
    $data['HTTP_AUTHENTICATE'] = $_REQUEST['HTTP_AUTHENTICATE'];
  }

  $data['HTTP_AUTHENTICATE'] = stripslashes($data['HTTP_AUTHENTICATE']);

  // Only proceed if there is an HTTP_AUTHENTICATE header
  if (!empty($data['HTTP_AUTHENTICATE'])) {

    // Parse out the name/value pairs
    preg_match_all('@(\w+)=[\'"]?([^\'",]+)[\'"]?@', $data['HTTP_AUTHENTICATE'], $matches, PREG_SET_ORDER);

    foreach ($matches as $m) {
      $data[$m[1]] = $m[2];
    }

    // Look for the user.
    $data['user'] = get_user($data['username']);

    // Process to register if there is a register in the header and the user doesn't exists.
    if ($data['register'] && empty($data['user']))
    {
      require_once('../3rdparty/recaptcha/recaptchalib.php');

      if ($data["recaptcha_response"]) {
        $data['captcha'] = recaptcha_check_answer($CONFIG['recaptcha']['private'],
                                                  $_SERVER["REMOTE_ADDR"],
                                                  $data["salt"],
                                                  $data["recaptcha_response"]);

        if ($data['captcha']->is_valid) {
          $data['user'] = array(
            'username' => $data['username'],
            'user' => 1,
            'realm' => $data['realm'],
            'salt' => $data['salt'],
            'algorithm' => $data['algorithm'],
            'hash' => $data['register']
          );

          if (save_user($data['user'])) {
            $_SESSION['response'] = $R;
            $_SESSION['authenticated'] = $data['username'];
            header('HTTP/1.1 200 OK');
            print "Ok";
            dump_debugging_data($data);
            exit(0);
          }
          $error = 'Can not write to database.';
        }
      }
    }

    // Process to verification if there is a response in the header and the user exists.
    if ($data['response'] && $data['user'])
    {

      $data['A1'] = $data['user']['hash'];
      $data['A2'] = hash($data['algorithm'], $_SERVER['REQUEST_METHOD'].':'.$data['uri']);
      $data['R'] = hash($data['algorithm'], 
                        $data['A1'].':'
                        .$data['nonce'].':'
                        .$data['nc'].':'
                        .$data['cnonce'].':'
                        .$data['qop'].':'
                        .$data['A2']);

      if (!strcasecmp($data['response'],$data['R']))
      {
        save_auth($data['user']);
        $_SESSION['response'] = $R;
        $_SESSION['authenticated'] = $data['username'];
        header('HTTP/1.1 200 OK');
        print "Ok";
        dump_debugging_data($data);
        exit(0);
      }
      save_fail($data);

    }

  }

  // There needs to be a persistent store to minitor login attempts over time.
  // - If a single user has too many failures, they need to be given assistance.
  // - If there are too main failures from a single IP in a short amount of time,
  //   they need to be warned. This can partially be dealt with using the session
  //   but certainly an attacker wouldn't be saving the session key.

  // To support standard Digest, simply change this to Digest instead of DigestJ
  $response = 'WWW-Authenticate: ' . $CONFIG['scheme']
          .' realm="'.$_SESSION['realm'].'"'
          .',nonce="'.$_SESSION['nonce'].'"'
          .',opaque="'.hash($data['algorithm'],$_SESSION['realm']).'"'
          .',algorithm="'.$data['algorithm'].'"'
          .',qop="'.$_SESSION['qop'].'"'
  ;

  // 
  if (!empty($data['user']['salt'])) {
    # non-standard
    $response .= ',salt="'.get_user_salt($data['username']).'"';
  }

  // 
  if (!empty($CONFIG['migrate'])) {
    # non-standard
    $response .= ',migrate="1"';
  }

  if (is_debugging()) {
    $response .= ',debug="1"';
  }

  header('HTTP/1.1 401 Unauthorized');
  header($response);

  if (!empty($error))
  {
    print $error;
  }
  else if (isset($data['register']))
  {
    if (!empty($data['captcha']))
    {
      print 'Incorrect please try again';
      //$data['captcha']->error
    }
    else
    {
      print "Invalid registration request.";
    }
  }
  else if (isset($data['opaque']))
  {
    print "Your Username or Password is incorrect.";
  }
  else
  {
    print "Invalid request.";
  }

  dump_debugging_data($data);
  exit(401);
}

function dump_debugging_data($data) {
  global $CONFIG;
  
  if (is_debugging()) {
    print "\nA1= "
      . $data['username'] . ':'
      . $data['realm'] . ':'
      . get_user_hash($data['username']);
      
    if ($CONFIG['with_salt']) {
      print ' salt=' . get_user_salt($data['username']);
    }
    
    print "\n\t{$data['A1']}\nA2= "
      . $_SERVER['REQUEST_METHOD'] . ':' . $data['uri'] . "\n\t"
      . $data['A2'] ."\nR= "
      . $data['A1'] . ':'
      . $data['nonce'] . ':'
      . $data['nc'] . ':'
      . $data['cnonce'] . ':'
      . $data['qop'] . ':'
      . $data['A2']. "\n\t"
      . $data['R']."\n";

    print_r($data);
    print_r($CONFIG);
    print_r($_SESSION);
    //print_r($_SERVER);
    //print_r($_REQUEST);
  }
}
?>