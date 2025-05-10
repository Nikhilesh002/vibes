package main

import (
	"fmt"
	"log"
	"net/http"
)

func main() {
	log.Println("Nikki hi")

	http.HandleFunc("/", handleRoute)

	http.ListenAndServe(":3000", nil)
}

func handleRoute(w http.ResponseWriter, r http.Request) http.HandlerFunc {
	fmt.Fprintf(w, "My first REST API")

	w.Write([]byte("nikki"))
}
