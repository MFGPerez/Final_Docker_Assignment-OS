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
    volumes:
      - ./docker-entrypoint-initdb.d:/docker-entrypoint-initdb.d # use the init.sql file on start up from the dir 

  Above we can see the mariaDB section we aded, this section contains the image we will be using (latest in this case) then we restart the db allways and finally the eviroment variables and volumes. 
  These enviroment variables provide the information the DB will need upon launching we need a root password, database name, user and password for the user. 

  The volumes section specifys in this case where we will execute our sql for creating and seeding the database. 
  that is what ./docker-entrypoint-initdb.d:/docker-entrypoint-initdb.d is a folder containing init.sql that has code to create our database book_store and our relevant tables. This is like a cmd that executes on load, it will serch the directory for a init.sql file and then execute the code. 

  The next section is to make sure our node-js app depends on the maria db, which means that before our node.js app container runs our mariadb container should be up and running. The enviroment variables specify to the node.js app what to connect to. ex- we need to connect to the db via the user and password to access the data withing book_store. 
  
  depends_on:
      - mariadb
    environment:
      DB_HOST: mariadb
      DB_ROOT_PASSWORD: PasswordR00T
      DB_DATABASE: book_store
      DB_USERNAME: Marcel_G  
      DB_PASSWORD: Pa$$w00rd

The next section was altering the nginx section we had, this gave me the most trouble and it came because the nginx server container was running and connecting to the node.js app before the node.js app was fully ready to accept connections, this resulted in errors. 
To fix this I had to add somthing caled wait for. 

  depends_on: 
      - wait-for-nodejs
    command: ["./wait-for", "nodejs-app:8080", "--", "nginx", "-g", "daemon off;"]

  wait-for-nodejs:
    build:
      context: .
      dockerfile: Dockerfile.wait-for-nodejs


a bove we have the nginx code depending on the  - wait-for-nodejs this like the previous discussion tells the nginx service to wait untill the  - wait-for-nodejs container is up and running. The command section is a custom command ./wait-for is calling wait-for script, the argument nodejs-app:8080 is to let the script know to wait for the nodejs-app to be available at port 8080. 
The last argument nginx -g "daemon off;" is nginx options to start the service ensuring it runs in the forground (daemon off;). 
Then the   wait-for-nodejs is a custom service it builds a custom container called Dockerfile.wait-for-nodejs this is to allow wating for nodejs-app before starting the nginx service 

The custom container is a additional docker file I set up in the project. 

RUN npm install wait-for

CMD ["./node_modules/.bin/wait-for"]    

Above we have the docker file the key words from, workdir, copy are the same as I explaned in the previous asssignment so we will not focus on them. The section RUN npm install wait-for is to install a wait-for package in the npm registry. This will be used to delay the following commands until a condition is met. 
The cmd section tells the container what default command to run one the container starts, hear it runs the wait-for script in the node_modules/.bin directory and is executed using the relative path /usr/src/app. 

2. changing the app.js functionality.
   The idea is the same the only thing that changed is the data we use for the response.
   So first we make a connection object (mysql.createConnection) and store it in the connection variable the arguments are the configuration options which are passed into the function. We get the values by pulling them from the enviroment variables we set up in our yml file. 
   
   const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE    
});

Then we need to make a connection to the db, a function is passed in it that is used for error handling if it fails ill throw an error then return but if it works ill log that a connection has been established. 

Then we define the route and what will be called when a request is made to it. In this case the we use app.get then specify our route then the function that will be called. 
In this function we make a queary const query = 'SELECT * FROM books'; then we use connection.query() to execute the qeary 
and like the other connection method there is a call back function that is used for error handling if somthing happens info will be displayed on the error. If everything goes well we get a json response ->  res.json(results)

This same process happens for the next pice of code, the only change is that we pass the id we want in the connection method -> connection.query(query, [id], function(err, results)

Finally we set up a variable that is set to the enviroment variables port number and if that fails we will default to port 8080 -> const PORT = process.env.PORT || 8080;. 
We then set the server to listen on the port for incoming requests -> app.listen(PORT, function() and once one comes the function will be called to log that the server is running on that port number -> console.log(`Server is running on port ${PORT}`);

The rest of the files have remained the same. 

TO RUN THIS APPLICATION SEE THE INSTRUCTIONS BELOW. 

1. download all the files to your device. 
2. in the terminal cd into the directory where these files reside.
3. once we are at the correct directory run the following cmd ->  docker-compose build
4. Then run the following command to start the containers ->  docker-compose up
5. open your browser and go to -> http://localhost:8080/api/books
6. You should be able to see all the books and select which book using the ids -> 1, 2, 3 ex - http://localhost:8080/api/books/1
7. To check the status of the containers you can run -> docker ps
8. To stop the containers run the following cmd -> docker stop $(docker ps -a -q)

   END. 



Challenge #4 

To scale up the current application we can run the following command: docker-compose up --scale nodejs-app=3
This will tell Docker compose to scale up our app to 3 instances, which will run concurrently. 

The benefits from this are the following 
With more instances handling requests the performance of the app will increase 
If one instance fails the whole app will not shut down since there are multiple instances, we would just use another instance. 
The stability can increase since we are distributing the load among multiple instances, like a pulley if we add more then the weight will be evenly distributed making it easter to pull heavy objects. 
We can scale it up by adding more instances without having to mess around with the core. 
Unfortunately I cant get the stats to load on my web page. 
