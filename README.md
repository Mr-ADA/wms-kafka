# microservice-kafka-monitoring

This is a project that uses Apache Kafka (using KafkaJS) to send monitoring data to a monitoring service which will gauge the microservice performance based on number of request coming in and processing time of the requests

## Microservice:

1. Admin Service
   Login, Registration Feature, Homepage
2. Monitoring Service
   Monitoring Display, and Metrics (Number of Request and Processing Time)

## Tools used:

1. Node.js
2. KafkaJS
3. MongoDB
4. Docker

## Running the project:

1. docker-compose build (build the image)
2. docker-compose up (run the containers)

## :

1. CTRL + C (to stop the program)
1. docker-compose down (to remove docker containers)
1. docker-compose down -v (to remove the volumes)
