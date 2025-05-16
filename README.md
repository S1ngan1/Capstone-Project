# Capstone-Project
Repository for our capstone project

# Current Docker test

## 1. Create the folder and files

>mkdir docker-backend
>
>cd docker-backend

Paste the above files into this folder

## 2. Build the Docker image

>docker build -t rn-backend .

## 3. Run the container

>docker run -p 3000:3000 --name
>
>simple-backend rn-backend

## 4. Test

>curl http://localhost:3000

Should return: "Hello World from Docker Backend!"

## 5. Terminate and remove container

>docker stop simple-backend
>
>docker rm simple-backend