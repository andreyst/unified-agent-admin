package main

import (
	"agent-config/server"
	"log"

	"github.com/joho/godotenv"
)

func main() {
	err := godotenv.Load()
	if err != nil {
		log.Fatal("Error loading .env file")
	}

	server.StartServer()
}

// TODO: Add status proxy converting yaml to json with https://github.com/kubernetes-sigs/yaml
// TODO: Add serving HTML page && styles with http.FileServer
// TODO: Draw graph with https://gojs.net/latest/index.html
