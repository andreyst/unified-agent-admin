package server

import (
	"fmt"
	"log"
	"net/http"
	"os"
)

// StartServer - starts HTTP server
func StartServer() {
	initCounters()
	initFiles()
	initStatus()

	port, isset := os.LookupEnv("PORT")
	if !isset {
		log.Fatal("PORT env variable is not set")
	}

	addr := fmt.Sprintf(":%s", port)
	log.Fatal(http.ListenAndServe(addr, nil))
}
