# Docker_Final_Assignment explanation

This is my read me file for my assignment, I will go over how this app will work and the steps I took to achive them.

Challange 3: We are tasked to add a DB to our previous assignment insted of using an array like i did in the prev assignment
we will need to pull our info from a DB.

To do this I did the following.

1. Updated the docker compose yml file.
   To add a DB I went with mariaDB and to do this I had to add it to the docker yml file along with all the configurations we where give nin the assignment.

mariadb:
image: mariadb:latest
restart: always
environment:
MYSQL_ROOT_PASSWORD: PasswordR00T
MYSQL_DATABASE: book_store
MYSQL_USER: Marcel_G
MYSQL_PASSWORD: Pa$$w00rd
volumes: - ./docker-entrypoint-initdb.d:/docker-entrypoint-initdb.d # use the init.sql file on start up from the dir

Above we can see the mariaDB section we aded, this section contains the image we will be using (latest in this case) then we restart the db allways and finally the eviroment variables and volumes.
These enviroment variables provide the information the DB will need upon launching we need a root password, database name, user and password for the user.

The volumes section specifys in this case where we will execute our sql for creating and seeding the database.
that is what ./docker-entrypoint-initdb.d:/docker-entrypoint-initdb.d is a folder containing init.sql that has code to create our database book_store and our relevant tables. This is like a cmd that executes on load, it will serch the directory for a init.sql file and then execute the code.

The next section is to make sure our node-js app depends on the maria db, which means that before our node.js app container runs our mariadb container should be up and running. The enviroment variables specify to the node.js app what to connect to. ex- we need to connect to the db via the user and password to access the data withing book_store.

depends_on: - mariadb
environment:
DB_HOST: mariadb
DB_ROOT_PASSWORD: PasswordR00T
DB_DATABASE: book_store
DB_USERNAME: Marcel_G  
 DB_PASSWORD: Pa$$w00rd
 
The next section was altering the nginx section we had, this gave me the most trouble and it came because the nginx server container was running and connecting to the node.js app before the node.js app was fully ready to accept connections, this resulted in errors.
To fix this I had to add somthing caled wait for.

depends_on: - wait-for-nodejs
command: ["./wait-for", "nodejs-app:8080", "--", "nginx", "-g", "daemon off;"]

wait-for-nodejs:
build:
context: .
dockerfile: Dockerfile.wait-for-nodejs

a bove we have the nginx code depending on the - wait-for-nodejs this like the previous discussion tells the nginx service to wait untill the - wait-for-nodejs container is up and running. The command section is a custom command ./wait-for is calling wait-for script, the argument nodejs-app:8080 is to let the script know to wait for the nodejs-app to be available at port 8080.
The last argument nginx -g "daemon off;" is nginx options to start the service ensuring it runs in the forground (daemon off;).
Then the wait-for-nodejs is a custom service it builds a custom container called Dockerfile.wait-for-nodejs this is to allow wating for nodejs-app before starting the nginx service

The custom container is a additional docker file I set up in the project.

RUN npm install wait-for

CMD ["./node_modules/.bin/wait-for"]

Above we have the docker file the key words from, workdir, copy are the same as I explaned in the previous asssignment so we will not focus on them. The section RUN npm install wait-for is to install a wait-for package in the npm registry. This will be used to delay the following commands until a condition is met.
The cmd section tells the container what default command to run one the container starts, hear it runs the wait-for script in the node_modules/.bin directory and is executed using the relative path /usr/src/app.

2. changing the app.js functionality.
