package server

import (
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
)

func initCounters() {
	addr, isset := os.LookupEnv("AGENT_URL")
	if !isset {
		log.Fatal("AGENT_URL env variable is not set")
	}

	url := fmt.Sprintf("%s/counters/json", addr)

	http.HandleFunc("/metrics", func(w http.ResponseWriter, r *http.Request) {
		resp, err := http.Get(url)

		if err != nil {
			log.Printf("Error getting agent counters url %s: %v\n", url, err)
			http.Error(w, "Server error", 500)
			return
		}

		defer resp.Body.Close()
		body, err := io.ReadAll(resp.Body)
		if err != nil {
			log.Printf("ERROR reading response body: %v\n", err)
			http.Error(w, "Server error", 500)
			return
		}

		w.Write(body)
	})
}
