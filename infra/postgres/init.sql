-- Runs once, on first boot of an empty postgres volume.
-- One Postgres instance, one database + role per service, so the services stay
-- as isolated as they would be on separate hosts without paying for a second
-- container locally.
--
-- Credentials match each service's application.yml defaults, so running a
-- service natively against this database needs no extra configuration.

CREATE ROLE authservice_user WITH LOGIN PASSWORD 'authservice_pass';
CREATE DATABASE authservice OWNER authservice_user;

CREATE ROLE workout WITH LOGIN PASSWORD 'workout';
CREATE DATABASE workoutdb OWNER workout;
