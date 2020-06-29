FROM golang:1.8

# Bundle app source
RUN mkdir /app
ADD /app /app
WORKDIR /app

# Get dependencies and build
RUN go get -d -v
RUN go build -o main . 

# Bind to port 80
EXPOSE 80

# Start Go server
ENTRYPOINT ["/app/main"]
