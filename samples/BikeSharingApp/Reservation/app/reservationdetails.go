// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package main

import (
	"encoding/json"
	"errors"
)

// ReservationDetails for bike reservations as read from the mongoDB.
type ReservationDetails struct {
	ReservationID string `bson:"reservationId" json:"reservationId"`
	BikeID        string `bson:"bikeId" json:"bikeId"`
	UserID        string `bson:"userId" json:"userId"`
	RequestTime   string `bson:"requestTime" json:"requestTime"`
	StartTime     string `bson:"startTime" json:"startTime"`
	EndTime       string `bson:"endTime" json:"endTime"`
	State         string `bson:"state" json:"state"`
	RequestId	  string `bson:"requestId" json:"requestId"`
}

func (reservationDetails ReservationDetails) Validate() error {
	var errorSlice []string
	var zeroString string

	if reservationDetails.ReservationID == zeroString {
		errorSlice = append(errorSlice, "Must specify reservationId string")
	}
	if reservationDetails.BikeID == zeroString {
		errorSlice = append(errorSlice, "Must specify bikeId string")
	}
	if reservationDetails.UserID == zeroString {
		errorSlice = append(errorSlice, "Must specify userId string")
	}
	if reservationDetails.RequestTime == zeroString {
		errorSlice = append(errorSlice, "Must specify requestTime string")
	}
	if reservationDetails.StartTime == zeroString {
		errorSlice = append(errorSlice, "Must specify startTime string")
	}
	if reservationDetails.State == zeroString {
		errorSlice = append(errorSlice, "Must specify state string")
	}
	if reservationDetails.RequestId == zeroString {
		errorSlice = append(errorSlice, "Must specify requestId string")
	}

	if len(errorSlice) > 0 {
		errorBytes, _ := json.Marshal(errorSlice)
		return errors.New(string(errorBytes))
	}

	return nil
}
