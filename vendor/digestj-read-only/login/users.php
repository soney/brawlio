<?php

$REVISIONS[__FILE__] = '$URL: http://digestj.googlecode.com/svn/trunk/login/users.php $ $Date: 2008-08-11 22:04:18 -0700 (Mon, 11 Aug 2008) $';

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


if (!isset($CONFIG)) {
  return;
}

/**
 * 
 */
function get_db()
{
  $user_db = dirname(__FILE__) . '/db/auth.db';
  if (is_writeable($user_db)) {
    return new PDO('sqlite:'.$user_db);
  }
  return null;
}

/**
 * Returns the user object.
 */
function get_user($user)
{
  $db = get_db();
  if (!empty($db)) {
    $stmt = $db->prepare("select * from users where username = ?");
    $stmt->bindParam(1, substr($user,0,1023));
    $stmt->execute();
    return $stmt->fetch();
  }
  return null;
}

/**
 *
 */
function save_user($user)
{
  $db = get_db();
  if (!empty($db)) {
    $sql = "insert into users (created,username,algorithm,hash,salt,realm) values(datetime('now'),?,?,?,?,?)";
    $stmt = $db->prepare($sql);
    $stmt->bindParam(1, substr($user['username'],0,1023));
    $stmt->bindParam(2, substr($user['algorithm'],0,29));
    $stmt->bindParam(3, substr($user['hash'],0,255));
    $stmt->bindParam(4, substr($user['salt'],0,511));
    $stmt->bindParam(5, substr($user['realm'],0,255));
    $stmt->execute();
    // fetch newly created uid
    $user = get_user($user['username']);
    return save_auth($user);
  }
  return null;
}

/**
 *
 */
function save_auth($user)
{
  if (empty($user)) {
    return -1;
  }
  $sql = "insert into auths (created,sid,uid,ip,agent) values(datetime('now'),?,?,?,?)";
  $db = get_db();
  if (!empty($db)) {
    $stmt = $db->prepare($sql);
    $stmt->bindParam(1, substr($_SESSION['id'],0,63));
    $stmt->bindParam(2, $user['uid']);
    $stmt->bindParam(3, substr($_SERVER['REMOTE_ADDR'],0,63));
    $stmt->bindParam(4, substr($_SERVER['HTTP_USER_AGENT'],0,511));
    $stmt->execute();
    return $user['uid'];
  }
  return null;
}

/**
 *
 */
function save_fail($data)
{
  if (empty($data)) {
    return;
  }
  $db = get_db();
  if (!empty($db)) {
    $sql = "insert into fails (created,sid,ip,agent,header) values(datetime('now'),?,?,?,?)";
    $stmt = $db->prepare($sql);
    $stmt->bindParam(1, substr($_SESSION['id'],0,63));
    $stmt->bindParam(2, substr($_SERVER['REMOTE_ADDR'],0,63));
    $stmt->bindParam(3, substr($_SERVER['HTTP_USER_AGENT'],0,511));
    $stmt->bindParam(4, substr($data['HTTP_AUTHENTICATE'],0,2047));
    $stmt->execute();
  }
}

/**
 * Returns the user's hash from the user data store.
 */
function get_user_hash($user)
{
  $ua = get_user($user);
  if (empty($ua)) {
    return NULL;
  }
  return $ua['hash'];
}

/**
 * Generates a salt.
 */
function get_salt($user)
{
  $now = time();
  $rnd = uniqid($now.'.'.mt_rand(4096,65535).'.',true);
  return dechex($now).hash($_SESSION['algorithm'],$_SERVER['SERVER_NAME'].':'.$username.':'.$rnd);
}


/**
 * Returns the salt for a particular user.
 * This should return a salt even if the users doesn't exist
 * so that it isn't a means to identify valid users.
 */
function get_user_salt($user)
{
  $ua = get_user($user);
  if (empty($ua)) {
    return get_salt('guest');
  }
  return $ua['salt'];
}

?>