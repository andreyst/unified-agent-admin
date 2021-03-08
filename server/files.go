package server

import (
	"fmt"
	"log"
	"net/http"
	"os"
)

func initFiles() {
	dir, isset := os.LookupEnv("STATIC_DIR")
	if !isset {
		log.Fatal("STATIC_DIR env variable is not set")
	}
	fmt.Println(dir)
	http.Handle("/", http.FileServer(http.Dir(dir)))
}
