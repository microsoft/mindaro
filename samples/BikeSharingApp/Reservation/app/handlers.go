// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package main

import (
	"fmt"
	"net/http"

	"gopkg.in/mgo.v2/bson"

	"encoding/json"

	"github.com/gorilla/mux"
)

func HelloHandler(w http.ResponseWriter, req *http.Request) {
	fmt.Fprintf(w, "It's-a-me Mario.")
}

func addReservationHandler(w http.ResponseWriter, req *http.Request) {
	jsonDecoder := json.NewDecoder(req.Body)
	reservationDetails := ReservationDetails{}
	if err := jsonDecoder.Decode(&reservationDetails); err != nil {
		http.Error(w, "BadRequest: Invalid request body.", http.StatusBadRequest)
		return
	}

	if err := reservationDetails.Validate(); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	LogInfo("Inserting reservation document for reservationId: %s", reservationDetails.ReservationID)
	InsertDocument(reservationDetails)
}

func getReservationHandler(w http.ResponseWriter, req *http.Request) {
	varsMap := mux.Vars(req)
	reservationID := varsMap["reservationId"]
	var queryResult ReservationDetails
	query := bson.M{"reservationId": reservationID}
	LogInfo("Querying for reservationId: %s", reservationID)
	if err := QueryOne(query, &queryResult); err != nil {
		LogError("Couldn't get reservation for reservationId: %s. Reason: %v", reservationID, err)
		http.Error(w, fmt.Sprintf("BadRequest: %v", err), http.StatusBadRequest)
		return
	}

	if queryResult == (ReservationDetails{}) {
		LogError("No reservation found for reservationId: %s", reservationID)
		http.Error(w, fmt.Sprintf("BadRequest: No reservation found for reservationId: %s", reservationID), http.StatusBadRequest)
		return
	}

	LogInfo("Reservation found for reservationId: %s", reservationID)
	w.Header().Set("Content-Type", "application/json")
	jsonResponse, _ := json.Marshal(queryResult)
	fmt.Fprintf(w, string(jsonResponse))
}

func getAllReservationsHandler(w http.ResponseWriter, req *http.Request) {
	var queryResult []ReservationDetails
	LogInfo("Getting all reservations")
	if err := QueryAll(bson.M{}, &queryResult); err != nil {
		LogError("Couldn't get all reservations. Reason: %v", err)
		http.Error(w, fmt.Sprintf("InternalServerError: %v", err), http.StatusInternalServerError)
		return
	}

	LogInfo("Returning %d reservations", len(queryResult))
	w.Header().Set("Content-Type", "application/json")
	jsonResponse, _ := json.Marshal(queryResult)
	fmt.Fprintf(w, string(jsonResponse))
}

func listReservationsHandler(w http.ResponseWriter, req *http.Request) {
	varsMap := mux.Vars(req)
	userID := varsMap["userId"]
	var queryResult []ReservationDetails
	query := bson.M{"userId": userID}
	LogInfo("Querying reservations for userId: %s", userID)
	if err := QueryAll(query, &queryResult); err != nil {
		LogError("Couldn't get reservations for userId: %s. Reason: %v", userID, err)
		http.Error(w, fmt.Sprintf("BadRequest: %v", err), http.StatusBadRequest)
		return
	}

	LogInfo("Found %d reservations for userId: %s", len(queryResult), userID)
	w.Header().Set("Content-Type", "application/json")
	jsonResponse, _ := json.Marshal(queryResult)
	fmt.Fprintf(w, string(jsonResponse))
}
