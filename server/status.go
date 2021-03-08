package server

import (
	"fmt"
	"io"
	"log"
	"net/http"
	"os"

	"sigs.k8s.io/yaml"
)

func initStatus() {
	http.HandleFunc("/status", func(w http.ResponseWriter, r *http.Request) {

		addr, isset := os.LookupEnv("AGENT_URL")
		if !isset {
			log.Fatal("AGENT_URL env variable is not set")
		}

		url := fmt.Sprintf("%s/status", addr)

		resp, err := http.Get(url)

		if err != nil {
			log.Printf("Error getting agent status url %s: %v\n", url, err)
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

		json, err := yaml.YAMLToJSON(body)
		if err != nil {
			log.Printf("ERROR converting yaml to json: %v\n", err)
			http.Error(w, "Server error", 500)
			return
		}

		w.Write(json)
	})

}
