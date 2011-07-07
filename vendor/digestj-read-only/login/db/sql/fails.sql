CREATE TABLE fails (
  sid varchar2(64) NOT NULL,
  created date NOT NULL,
  ip varchar(64) NOT NULL,
  agent varchar(512),
  header varchar(2048)
);
